import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  
  ScrollView,
  Modal,
} from 'react-native';
import { FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { TabParamList } from '../../navigation/TabNavigator';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Task, TaskCategory } from '../../types';
import { useMe, useTasks } from '../../hooks/useApi';



type DateFilter = 'all' | 'today' | 'tomorrow' | 'this_week' | 'overdue' | 'custom';
type StatusFilter = 'all' | 'pending' | 'completed';

interface FilterState {
  date: DateFilter;
  category: TaskCategory | 'all';
  status: StatusFilter;
  customDate?: string;
}

const TaskListScreen = () => {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { data: meData } = useMe();
  const householdId = meData?.household?.id;
  const { data: tasksData = [], refetch, isFetching } = useTasks(householdId ?? '');

  // Local UI state
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    date: 'all',
    category: 'all',
    status: 'all'
  });

  // pull-to-refresh handler simply refetches the query
  const onRefresh = async () => {
    await refetch();
  };

  const toggleTaskCompletion = async (_taskId: string) => {
    // handled in other screen; kept for parity
  };

  const applyFilters = React.useCallback(() => {
    let filtered = [...tasksData];

    // Apply date filter
    if (filters.date !== 'all') {
      filtered = filtered.filter(task => matchesDateFilter(task, filters.date, filters.customDate));
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(task => task.category === filters.category);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => {
        if (filters.status === 'completed') return task.completed;
        if (filters.status === 'pending') return !task.completed;
        return true;
      });
    }

    setFilteredTasks(filtered);
  }, [tasksData, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const matchesDateFilter = (task: Task, dateFilter: DateFilter, customDate?: string): boolean => {
    if (!task.dueDate) return dateFilter === 'all';

    const taskDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    taskDate.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'today':
        return taskDate.getTime() === today.getTime();
      case 'tomorrow':
        return taskDate.getTime() === tomorrow.getTime();
      case 'this_week':
        return taskDate >= today && taskDate <= weekFromNow;
      case 'overdue':
        return taskDate < today && !task.completed;
      case 'custom':
        if (!customDate) return false;
        const custom = new Date(customDate);
        custom.setHours(0, 0, 0, 0);
        return taskDate.getTime() === custom.getTime();
      default:
        return true;
    }
  };

  const getDateFilterLabel = (filter: DateFilter): string => {
    switch (filter) {
      case 'today': return 'Today';
      case 'tomorrow': return 'Tomorrow';
      case 'this_week': return 'This Week';
      case 'overdue': return 'Overdue';
      case 'custom': return 'Custom Date';
      default: return 'All Dates';
    }
  };

  const getCategoryLabel = (category: TaskCategory | 'all'): string => {
    return category === 'all' ? 'All Categories' : category;
  };

  const getStatusLabel = (status: StatusFilter): string => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      default: return 'All Tasks';
    }
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filters.date !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.status !== 'all') count++;
    return count;
  };

  const clearFilters = () => {
    setFilters({
      date: 'all',
      category: 'all',
      status: 'all'
    });
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={[
        styles.taskItem,
        item.completed && styles.completedTask,
      ]}
      onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
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
      {/* Filter Header */}
      <View style={styles.filterHeader}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterButtonText}>Filters</Text>
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {getActiveFilterCount() > 0 && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={clearFilters}
          >
            <Text style={styles.clearFiltersText}>Clear</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.taskCount}>
          {filteredTasks.length} of {tasksData.length} tasks
        </Text>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {tasksData.length === 0 ? 'No tasks yet' : 'No tasks match filters'}
            </Text>
            <Text style={styles.emptySubtext}>
              {tasksData.length === 0 
                ? 'Tap the + button to create your first task'
                : 'Try adjusting your filters or create a new task'
              }
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

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Tasks</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Date Filter */}
              <Text style={styles.filterSectionTitle}>Date</Text>
              <View style={styles.filterOptions}>
                {(['all', 'today', 'tomorrow', 'this_week', 'overdue'] as DateFilter[]).map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      filters.date === option && styles.selectedFilterOption
                    ]}
                    onPress={() => setFilters({ ...filters, date: option })}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.date === option && styles.selectedFilterText
                    ]}>
                      {getDateFilterLabel(option)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category Filter */}
              <Text style={styles.filterSectionTitle}>Category</Text>
              <View style={styles.filterOptions}>
                {(['all', 'GENERAL', 'CHORES', 'SHOPPING', 'WORK'] as (TaskCategory | 'all')[]).map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      filters.category === option && styles.selectedFilterOption
                    ]}
                    onPress={() => setFilters({ ...filters, category: option })}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.category === option && styles.selectedFilterText
                    ]}>
                      {getCategoryLabel(option)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Status Filter */}
              <Text style={styles.filterSectionTitle}>Status</Text>
              <View style={styles.filterOptions}>
                {(['all', 'pending', 'completed'] as StatusFilter[]).map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      filters.status === option && styles.selectedFilterOption
                    ]}
                    onPress={() => setFilters({ ...filters, status: option })}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.status === option && styles.selectedFilterText
                    ]}>
                      {getStatusLabel(option)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quick Access Buttons */}
              <Text style={styles.filterSectionTitle}>Quick Access</Text>
              <View style={styles.quickAccessButtons}>
                <TouchableOpacity
                  style={styles.quickAccessButton}
                  onPress={() => {
                    setFilters({ date: 'tomorrow', category: 'CHORES', status: 'pending' });
                    setShowFilters(false);
                  }}
                >
                  <Text style={styles.quickAccessText}>Tomorrow's Chores</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAccessButton}
                  onPress={() => {
                    setFilters({ date: 'today', category: 'all', status: 'pending' });
                    setShowFilters(false);
                  }}
                >
                  <Text style={styles.quickAccessText}>Today's Tasks</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAccessButton}
                  onPress={() => {
                    setFilters({ date: 'overdue', category: 'all', status: 'pending' });
                    setShowFilters(false);
                  }}
                >
                  <Text style={styles.quickAccessText}>Overdue Tasks</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6200EE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 4,
  },
  filterBadge: {
    backgroundColor: '#ff5252',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clearFiltersButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearFiltersText: {
    color: '#ff5252',
    fontWeight: 'bold',
  },
  taskCount: {
    marginLeft: 'auto',
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 20,
    color: '#666',
    padding: 4,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  selectedFilterOption: {
    backgroundColor: '#6200EE',
    borderColor: '#6200EE',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  quickAccessButtons: {
    gap: 8,
    marginBottom: 20,
  },
  quickAccessButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6200EE',
  },
});

export default TaskListScreen;