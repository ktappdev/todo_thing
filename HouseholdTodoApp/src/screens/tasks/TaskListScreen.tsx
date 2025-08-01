import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Alert 
} from 'react-native';
import { FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { TabParamList } from '../../navigation/TabNavigator';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Task } from '../../types';
import apiService from '../../services/api';
import { storage } from '../../utils/storage';

const TaskListScreen = () => {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [_isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const household = await storage.getHousehold();
      if (household) {
        const tasksData = await apiService.getHouseholdTasks(household.id);
        setTasks(tasksData);
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to fetch tasks',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const user = await storage.getUser();
      if (user) {
        await apiService.toggleTaskCompletion(taskId, { userId: user.id });
        await fetchTasks();
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update task',
      );
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={[
        styles.taskItem,
        item.completed && styles.completedTask,
      ]}
      onPress={() => toggleTaskCompletion(item.id)}
    >
      <View style={styles.taskContent}>
        <Text style={[
          styles.taskTitle,
          item.completed && styles.completedText,
        ]}>
          {item.title}
        </Text>
        {item.description && (
          <Text style={[
            styles.taskDescription,
            item.completed && styles.completedText,
          ]}>
            {item.description}
          </Text>
        )}
        <View style={styles.taskMeta}>
          <Text style={styles.taskCategory}>{item.category}</Text>
          {item.dueDate && (
            <Text style={styles.taskDueDate}>
              Due: {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.taskStatus}>
        <Text style={[
          styles.statusText,
          item.completed && styles.completedText,
        ]}>
          {item.completed ? '✓' : '○'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to create your first task
            </Text>
          </View>
        }
      />
      
      <FAB
        style={styles.fab}
        icon="plus"
        label="Add Task"
        onPress={() => navigation.navigate('CreateTask')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  taskItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completedTask: {
    opacity: 0.7,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskCategory: {
    fontSize: 12,
    color: '#6200EE',
    fontWeight: '600',
  },
  taskDueDate: {
    fontSize: 12,
    color: '#666',
  },
  taskStatus: {
    marginLeft: 16,
  },
  statusText: {
    fontSize: 24,
    color: '#6200EE',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200EE',
  },
});

export default TaskListScreen;