import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { Text, Surface, useTheme, MD3Theme, Button, TextInput, Divider, List, Switch, ActivityIndicator, HelperText, Snackbar, Chip, SegmentedButtons, FAB, IconButton, Dialog, Portal, Menu } from 'react-native-paper';
import { AlertTriangle, User, Key, Users, RefreshCw, Settings, Shield, ClipboardList, Lock, Database, Building2, CreditCard, FileText, History, Bell, Globe, Clock, Edit, Trash, Plus, X, Check, Tag } from 'lucide-react-native';
import useAuthStore from '../../stores/authStore';
import { UserRole, UserProfile } from '../../../types/user';
import useServiceCategoriesStore, { ServiceCategory } from '../../../stores/serviceCategoriesStore';
// AuthService import removed

function AdministratorSettings() {
  const theme = useTheme<MD3Theme>();
  const { user, hasRole, isLoading, error, updateProfile, resetPassword, checkNetworkStatus, syncWithServer } = useAuthStore();
  
  // Local state for offline status
  const [isOffline, setIsOffline] = useState(false);
  
  // State for user management
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // State for form inputs
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  
  // State for UI
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showProfileFields, setShowProfileFields] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // State for tabs
  const [activeTab, setActiveTab] = useState('users');
  const tabs = [
    { value: 'users', label: 'Users', icon: Users },
    { value: 'system', label: 'System', icon: Settings },
    { value: 'security', label: 'Security', icon: Shield },
    { value: 'organization', label: 'Organization', icon: Building2 },
    { value: 'categories', label: 'Service Categories', icon: Tag },
    { value: 'audit', label: 'Audit Logs', icon: History },
    { value: 'data', label: 'Data Management', icon: Database }
  ];
  
  // Service categories state
  const { categories, addCategory, updateCategory, removeCategory, resetCategories } = useServiceCategoriesStore();
  const [categoryDialogVisible, setCategoryDialogVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('');
  const [categoryTimeSlot, setCategoryTimeSlot] = useState('');
  const [categoryNameError, setCategoryNameError] = useState('');
  const [confirmDeleteDialogVisible, setConfirmDeleteDialogVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState<string | null>(null);
  
  // Load users on component mount
  useEffect(() => {
    loadUsers();
    checkNetworkStatus().then(isOnline => setIsOffline(!isOnline));
  }, []);
  
  // Load all users from storage
  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      // Mock empty users array since AuthService is missing
      const allUsers: UserProfile[] = [];
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      showSnackbar('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }, []);
  
  // Select a user for editing
  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDisplayName(user.displayName);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setNameError('');
    setShowPasswordFields(false);
    setShowProfileFields(false);
  };
  
  // Reset password for selected user
  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    // Validate password
    if (!newPassword || newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    try {
      await resetPassword(selectedUser.email, newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordFields(false);
      showSnackbar(`Password reset for ${selectedUser.email}`);
    } catch (error) {
      console.error('Failed to reset password:', error);
      showSnackbar('Failed to reset password');
    }
  };
  
  // Update profile for selected user
  const handleUpdateProfile = async () => {
    if (!selectedUser) return;
    
    // Validate name
    if (!displayName.trim()) {
      setNameError('Name cannot be empty');
      return;
    }
    
    try {
      await updateProfile(selectedUser.id, { displayName });
      showSnackbar(`Profile updated for ${selectedUser.email}`);
      setShowProfileFields(false);
      loadUsers(); // Reload users to get updated data
    } catch (error) {
      console.error('Failed to update profile:', error);
      showSnackbar('Failed to update profile');
    }
  };
  
  // Toggle user active status
  const handleToggleUserActive = async (userId: string, isActive: boolean) => {
    try {
      await AuthService.updateUserStatus(userId, isActive);
      showSnackbar(`User status updated`);
      loadUsers(); // Reload users to get updated data
    } catch (error) {
      console.error('Failed to update user status:', error);
      showSnackbar('Failed to update user status');
    }
  };
  
  // Sync with server
  const handleSync = async () => {
    try {
      // Call syncWithServer from auth store
      const success = await syncWithServer();
      
      if (success) {
        showSnackbar('Sync completed successfully');
      } else {
        showSnackbar('Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      showSnackbar('Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  // Show snackbar message
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };
  
  // Handle adding/editing service category
  const handleOpenCategoryDialog = (category?: ServiceCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.label);
      setCategoryIcon(category.icon);
      setCategoryTimeSlot(category.timeSlot);
    } else {
      setEditingCategory(null);
      setCategoryName('');
      setCategoryIcon('');
      setCategoryTimeSlot('');
    }
    setCategoryNameError('');
    setCategoryDialogVisible(true);
  };
  
  const handleSaveCategory = () => {
    // Validate inputs
    if (!categoryName.trim()) {
      setCategoryNameError('Category name is required');
      return;
    }
    
    if (editingCategory) {
      // Update existing category
      updateCategory(editingCategory.id, {
        label: categoryName.trim(),
        icon: categoryIcon.trim() || 'tag',
        timeSlot: categoryTimeSlot.trim() || '12:00',
      });
      showSnackbar(`Category "${categoryName}" updated successfully`);
    } else {
      // Add new category
      const newId = categoryName.toLowerCase().replace(/\s+/g, '_');
      addCategory({
        id: newId,
        label: categoryName.trim(),
        icon: categoryIcon.trim() || 'tag',
        timeSlot: categoryTimeSlot.trim() || '12:00',
      });
      showSnackbar(`Category "${categoryName}" added successfully`);
    }
    
    setCategoryDialogVisible(false);
  };
  
  // Handle deleting service category
  const handleDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setConfirmDeleteDialogVisible(true);
    setCategoryMenuVisible(null);
  };
  
  const confirmDeleteCategory = () => {
    if (categoryToDelete) {
      removeCategory(categoryToDelete);
      showSnackbar('Category deleted successfully');
      setCategoryToDelete(null);
      setConfirmDeleteDialogVisible(false);
    }
  };
  
  // If not admin, show unauthorized message
  if (!hasRole('admin')) {
    return (
      <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen 
          options={{
            title: 'Administrator Settings',
            headerTitleStyle: {
              fontWeight: '500',
            },
            headerTintColor: theme.colors.onPrimary,
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
          }}
        />
        
        <Surface 
          style={[styles.content, { backgroundColor: theme.colors.errorContainer }]}
          elevation={1}
        >
          <AlertTriangle size={48} color={theme.colors.error} style={styles.icon} />
          <Text 
            variant="headlineSmall" 
            style={{ color: theme.colors.onErrorContainer, marginBottom: 8 }}
          >
            Unauthorized Access
          </Text>
          <Text 
            variant="bodyLarge"
            style={{ color: theme.colors.onErrorContainer, textAlign: 'center' }}
          >
            You do not have permission to access this section.
          </Text>
        </Surface>
      </Surface>
    );
  }
  
  // Admin view
  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{
          title: 'Administrator Settings',
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: '500',
          },
        }}
      />
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={tabs.map(tab => ({
            value: tab.value,
            label: tab.label,
            icon: ({ size, color }) => <tab.icon size={size} color={color} />,
          }))}
          style={styles.tabButtons}
        />
      </ScrollView>
      
      <ScrollView style={styles.scrollView}>
        {/* Network Status */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.cardHeader}>
            <RefreshCw size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.cardTitle}>Network Status</Text>
          </View>
          <Divider style={styles.divider} />
          
          <View style={styles.cardContent}>
            <View style={styles.statusRow}>
              <Text variant="bodyMedium">Online Status:</Text>
              <View style={[styles.statusIndicator, { backgroundColor: isOffline ? theme.colors.error : theme.colors.primary }]}>
                <Text style={styles.statusText}>{isOffline ? 'Offline' : 'Online'}</Text>
              </View>
            </View>
            
            <Button 
              mode="contained" 
              onPress={handleSync} 
              style={styles.button}
              disabled={isOffline || isLoading}
              loading={isLoading}
            >
              Sync with Server
            </Button>
          </View>
        </Surface>

        {/* Tab Navigation */}
        <Surface style={styles.card} elevation={1}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={setActiveTab}
            buttons={tabs.map(tab => ({
              value: tab.value,
              label: tab.label,
              icon: tab.icon,
            }))}
            style={styles.tabButtons}
          />
        </Surface>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <Surface style={styles.card} elevation={1}>
            <View style={styles.cardHeader}>
              <Users size={24} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>User Management</Text>
            </View>
            <Divider style={styles.divider} />
            
            {loadingUsers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text variant="bodyMedium" style={{ marginTop: 8 }}>Loading users...</Text>
              </View>
            ) : (
              <View style={styles.cardContent}>
                {users.length === 0 ? (
                  <Text variant="bodyMedium">No users found</Text>
                ) : (
                  <List.Section style={styles.userList}>
                    {users.map((user) => (
                      <List.Item
                        key={user.id}
                        title={user.displayName}
                        description={`${user.email} (${user.role})`}
                        left={props => <User {...props} size={24} color={theme.colors.primary} />}
                        right={props => (
                          <Switch
                            value={user.isActive}
                            onValueChange={() => handleToggleUserActive(user.id, !user.isActive)}
                          />
                        )}
                        onPress={() => handleSelectUser(user)}
                        style={[styles.userItem, !user.isActive && styles.inactiveUser]}
                      />
                    ))}
                  </List.Section>
                )}
              </View>
            )}
          </Surface>
        )}

        {activeTab === 'system' && (
          <Surface style={styles.card} elevation={1}>
            <View style={styles.cardHeader}>
              <Settings size={24} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>System Configuration</Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.cardContent}>
              <List.Item
                title="Application Settings"
                description="Configure global application preferences"
                left={props => <Settings {...props} size={24} color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <List.Item
                title="Notification Settings"
                description="Manage notification templates and preferences"
                left={props => <Bell {...props} size={24} color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <List.Item
                title="Integration Settings"
                description="Configure third-party services and APIs"
                left={props => <Globe {...props} size={24} color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
            </View>
          </Surface>
        )}

        {activeTab === 'security' && (
          <Surface style={styles.card} elevation={1}>
            <View style={styles.cardHeader}>
              <Shield size={24} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>Security Settings</Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.cardContent}>
              <List.Item
                title="Password Policies"
                description="Configure password requirements and complexity"
                left={props => <Lock {...props} size={24} color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <List.Item
                title="Session Management"
                description="Configure session timeouts and controls"
                left={props => <Clock {...props} size={24} color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <List.Item
                title="Access Control"
                description="Manage IP restrictions and access policies"
                left={props => <Shield {...props} size={24} color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
            </View>
          </Surface>
        )}

        {activeTab === 'organization' && (
          <Surface style={styles.card} elevation={1}>
            <View style={styles.cardHeader}>
              <Building2 size={24} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>Organization Settings</Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.cardContent}>
              <List.Item
                title="Practice Information"
                description="Manage clinic details and contact information"
                left={props => <Building2 {...props} size={24} color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <List.Item
                title="Business Hours"
                description="Configure operating hours and availability"
                left={props => <Clock {...props} size={24} color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <List.Item
                title="Billing Information"
                description="Manage payment and billing settings"
                left={props => <CreditCard {...props} size={24} color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
            </View>
          </Surface>
        )}

        {activeTab === 'audit' && (
          <Surface style={styles.card} elevation={1}>
            <View style={styles.cardHeader}>
              <History size={24} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>Audit Logs</Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.cardContent}>
              <List.Item
                title="Activity Logs"
                description="View comprehensive activity logging"
                left={props => <History {...props} size={24} color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <List.Item
                title="User Actions"
                description="Track user actions and changes"
                left={props => <User {...props} size={24} color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <List.Item
                title="Export Reports"
                description="Generate and export audit reports"
                left={props => <FileText {...props} size={24} color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
            </View>
          </Surface>
        )}

        {activeTab === 'data' && (
          <Surface style={styles.card} elevation={1}>
            <View style={styles.cardHeader}>
              <Database size={24} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>Data Management</Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.cardContent}>
              <List.Item
                title="Backup & Restore"
                description="Manage automated backups and restoration"
                left={props => <Database {...props} size={24} color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <List.Item
                title="Data Import"
                description="Import data in bulk"
                left={props => <FileText {...props} size={24} color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <List.Item
                title="Data Export"
                description="Export data in multiple formats"
                left={props => <FileText {...props} size={24} color={theme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
            </View>
          </Surface>
        )}

        {/* Selected User Details */}
        {selectedUser && (
          <Surface style={styles.card} elevation={1}>
            <View style={styles.cardHeader}>
              <User size={24} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>{selectedUser.displayName}</Text>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.cardContent}>
              <List.Item
                title="Email"
                description={selectedUser.email}
                left={props => <Text {...props}>📧</Text>}
              />
              <List.Item
                title="Role"
                description={selectedUser.role}
                left={props => <Shield {...props} size={24} color={theme.colors.primary} />}
              />
              <List.Item
                title="Status"
                description={selectedUser.isActive ? 'Active' : 'Inactive'}
                left={props => <Text {...props}>{selectedUser.isActive ? '✅' : '❌'}</Text>}
              />
              
              <Divider style={styles.divider} />
              
              {/* Profile Management */}
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => setShowProfileFields(!showProfileFields)}
              >
                <Settings size={20} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.actionText}>Edit Profile</Text>
              </TouchableOpacity>
              
              {showProfileFields && (
                <View style={styles.formContainer}>
                  <TextInput
                    label="Display Name"
                    value={displayName}
                    onChangeText={setDisplayName}
                    mode="outlined"
                    error={!!nameError}
                    style={styles.input}
                  />
                  {nameError ? <HelperText type="error">{nameError}</HelperText> : null}
                  
                  <Button 
                    mode="contained" 
                    onPress={handleUpdateProfile} 
                    style={styles.button}
                  >
                    Update Profile
                  </Button>
                </View>
              )}
              
              {/* Password Reset */}
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => setShowPasswordFields(!showPasswordFields)}
              >
                <Key size={20} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.actionText}>Reset Password</Text>
              </TouchableOpacity>
              
              {showPasswordFields && (
                <View style={styles.formContainer}>
                  <TextInput
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    mode="outlined"
                    error={!!passwordError}
                    style={styles.input}
                  />
                  
                  <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    mode="outlined"
                    error={!!passwordError}
                    style={styles.input}
                  />
                  
                  {passwordError ? <HelperText type="error">{passwordError}</HelperText> : null}
                  
                  <Button 
                    mode="contained" 
                    onPress={handleResetPassword} 
                    style={styles.button}
                  >
                    Reset Password
                  </Button>
                </View>
              )}
            </View>
          </Surface>
        )}
      {activeTab === 'categories' && (
        <View style={styles.scrollView}>
          <Surface style={styles.card} elevation={1}>
            <View style={styles.cardHeader}>
              <Tag size={24} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>Service Categories</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.cardContent}>
              <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
                Manage service categories for appointments and scheduling. These categories determine the types of services offered to patients.
              </Text>
              
              {categories.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text>No service categories found</Text>
                  <Button 
                    mode="contained" 
                    onPress={() => handleOpenCategoryDialog()} 
                    style={styles.button}
                    icon={({ size, color }) => <Plus size={size} color={color} />}
                  >
                    Add Category
                  </Button>
                </View>
              ) : (
                <FlatList
                  data={categories}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <Surface style={styles.categoryItem} elevation={0}>
                      <View style={styles.categoryContent}>
                        <View style={styles.categoryInfo}>
                          <Text variant="titleMedium">{item.label}</Text>
                          <Text variant="bodySmall">Time Slot: {item.timeSlot}</Text>
                          <Text variant="bodySmall">Icon: {item.icon}</Text>
                        </View>
                        <View style={styles.categoryActions}>
                          <IconButton
                            icon={({ size, color }) => <Edit size={size} color={color} />}
                            size={20}
                            onPress={() => handleOpenCategoryDialog(item)}
                          />
                          <IconButton
                            icon={({ size, color }) => <Trash size={size} color={color} />}
                            size={20}
                            onPress={() => handleDeleteCategory(item.id)}
                            iconColor={theme.colors.error}
                          />
                        </View>
                      </View>
                    </Surface>
                  )}
                  contentContainerStyle={styles.categoriesList}
                />
              )}
            </View>
          </Surface>
          
          <FAB
            icon={({ size, color }) => <Plus size={size} color={color} />}
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleOpenCategoryDialog()}
            color={theme.colors.onPrimary}
          />
        </View>
      )}
      </ScrollView>
      
      {/* Service Category Dialog */}
      <Portal>
        <Dialog visible={categoryDialogVisible} onDismiss={() => setCategoryDialogVisible(false)}>
          <Dialog.Title>{editingCategory ? 'Edit Category' : 'Add New Category'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Category Name"
              value={categoryName}
              onChangeText={setCategoryName}
              mode="outlined"
              error={!!categoryNameError}
              style={styles.input}
            />
            {categoryNameError ? <HelperText type="error">{categoryNameError}</HelperText> : null}
            
            <TextInput
              label="Icon Name (optional)"
              value={categoryIcon}
              onChangeText={setCategoryIcon}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., heart-pulse, needle, medical-bag"
            />
            
            <TextInput
              label="Time Slot (optional)"
              value={categoryTimeSlot}
              onChangeText={setCategoryTimeSlot}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., 09:00, 14:30"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCategoryDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSaveCategory}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Confirm Delete Dialog */}
      <Portal>
        <Dialog visible={confirmDeleteDialogVisible} onDismiss={() => setConfirmDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Category</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Are you sure you want to delete this category? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmDeleteCategory} textColor={theme.colors.error}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </Surface>
  );
}

// Import withAuth HOC
import withAuth from '../../../components/withAuth';
import { AuthService } from '@/src/services/authService';

// Export protected component with admin role requirement
export default withAuth(AdministratorSettings);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardTitle: {
    marginLeft: 12,
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  button: {
    marginTop: 16,
  },
  icon: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontWeight: '500',
  },
  userList: {
    width: '100%',
  },
  userItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  inactiveUser: {
    opacity: 0.6,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginVertical: 8,
  },
  actionText: {
    marginLeft: 12,
    fontWeight: '500',
  },
  formContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  tabButtons: {
    margin: 16,
  },
  tabScrollContainer: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  categoryContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoriesList: {
    paddingBottom: 80, // Space for FAB
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  }
});
