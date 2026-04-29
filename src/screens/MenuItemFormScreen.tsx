import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Switch,
  StatusBar,
} from 'react-native';
import { ArrowLeft, Layers, Tag, Info, IndianRupee, Save, Trash2, CheckCircle2 } from 'lucide-react-native';
import { Colors, Shadows } from '../theme/colors';
import { useToast } from '../components/Toast';
import { useCreateMenuItemMutation, useUpdateMenuItemMutation, useDeleteMenuItemMutation } from '../services/menuApi';

const MenuItemFormScreen = ({ route, navigation }: any) => {
  const { showToast } = useToast();
  const editItem = route.params?.item;
  const isEditing = !!editItem;

  const [formData, setFormData] = useState({
    name: editItem?.name || '',
    nameTelugu: editItem?.nameTelugu || '',
    type: Array.isArray(editItem?.type) ? editItem?.type[0] : (editItem?.type || 'LUNCH'),
    price: editItem?.price?.toString() || '',
    description: editItem?.description || '',
    unit: editItem?.unit || 'PLATE',
    isCommon: editItem?.isCommon ?? false,
    isActive: editItem?.isActive ?? true,
  });

  const CATEGORIES = ['LUNCH', 'SNACKS', 'BREAKFAST', 'RETAIL'];

  const [createMenuItem, { isLoading: isCreating }] = useCreateMenuItemMutation();
  const [updateMenuItem, { isLoading: isUpdating }] = useUpdateMenuItemMutation();
  const [deleteMenuItem, { isLoading: isDeleting }] = useDeleteMenuItemMutation();

  const loading = isCreating || isUpdating || isDeleting;

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        nameTelugu: formData.nameTelugu,
        type: [formData.type],
        price: parseFloat(formData.price) || 0,
        unit: formData.unit,
        description: formData.description,
        isCommon: formData.isCommon,
        isActive: formData.isActive,
      };

      if (isEditing) {
        await updateMenuItem({ id: editItem.id, ...payload }).unwrap();
        showToast('Item updated successfully', 'success');
      } else {
        await createMenuItem(payload).unwrap();
        showToast('Item added to menu', 'success');
      }
      navigation.goBack();
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      const msg = error?.data?.error || 'We couldn\'t save this item. Check your connection.';
      showToast(msg, 'error');
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to remove this dish? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMenuItem(editItem.id).unwrap();
              showToast('Item deleted successfully', 'success');
              navigation.goBack();
            } catch (error: any) {
              console.error('Delete Error:', error);
              const backendError = error?.data?.error;
              const details = error?.data?.details;
              
              if (backendError === 'Cannot delete item') {
                Alert.alert(
                  'Cannot Delete',
                  details || 'This item is in use. Would you like to deactivate it instead?',
                  [
                    { text: 'No thanks', style: 'cancel' },
                    { 
                      text: 'Deactivate', 
                      onPress: () => {
                        setFormData({...formData, isActive: false});
                        handleSave();
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('Delete Failed', backendError || 'An error occurred while deleting.');
              }
            }
          }
        }
      ]
    );
  };

  const renderInput = (
    label: string, 
    value: string, 
    onChangeText: (text: string) => void, 
    placeholder: string, 
    icon: any,
    keyboardType: any = 'default',
    multiline: boolean = false
  ) => {
    const Icon = icon;
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={[styles.fieldContent, multiline && styles.fieldArea]}>
          <View style={styles.fieldIcon}>
            <Icon size={18} color={Colors.textSecondary} />
          </View>
          <TextInput
            style={[styles.fieldText, multiline && styles.fieldInputArea]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            keyboardType={keyboardType}
            multiline={multiline}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.premiumHeader}>
          <TouchableOpacity 
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')} 
            style={styles.navBtn}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
             <Text style={styles.headerTitle}>{isEditing ? 'Update Dish' : 'Add New Item'}</Text>
             <Text style={styles.headerSub}>{isEditing ? 'Modify existing menu data' : 'Expand your catering menu'}</Text>
          </View>
          {isEditing && (
            <TouchableOpacity 
              style={styles.deleteBtn} 
              onPress={handleDelete}
              disabled={loading}
            >
              <Trash2 size={22} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            {renderInput('Dish Name', formData.name, (t) => setFormData({...formData, name: t}), 'Enter menu item name...', Layers)}
            {renderInput('Telugu Name', formData.nameTelugu, (t) => setFormData({...formData, nameTelugu: t}), 'తెలుగులో పేరు (ఐచ్ఛికం)', Tag)}
            
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category / Type</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setFormData({ ...formData, type: cat })}
                    style={[styles.categoryTab, formData.type === cat && styles.activeTab]}
                  >
                    <Text style={[styles.categoryText, formData.type === cat && styles.activeTabText]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Pricing & Details</Text>
            
            <View style={styles.rowFields}>
              <View style={{ flex: 1.5 }}>
                {renderInput('Base Price', formData.price, (t) => setFormData({...formData, price: t}), '0.00', IndianRupee, 'numeric')}
              </View>
              <View style={{ flex: 1 }}>
                {renderInput('Unit', formData.unit, (t) => setFormData({...formData, unit: t}), 'PLATE/KG', Info)}
              </View>
            </View>

            {renderInput('Description', formData.description, (t) => setFormData({...formData, description: t}), 'Brief details about the dish...', Info, 'default', true)}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Configuration</Text>
            
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Common Item</Text>
                <Text style={styles.toggleSub}>Always visible in quick selectors</Text>
              </View>
              <Switch
                value={formData.isCommon}
                onValueChange={(v) => setFormData({...formData, isCommon: v})}
                trackColor={{ false: '#E2E8F0', true: Colors.primary + '80' }}
                thumbColor={formData.isCommon ? Colors.primary : '#F8FAFC'}
              />
            </View>

            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Active Status</Text>
                <Text style={styles.toggleSub}>Enable or disable this item from menu</Text>
              </View>
              <Switch
                value={formData.isActive}
                onValueChange={(v) => setFormData({...formData, isActive: v})}
                trackColor={{ false: '#E2E8F0', true: Colors.success + '80' }}
                thumbColor={formData.isActive ? '#22C55E' : '#F8FAFC'}
              />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.actionFooter}>
           <TouchableOpacity 
             style={[styles.confirmBtn, loading && styles.btnDisabled]} 
             onPress={handleSave}
             disabled={loading}
           >
             {loading ? <ActivityIndicator color={Colors.white} /> : <CheckCircle2 size={24} color={Colors.white} />}
             <Text style={styles.confirmText}>{isEditing ? 'Update Menu Item' : 'Save Dish to Menu'}</Text>
           </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 75,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...Shadows.small,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.error + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    ...Shadows.small,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  fieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldArea: {
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  fieldIcon: {
    paddingHorizontal: 15,
  },
  fieldText: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  fieldInputArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.white,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  toggleSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  actionFooter: {
    padding: 24,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    ...Shadows.medium,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

export default MenuItemFormScreen;
