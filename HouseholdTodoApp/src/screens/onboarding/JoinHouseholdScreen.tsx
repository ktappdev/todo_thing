import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView 
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';

import apiService from '../../services/api';
import { storage } from '../../utils/storage';

interface JoinHouseholdFormData {
  inviteCode: string;
  userName: string;
}

const JoinHouseholdScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    control, 
    handleSubmit, 
    formState: { errors, isValid } 
  } = useForm<JoinHouseholdFormData>({
    mode: 'onBlur',
    defaultValues: {
      inviteCode: '',
      userName: '',
    },
  });

  const onSubmit = async (data: JoinHouseholdFormData) => {
    setIsLoading(true);
    try {
      // Clear any existing user data first (in case user was in another household)
      await storage.removeUser();
      await storage.removeHousehold();
      await storage.removeToken();
      
      // Get device ID
      const deviceId = await storage.getDeviceId();

      const code = data.inviteCode.toUpperCase();
      const user = await apiService.joinHousehold(code, {
        name: data.userName,
        deviceId,
      });
      const household = await apiService.getHouseholdByCode(code);

      // Save user and household to storage
      await storage.saveUser(user);
      await storage.saveHousehold(household);

      // Navigate to main app
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || error.response?.data?.message || 'Failed to join household',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Join Household</Text>
          <Text style={styles.subtitle}>
            Enter the invite code to join your family's household
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Invite Code</Text>
            <Controller
              control={control}
              name="inviteCode"
              rules={{
                required: 'Invite code is required',
                minLength: {
                  value: 6,
                  message: 'Invite code must be at least 6 characters',
                },
                pattern: {
                  value: /^[A-Z0-9]+$/i,
                  message: 'Invite code can only contain letters and numbers',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.codeInput, errors.inviteCode && styles.inputError]}
                  placeholder="e.g., FAMILY23"
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(text.toUpperCase())}
                  value={value}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              )}
            />
            {errors.inviteCode && (
              <Text style={styles.errorText}>{errors.inviteCode.message}</Text>
            )}

            <Text style={[styles.label, { marginTop: 20 }]}>Your Name</Text>
            <Controller
              control={control}
              name="userName"
              rules={{
                required: 'Your name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.userName && styles.inputError]}
                  placeholder="e.g., Dad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize="words"
                />
              )}
            />
            {errors.userName && (
              <Text style={styles.errorText}>{errors.userName.message}</Text>
            )}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              (!isValid || isLoading) && styles.disabledButton,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Join Household</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 20,
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200EE',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  codeInput: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  inputError: {
    borderColor: '#ff5252',
  },
  errorText: {
    color: '#ff5252',
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#6200EE',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default JoinHouseholdScreen;