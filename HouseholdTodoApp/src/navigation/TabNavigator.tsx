import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import TaskListScreen from '../screens/tasks/TaskListScreen';
import MembersScreen from '../screens/household/MembersScreen';
import SettingsScreen from '../screens/household/SettingsScreen';
import InviteScreen from '../screens/household/InviteScreen';
import CreateTaskScreen from '../screens/tasks/CreateTaskScreen';
import TaskDetailScreen from '../screens/tasks/TaskDetailScreen';

export type TabParamList = {
  Tasks: undefined;
  Members: undefined;
  Settings: undefined;
  Invite: undefined;
  CreateTask: undefined;
  TaskDetail: { taskId: string };
};

const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Tasks') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Members') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#6200EE',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Tasks" 
        component={TaskListScreen} 
        options={{ title: 'Tasks' }}
      />
      <Tab.Screen 
        name="Members" 
        component={MembersScreen} 
        options={{ title: 'Household' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Tab.Screen
        name="Invite"
        component={InviteScreen}
        options={{
          title: 'Invite',
          tabBarButton: () => null, // Hide from tab bar
        }}
      />
      <Tab.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{
          title: 'Create Task',
          tabBarButton: () => null, // Hide from tab bar
        }}
      />
      <Tab.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{
          title: 'Task Details',
          tabBarButton: () => null, // Hide from tab bar
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;