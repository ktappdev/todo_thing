import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Share,
  Clipboard 
} from 'react-native';
import apiService from '../../services/api';

import { storage } from '../../utils/storage';

const InviteScreen = () => {
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    loadHouseholdInfo();
  }, []);

  const loadHouseholdInfo = async () => {
    try {
      const household = await storage.getHousehold();
      if (household) {
        setHouseholdName(household.name);
        setInviteCode(household.inviteCode);
        
        // Create QR code value
        const qrData = JSON.stringify({
          type: 'household_invite',
          code: household.inviteCode,
          name: household.name,
        });
        setQrValue(qrData);
      }
    } catch (error) {
      console.error('Failed to load household info:', error);
    }
  };

  const handleShareCode = async () => {
    try {
      const message = `Join our household "${householdName}" on Household Todo App!\n\nInvite code: ${inviteCode}\n\nDownload the app and enter this code to join.`;
      
      await Share.share({
        message,
        title: `Join ${householdName} on Household Todo`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyCode = () => {
    Clipboard.setString(inviteCode);
    Alert.alert('Copied!', 'Invite code copied to clipboard');
  };

  const handleRefreshCode = async () => {
    Alert.alert(
      'Refresh Invite Code',
      'This will generate a new invite code. The old code will no longer work.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Refresh',
          style: 'destructive',
          onPress: async () => {
            try {
              const household = await storage.getHousehold();
              if (household) {
                const updated = await apiService.refreshInviteCode(household.id);
                const newHousehold = { ...household, inviteCode: updated.inviteCode } as any;
                await storage.saveHousehold(newHousehold);
                setInviteCode(updated.inviteCode);
                const qrData = JSON.stringify({ type: 'household_invite', code: updated.inviteCode, name: household.name });
                setQrValue(qrData);
                Alert.alert('Success', 'Invite code refreshed!');
              }
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.response?.data?.error || error.response?.data?.message || 'Failed to refresh invite code',
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Invite to {householdName}</Text>
        <Text style={styles.subtitle}>
          Share this code with family members to join your household
        </Text>

        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Invite Code</Text>
          <Text style={styles.code}>{inviteCode}</Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyCode}
          >
            <Text style={styles.copyButtonText}>Copy Code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.qrContainer}>
          <Text style={styles.qrLabel}>Or Scan QR Code</Text>
          <View style={styles.qrCodeContainer}>
            {qrValue ? (
              <View style={styles.qrTextContainer}>
                <Text style={styles.qrTextTitle}>QR Code Data:</Text>
                <Text style={styles.qrTextContent} selectable={true}>{qrValue}</Text>
                <Text style={styles.qrTextInfo}>
                  Use the share button below to send this invitation to others.
                </Text>
              </View>
            ) : (
              <Text style={styles.qrPlaceholder}>Loading QR Code...</Text>
            )}
          </View>
        </View>

        <View style={styles.shareContainer}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareCode}
          >
            <Text style={styles.shareButtonText}>Share Invite</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.refreshContainer}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefreshCode}
          >
            <Text style={styles.refreshButtonText}>Refresh Code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  codeContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  codeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  code: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200EE',
    letterSpacing: 2,
    marginBottom: 16,
  },
  copyButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    minWidth: 120,
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: 14,
    color: '#6200EE',
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  qrLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  qrCodeContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  qrPlaceholder: {
    fontSize: 16,
    color: '#999',
    width: 200,
    height: 200,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  qrTextContainer: {
    padding: 20,
    alignItems: 'center',
  },
  qrTextTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  qrTextContent: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  qrTextInfo: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  shareContainer: {
    width: '100%',
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: '#6200EE',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshContainer: {
    width: '100%',
  },
  refreshButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6200EE',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#6200EE',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InviteScreen;