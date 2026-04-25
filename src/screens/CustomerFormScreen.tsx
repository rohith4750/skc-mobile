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
} from 'react-native';
import { ArrowLeft, User, Phone, Mail, MapPin, Save, X } from 'lucide-react-native';
import { Colors, Shadows } from '../theme/colors';
import { useCreateCustomerMutation, useUpdateCustomerMutation } from '../services/customerApi';

const CustomerFormScreen = ({ route, navigation }: any) => {
  const editCustomer = route.params?.customer;
  const isEditing = !!editCustomer;

  const [createCustomer] = useCreateCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    message: '',
  });

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: editCustomer.name || '',
        phone: editCustomer.phone || '',
        email: editCustomer.email || '',
        address: editCustomer.address || '',
        message: (editCustomer as any).message || '',
      });
    }
  }, [editCustomer, isEditing]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      Alert.alert('Validation Error', 'Name, Phone, and Address are required.');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await updateCustomer({ id: editCustomer.id, body: formData }).unwrap();
        Alert.alert('Success', 'Customer updated successfully');
      } else {
        await createCustomer(formData).unwrap();
        Alert.alert('Success', 'Customer created successfully');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving customer:', error);
      Alert.alert('Error', 'Failed to save customer. Please check your data.');
    } finally {
      setLoading(false);
    }
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
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputContainer, multiline && styles.textAreaContainer]}>
          <View style={styles.iconContainer}>
            <Icon size={18} color={Colors.textSecondary} />
          </View>
          <TextInput
            style={[styles.input, multiline && styles.textArea]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.textSecondary}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')} 
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Customer' : 'Add New Customer'}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.formCard}>
            {renderInput(
              'Full Name *', 
              formData.name, 
              (text) => setFormData({...formData, name: text}), 
              'Enter customer name', 
              User
            )}

            {renderInput(
              'Phone Number *', 
              formData.phone, 
              (text) => setFormData({...formData, phone: text}), 
              'Enter phone number', 
              Phone,
              'phone-pad'
            )}

            {renderInput(
              'Email Address', 
              formData.email, 
              (text) => setFormData({...formData, email: text}), 
              'Enter email address', 
              Mail,
              'email-address'
            )}

            {renderInput(
              'Delivery Address', 
              formData.address, 
              (text) => setFormData({...formData, address: text}), 
              'Enter full address', 
              MapPin,
              'default',
              true
            )}

            {renderInput(
              'Internal Notes', 
              formData.message, 
              (text) => setFormData({...formData, message: text}), 
              'Anything specific about this customer?', 
              Mail,
              'default',
              true
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.disabledButton]} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Save size={20} color={Colors.white} />
                <Text style={styles.saveButtonText}>{isEditing ? 'Update Customer' : 'Create Customer'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 75,
    paddingBottom: 15,
    backgroundColor: Colors.white,
    ...Shadows.small,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  scrollContent: {
    padding: 20,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    ...Shadows.small,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    height: 54,
  },
  textAreaContainer: {
    height: 100,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  iconContainer: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
    paddingRight: 15,
  },
  textArea: {
    textAlignVertical: 'top',
    height: '100%',
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    ...Shadows.medium,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CustomerFormScreen;
