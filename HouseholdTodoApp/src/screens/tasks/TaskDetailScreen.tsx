import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FAB } from 'react-native-paper';

import { Task, User } from '../../types';
import apiService from '../../services/api';
import { storage } from '../../utils/storage';

interface RouteParams {
  taskId: string;
}

const TaskDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { taskId } = route.params as RouteParams;
  
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [householdMembers, setHouseholdMembers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadTaskDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const loadTaskDetails = async () => {
    setIsLoading(true);
    try {
      // Load current user
      const user = await storage.getUser();
      setCurrentUser(user);
      
      // In a real app, you would fetch the task by ID
      // For now, we'll simulate loading from the household tasks
      const household = await storage.getHousehold();
      if (household) {
        const tasks = await apiService.getHouseholdTasks(household.id);
        const foundTask = tasks.find(t => t.id === taskId);
        
        if (foundTask) {
          setTask(foundTask);
          
          // Load household members for assignment
          const members = await apiService.getHouseholdUsers(household.id);
          setHouseholdMembers(members);
        } else {
          Alert.alert('Error', 'Task not found');
          navigation.goBack();
        }
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load task details',
      );
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskCompletion = async () => {
    if (!task) return;
    
    try {
      // Backend infers user from JWT token, no need to pass userId
      await apiService.toggleTaskCompletion(task.id);
      await loadTaskDetails();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update task',
      );
    }
  };

  const deleteTask = () => {
    if (!task) return;
    
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteTask(task.id);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to delete task',
              );
            }
          },
        },
      ]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'CHORES': return '#4CAF50';
      case 'SHOPPING': return '#2196F3';
      case 'WORK': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  };

  const canToggleCompletion = () => {
    if (!task || !currentUser) return false;
    
    // If task is not completed, anyone can mark it complete
    if (!task.completed) return true;
    
    // If task is completed, only the person who completed it can unmark it
    return task.completedBy === currentUser.id;
  };

  const getCompletedByName = () => {
    if (!task || !task.completedBy) return 'Unknown';
    
    // Check if it's the creator
    if (task.creator?.id === task.completedBy) {
      return task.creator.name;
    }
    
    // Check in assignments
    const completer = task.assignments?.find(a => a.user.id === task.completedBy);
    if (completer) {
      return completer.user.name;
    }
    
    // Check in household members
    const member = householdMembers.find(m => m.id === task.completedBy);
    return member?.name || 'Unknown';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text>Task not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{task.title}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(task.category) }]}>
            <Text style={styles.categoryText}>{task.category}</Text>
          </View>
        </View>

        {task.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{task.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, task.completed && styles.completedText]}>
              {task.completed ? 'Completed' : 'Pending'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due Date:</Text>
            <Text style={styles.detailValue}>{formatDate(task.dueDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created By:</Text>
            <Text style={styles.detailValue}>{task.creator?.name || 'Unknown'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>{formatDateTime(task.createdAt)}</Text>
          </View>
          {task.completed && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Completed By:</Text>
                <Text style={[styles.detailValue, styles.completedByText]}>{getCompletedByName()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Completed:</Text>
                <Text style={[styles.detailValue, styles.completedByText]}>{formatDateTime(task.completedAt)}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned To</Text>
          {task.assignments && task.assignments.length > 0 ? (
            task.assignments.map(assignment => (
              <View key={assignment.user.id} style={styles.assignedUser}>
                <View style={styles.userAvatar}>
                  <Text style={styles.avatarText}>
                    {assignment.user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.userName}>{assignment.user.name}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noAssignment}>Not assigned to anyone</Text>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.completeButton,
              !canToggleCompletion() && styles.disabledButton
            ]}
            onPress={toggleTaskCompletion}
            disabled={!canToggleCompletion()}
          >
            <Text style={[
              styles.completeButtonText,
              !canToggleCompletion() && styles.disabledButtonText
            ]}>
              {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
            </Text>
          </TouchableOpacity>
          {task.completed && !canToggleCompletion() && (
            <Text style={styles.restrictionText}>
              Only {getCompletedByName()} can mark this as incomplete
            </Text>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={deleteTask}
          >
            <Text style={styles.deleteButtonText}>Delete Task</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="pencil"
        label="Edit"
        onPress={() => {
          // In a real app, you would navigate to an edit task screen
          Alert.alert('Edit', 'Edit functionality would be implemented here');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#4CAF50',
  },
  completedByText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  assignedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6200EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 14,
    color: '#333',
  },
  noAssignment: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  actionButtons: {
    marginTop: 8,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ff5252',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledButtonText: {
    color: '#999',
  },
  restrictionText: {
    fontSize: 12,
    color: '#ff5252',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200EE',
  },
});

export default TaskDetailScreen;