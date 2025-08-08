import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { scheduleTaskReminder, ReminderPreset } from '../../notifications/taskReminders';

import { } from '../../types';
import apiService from '../../services/api';
import { storage } from '../../utils/storage';

interface CreateTaskFormData {
  title: string;
  description: string;
  category: 'CHORES' | 'SHOPPING' | 'WORK' | 'GENERAL';
  dueDate?: string;
  reminderPreset: ReminderPreset;
}

const CreateTaskScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const { 
    control, 
    handleSubmit, 
    formState: { errors, isValid },
    setValue,
    watch 
  } = useForm<CreateTaskFormData>({
    mode: 'onBlur',
    defaultValues: {
      title: '',
      description: '',
      category: 'GENERAL',
      dueDate: '',
      reminderPreset: 'NONE',
    },
  });

  const watchedCategory = watch('category');
  const watchedDueDate = watch('dueDate');
  const watchedReminder = watch('reminderPreset');

  const onSubmit = async (data: CreateTaskFormData) => {
    setIsLoading(true);
    try {
      const household = await storage.getHousehold();
      const user = await storage.getUser();
      
      if (household && user) {
        const { reminderPreset, ...payload } = data;
        const taskData = {
          ...payload,
          assignedTo: [], // Empty array for now, can be updated later
        };
        
        const created = await apiService.createTask(household.id, taskData);
          // Schedule local reminder
          try {
            await scheduleTaskReminder(created.id, created.title, created.dueDate, watchedReminder);
          } catch (e) {
            console.warn('Failed to schedule reminder', e);
          }
        
        // Navigate back to task list
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || error.response?.data?.message || 'Failed to create task',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep showing on iOS, hide on Android
    if (selectedDate) {
      setValue('dueDate', selectedDate.toISOString());
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const getMinimumDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const formatDateDisplay = (dateString?: string) => {
    if (!dateString) return 'Select due date';
    return new Date(dateString).toLocaleDateString();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'CHORES': return '#4CAF50';
      case 'SHOPPING': return '#2196F3';
      case 'WORK': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.form}>
          <Text style={styles.label}>Task Title</Text>
          <Controller
            control={control}
            name="title"
            rules={{
              required: 'Task title is required',
              minLength: {
                value: 2,
                message: 'Title must be at least 2 characters',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="What needs to be done?"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.title && (
            <Text style={styles.errorText}>{errors.title.message}</Text>
          )}

          <Text style={[styles.label, { marginTop: 20 }]}>Description</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add details..."
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                multiline
                numberOfLines={4}
              />
            )}
          />

          <Text style={[styles.label, { marginTop: 20 }]}>Category</Text>
          <View style={styles.categoryContainer}>
            {(['CHORES', 'SHOPPING', 'WORK', 'GENERAL'] as const).map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  { borderColor: getCategoryColor(category) },
                  watchedCategory === category && { 
                    backgroundColor: getCategoryColor(category) 
                  }
                ]}
                onPress={() => setValue('category', category)}
              >
                <Text style={[
                  styles.categoryText,
                  watchedCategory === category && styles.selectedCategoryText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>Reminder</Text>
          <View style={styles.reminderContainer}>
            {(['NONE','AT_DUE','5M_BEFORE','1H_BEFORE','1D_BEFORE'] as ReminderPreset[]).map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[styles.reminderButton,
                  watchedReminder===preset && styles.selectedReminderButton]}
                onPress={() => setValue('reminderPreset', preset)}
              >
                <Text style={[styles.reminderText,
                  watchedReminder===preset && styles.selectedReminderText]}> {preset==='NONE'?'None':preset.replace('_',' ').replace('BEFORE','')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>Due Date</Text>
          <TouchableOpacity
            style={[styles.input, styles.dateInput]}
            onPress={showDatepicker}
          >
            <Text style={[
              styles.dateText,
              !watchedDueDate && styles.placeholderText
            ]}>
              {formatDateDisplay(watchedDueDate)}
            </Text>
          </TouchableOpacity>

          {/* Quick date buttons */}
          <View style={styles.quickDateButtons}>
            <TouchableOpacity
              style={styles.quickDateButton}
              onPress={() => {
                setValue('dueDate', undefined);
              }}
            >
              <Text style={styles.quickDateButtonText}>No Due Date</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickDateButton, styles.todayButton]}
              onPress={() => {
                setValue('dueDate', new Date().toISOString());
              }}
            >
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickDateButton, styles.tomorrowButton]}
              onPress={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setValue('dueDate', tomorrow.toISOString());
              }}
            >
              <Text style={styles.tomorrowButtonText}>Tomorrow</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={watchedDueDate ? new Date(watchedDueDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateSelect}
              minimumDate={getMinimumDate()}
            />
          )}
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
              <Text style={styles.primaryButtonText}>Create Task</Text>
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  categoryButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    minWidth: '45%',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  quickDateButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  quickDateButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quickDateButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datePickerButton: {
    padding: 8,
    borderRadius: 4,
    minWidth: '30%',
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#666',
  },
  todayButton: {
    backgroundColor: '#4CAF50',
  },
  todayButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  tomorrowButton: {
    backgroundColor: '#2196F3',
  },
  tomorrowButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  reminderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  reminderButton: {
    borderWidth: 1,
    borderColor: '#6200EE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  selectedReminderButton: {
    backgroundColor: '#6200EE',
  },
  reminderText: {
    fontSize: 12,
    color: '#6200EE',
    fontWeight: '600',
  },
  selectedReminderText: {
    color: '#fff',
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

export default CreateTaskScreen;