import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Users, Calendar, Settings } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

import DashboardScreen from '../screens/DashboardScreen';
import RelationshipsScreen from '../screens/RelationshipsScreen';
import EventsScreen from '../screens/EventsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddEditRelationshipScreen from '../screens/AddEditRelationshipScreen';
import RelationshipDetailScreen from '../screens/RelationshipDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardMain"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RelationshipDetail"
        component={RelationshipDetailScreen}
        options={{ title: '關係人詳情' }}
      />
      <Stack.Screen
        name="AddRelationship"
        component={AddEditRelationshipScreen}
        options={{ title: '新增關係人' }}
      />
      <Stack.Screen
        name="EditRelationship"
        component={AddEditRelationshipScreen}
        options={{ title: '編輯關係人' }}
      />
    </Stack.Navigator>
  );
}

function RelationshipsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RelationshipsMain"
        component={RelationshipsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RelationshipDetail"
        component={RelationshipDetailScreen}
        options={{ title: '關係人詳情' }}
      />
      <Stack.Screen
        name="AddRelationship"
        component={AddEditRelationshipScreen}
        options={{ title: '新增關係人' }}
      />
      <Stack.Screen
        name="EditRelationship"
        component={AddEditRelationshipScreen}
        options={{ title: '編輯關係人' }}
      />
    </Stack.Navigator>
  );
}

function EventsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="EventsMain"
        component={EventsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: 60 + Math.max(insets.bottom - 8, 0),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          title: '儀表板',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Relationships"
        component={RelationshipsStack}
        options={{
          title: '關係人',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsStack}
        options={{
          title: '行程',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
