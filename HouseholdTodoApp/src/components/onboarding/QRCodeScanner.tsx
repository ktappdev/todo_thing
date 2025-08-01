import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

const QRCodeScanner = () => {
  const navigation = useNavigation<StackNavigationProp<OnboardingStackParamList>>();

  const handleManualEntry = () => {
    navigation.navigate('JoinHousehold');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>QR Code Scanner</Text>
        <Text style={styles.subtitle}>
          QR code scanning functionality would be implemented here using react-native-camera or similar package.
        </Text>
        <Text style={styles.subtitle}>
          For now, please use the manual entry option below.
        </Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={handleManualEntry}
        >
          <Text style={styles.buttonText}>Enter Code Manually</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#6200EE',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QRCodeScanner;