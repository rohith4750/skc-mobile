import React, { useState } from 'react';
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
import { ArrowLeft, Layers, Tag, Info, IndianRupee, Trash2, CheckCircle2 } from 'lucide-react-native';
import { Colors, Shadows, Radii } from '../theme/colors';
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
      const msg = error?.data?.error || 'We couldn\'t save this item.';
      showToast(msg, 'error');
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to remove this dish?',
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
              const backendError = error?.data?.error;
              const details = error?.data?.details;
              
              if (backendError === 'Cannot delete item') {
                Alert.alert(
                  'Cannot Delete',
                  details || 'This item is in use. Deactivate it instead?',
                  [
                    { text: 'Cancel', style: 'cancel' },
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
          <Icon size={16} color={Colors.textTertiary} style={styles.inputIcon} />
          <TextInput
            style={[styles.fieldText, multiline && styles.fieldInputArea]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.textTertiary}
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
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')} 
            style={styles.navBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
             <Text style={styles.headerTitle}>{isEditing ? 'Edit Dish' : 'Add Dish'}</Text>
             <Text style={styles.headerSub}>{isEditing ? 'Modify dish details' : 'Add to catering menu'}</Text>
          </View>
          {isEditing && (
            <TouchableOpacity 
              style={styles.deleteBtn} 
              onPress={handleDelete}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.formSection, Shadows.small]}>
            <Text style={styles.sectionTitle}>Basic Details</Text>
            
            {renderInput('Dish Name *', formData.name, (t) => setFormData({...formData, name: t}), 'Enter dish name', Layers)}
            {renderInput('Telugu Name', formData.nameTelugu, (t) => setFormData({...formData, nameTelugu: t}), 'తెలుగు పేరు', Tag)}
            
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setFormData({ ...formData, type: cat })}
                    style={[styles.categoryTab, formData.type === cat && styles.activeTab]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.categoryText, formData.type === cat && styles.activeTabText]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.formSection, Shadows.small]}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            
            <View style={styles.rowFields}>
              <View style={{ flex: 1.5 }}>
                {renderInput('Base Price (₹) *', formData.price, (t) => setFormData({...formData, price: t}), '0.00', IndianRupee, 'numeric')}
              </View>
              <View style={{ flex: 1 }}>
                {renderInput('Unit', formData.unit, (t) => setFormData({...formData, unit: t}), 'PLATE/KG', Info)}
              </View>
            </View>

            {renderInput('Description', formData.description, (t) => setFormData({...formData, description: t}), 'Brief item description...', Info, 'default', true)}
          </View>

          <View style={[styles.formSection, Shadows.small]}>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Common Item</Text>
                <Text style={styles.toggleSub}>Fast selector item</Text>
              </View>
              <Switch
                value={formData.isCommon}
                onValueChange={(v) => setFormData({...formData, isCommon: v})}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={formData.isCommon ? Colors.primary : Colors.textTertiary}
              />
            </View>

            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Active Status</Text>
                <Text style={styles.toggleSub}>Visible in menu</Text>
              </View>
              <Switch
                value={formData.isActive}
                onValueChange={(v) => setFormData({...formData, isActive: v})}
                trackColor={{ false: Colors.border, true: Colors.successLight }}
                thumbColor={formData.isActive ? Colors.success : Colors.textTertiary}
              />
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.actionFooter}>
           <TouchableOpacity 
             style={[styles.confirmBtn, loading && styles.btnDisabled]} 
             onPress={handleSave}
             disabled={loading}
             activeOpacity={0.8}
           >
             {loading ? <ActivityIndicator color={Colors.white} size="small" /> : <CheckCircle2 size={18} color={Colors.white} />}
             <Text style={styles.confirmText}>{isEditing ? 'Update Dish' : 'Save Dish'}</Text>
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
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerInfo: {
    flex: 1,
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: Colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  content: {
    flex: 1,
    padding: 18,
  },
  formSection: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  fieldContent: {
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
  fieldArea: {
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  fieldText: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: Colors.text,
  },
  fieldInputArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.white,
    fontWeight: '700',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  toggleSub: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  actionFooter: {
    padding: 18,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: Radii.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Shadows.small,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default MenuItemFormScreen;
