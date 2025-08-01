import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Switch 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

import { storage } from '../../utils/storage';
import apiService from '../../services/api';

const SettingsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    loadHouseholdInfo();
  }, []);

  const loadHouseholdInfo = async () => {
    try {
      const household = await storage.getHousehold();
      if (household) {
        setHouseholdName(household.name);
        setInviteCode(household.inviteCode);
      }
    } catch (error) {
      console.error('Failed to load household info:', error);
    }
  };

  const handleLeaveHousehold = () => {
    Alert.alert(
      'Leave Household',
      'Are you sure you want to leave this household? You will need an invite code to rejoin.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = await storage.getUser();
              if (user) {
                await apiService.leaveHousehold(user.id);
                await storage.removeUser();
                await storage.removeHousehold();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Onboarding' }],
                });
              }
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to leave household',
              );
            }
          },
        },
      ]
    );
  };

  const handleShareInviteCode = () => {
    Alert.alert(
      'Share Invite Code',
      `Share this code with family members: ${inviteCode}`,
      [
        {
          text: 'Copy Code',
          onPress: () => {
            // In a real app, you would use the Share API or Clipboard API
            Alert.alert('Copied!', 'Invite code copied to clipboard');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Household Information</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Household Name</Text>
          <Text style={styles.infoValue}>{householdName}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Invite Code</Text>
          <Text style={styles.infoValue}>{inviteCode}</Text>
        </View>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareInviteCode}
        >
          <Text style={styles.shareButtonText}>Share Invite Code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Enable Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#767577', true: '#6200EE' }}
            thumbColor={notificationsEnabled ? '#f4f3f4' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleLeaveHousehold}
        >
          <Text style={styles.dangerButtonText}>Leave Household</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  shareButton: {
    backgroundColor: '#6200EE',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  dangerButton: {
    backgroundColor: '#ff5252',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;