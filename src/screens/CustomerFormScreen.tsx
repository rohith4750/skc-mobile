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
import { ArrowLeft, User, Phone, Mail, MapPin, Save } from 'lucide-react-native';
import { Colors, Shadows, Radii } from '../theme/colors';
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
          <Icon size={16} color={Colors.textTertiary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, multiline && styles.textArea]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.textTertiary}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
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
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Client' : 'Add Client'}</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.formCard, Shadows.small]}>
            {renderInput(
              'Full Name *', 
              formData.name, 
              (text) => setFormData({...formData, name: text}), 
              'Customer name', 
              User
            )}

            {renderInput(
              'Phone Number *', 
              formData.phone, 
              (text) => setFormData({...formData, phone: text}), 
              'Mobile number', 
              Phone,
              'phone-pad'
            )}

            {renderInput(
              'Email Address', 
              formData.email, 
              (text) => setFormData({...formData, email: text}), 
              'Email address', 
              Mail,
              'email-address'
            )}

            {renderInput(
              'Delivery Address *', 
              formData.address, 
              (text) => setFormData({...formData, address: text}), 
              'Full street address', 
              MapPin,
              'default',
              true
            )}

            {renderInput(
              'Internal Notes', 
              formData.message, 
              (text) => setFormData({...formData, message: text}), 
              'Additional customer preferences or notes', 
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
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Save size={18} color={Colors.white} />
                <Text style={styles.saveButtonText}>{isEditing ? 'Update Client' : 'Save Client'}</Text>
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
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 18,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textAreaContainer: {
    height: 80,
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 10,
  },
  textArea: {
    textAlignVertical: 'top',
    height: '100%',
  },
  footer: {
    padding: 18,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: Radii.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Shadows.small,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CustomerFormScreen;
