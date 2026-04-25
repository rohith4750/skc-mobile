import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import api from './api';

const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TASK';
const OFFLINE_QUEUE_KEY = 'location_offline_queue';

// The background task definition must be in the global scope
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background Location Error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      const location = locations[0];
      await trackingService.syncLocation(location.coords.latitude, location.coords.longitude);
    }
  }
});

class TrackingService {
  private trackingToken: string | null = null;
  private isForegroundWatchActive = false;
  private watchSubscription: Location.LocationSubscription | null = null;

  /**
   * Set the identity token for the driver/workforce member
   */
  setToken(token: string) {
    this.trackingToken = token;
  }

  getToken() {
    return this.trackingToken;
  }

  /**
   * Request permissions and start tracking (Foreground + Background)
   */
  async startTracking() {
    if (!this.trackingToken) {
      throw new Error('No tracking token assigned. Cannot start tracking.');
    }

    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      throw new Error('Foreground location permission is required to start tracking.');
    }

    // Detect if running inside Expo Go — background location NOT supported there.
    // Use appOwnership ('expo') as it's the most reliable check across SDK versions.
    const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
    console.log('[Tracking] isExpoGo:', isExpoGo, '| appOwnership:', Constants.appOwnership, '| env:', Constants.executionEnvironment);

    // Try background permission — only in built APK, skip entirely in Expo Go.
    let hasBackground = false;
    if (!isExpoGo) {
      try {
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        hasBackground = bgStatus === 'granted';
      } catch (e) {
        console.log('[Tracking] Background permission error, using foreground only.'); 
        hasBackground = false;
      }
    } else {
      console.log('[Tracking] Expo Go detected — skipping background permission, foreground only.');
    }

    // 1. Start Background Tracking (APK only)
    if (hasBackground) {
      try {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 10, // 10 meters
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'SKC Caterers Tracking',
            notificationBody: 'Delivering orders...',
            notificationColor: '#FF6B00',
          },
        });
      } catch (e) {
        console.log('[Tracking] Could not start background task:', e);
      }
    }

    // 2. Start Foreground Watch (always works — Expo Go + APK)
    this.isForegroundWatchActive = true;
    this.watchSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      },
      (location) => {
        this.syncLocation(location.coords.latitude, location.coords.longitude);
      }
    );

    return { success: true, bgMode: hasBackground };
  }

  /**
   * Stop all tracking services
   */
  async stopTracking() {
    this.isForegroundWatchActive = false;
    
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }

    const isTaskRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isTaskRunning) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }

    if (this.trackingToken) {
      // Notify backend to stop tracking
      try {
        await api.post('/delivery/stop', { token: this.trackingToken });
      } catch (err) {
        console.error('Failed to notify backend of stop', err);
      }
    }
  }

  /**
   * Sync coordinates with the backend. Saves to retry queue if offline.
   */
  async syncLocation(lat: number, lng: number) {
    if (!this.trackingToken) return;

    try {
      await api.post('/delivery/location', {
        token: this.trackingToken,
        lat,
        lng
      });
      // Flush queue on success
      this.flushOfflineQueue();
    } catch (error) {
      console.error('Location sync failed, saving offline', error);
      await this.saveToOfflineQueue({ lat, lng, timestamp: Date.now() });
    }
  }

  private async saveToOfflineQueue(data: { lat: number; lng: number; timestamp: number }) {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      let queue = stored ? JSON.parse(stored) : [];
      queue.push(data);
      // Keep only last 100 points
      if (queue.length > 100) queue = queue.slice(-100);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Could not save to queue', e);
    }
  }

  private async flushOfflineQueue() {
    if (!this.trackingToken) return;
    
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!stored) return;
      
      const queue = JSON.parse(stored);
      if (queue.length === 0) return;

      // In a robust system, we would have a bulk endpoint.
      // For now, sequentially send them or just send the latest and discard the rest.
      // Given Pusher broadcasts latest anyway, sending the latest offline point is sufficient for real-time map.
      const latest = queue[queue.length - 1];
      
      await api.post('/delivery/location', {
        token: this.trackingToken,
        lat: latest.lat,
        lng: latest.lng
      });
      
      await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    } catch (e) {
      console.error('Could not flush queue', e);
    }
  }
}

export const trackingService = new TrackingService();
