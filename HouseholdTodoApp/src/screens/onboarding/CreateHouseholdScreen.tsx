import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

import apiService from '../../services/api';
import { storage } from '../../utils/storage';

interface CreateHouseholdFormData {
  householdName: string;
  userName: string;
}

const CreateHouseholdScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    control, 
    handleSubmit, 
    formState: { errors, isValid } 
  } = useForm<CreateHouseholdFormData>({
    mode: 'onBlur',
    defaultValues: {
      householdName: '',
      userName: '',
    },
  });

  const onSubmit = async (data: CreateHouseholdFormData) => {
    setIsLoading(true);
    try {
      // Create household
      const household = await apiService.createHousehold({
        name: data.householdName,
      });

      // Get device ID
      const deviceId = await storage.getDeviceId();

      // Join household with user
      const user = await apiService.joinHousehold(household.inviteCode, {
        name: data.userName,
        deviceId,
      });

      // Save user and household to storage
      await storage.saveUser(user);
      await storage.saveHousehold(household);

      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || error.response?.data?.message || 'Failed to create household',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Household</Text>
        <Text style={styles.subtitle}>
          Set up your household and invite family members
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Household Name</Text>
          <Controller
            control={control}
            name="householdName"
            rules={{
              required: 'Household name is required',
              minLength: {
                value: 2,
                message: 'Household name must be at least 2 characters',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.householdName && styles.inputError]}
                placeholder="e.g., Smith Family"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="words"
              />
            )}
          />
          {errors.householdName && (
            <Text style={styles.errorText}>{errors.householdName.message}</Text>
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
                placeholder="e.g., Mom"
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
            <Text style={styles.primaryButtonText}>Create Household</Text>
          )}
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
  inputError: {
    borderColor: '#ff5252',
  },
  errorText: {
    color: '#ff5252',
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
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

export default CreateHouseholdScreen;