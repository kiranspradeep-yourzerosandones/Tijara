import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme';
import { useCartStore } from '../store';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import { ProductListScreen, ProductDetailScreen } from '../screens/products';
import { CategoriesScreen } from '../screens/categories';
import { CartScreen } from '../screens/cart';
import { PlaceOrderScreen, OrderListScreen, OrderDetailScreen } from '../screens/orders';
import { ProfileScreen, EditProfileScreen } from '../screens/profile';
import { LocationListScreen, AddLocationScreen, EditLocationScreen } from '../screens/locations';
import { NotificationScreen } from '../screens/notifications';
import { CreditSummaryScreen, PaymentHistoryScreen } from '../screens/payments';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="ProductList" component={ProductListScreen} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    <Stack.Screen name="Categories" component={CategoriesScreen} />
    <Stack.Screen name="Notifications" component={NotificationScreen} />
  </Stack.Navigator>
);

// Orders Stack
const OrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OrderList" component={OrderListScreen} />
    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
  </Stack.Navigator>
);

// Cart Stack
const CartStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CartMain" component={CartScreen} />
    <Stack.Screen name="PlaceOrder" component={PlaceOrderScreen} />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="LocationList" component={LocationListScreen} />
    <Stack.Screen name="AddLocation" component={AddLocationScreen} />
    <Stack.Screen name="EditLocation" component={EditLocationScreen} />
    <Stack.Screen name="CreditSummary" component={CreditSummaryScreen} />
    <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
    <Stack.Screen name="Notifications" component={NotificationScreen} />
  </Stack.Navigator>
);

// Tab Bar Icon with Badge
const TabBarIcon = ({ name, focused, badgeCount }) => (
  <View style={styles.iconContainer}>
    <Ionicons
      name={focused ? name : `${name}-outline`}
      size={24}
      color={focused ? COLORS.primary : COLORS.gray}
    />
    {badgeCount > 0 && (
      <View style={styles.badge}>
        <Ionicons name="ellipse" size={8} color={COLORS.primary} />
      </View>
    )}
  </View>
);

// Cart Tab Icon with Count
const CartTabIcon = ({ focused }) => {
  const { totalItems } = useCartStore();
  
  return (
    <View style={styles.iconContainer}>
      <Ionicons
        name={focused ? 'cart' : 'cart-outline'}
        size={24}
        color={focused ? COLORS.primary : COLORS.gray}
      />
      {totalItems > 0 && (
        <View style={styles.cartBadge}>
          <Ionicons 
            name="ellipse" 
            size={totalItems > 9 ? 16 : 14} 
            color={COLORS.primary} 
          />
        </View>
      )}
    </View>
  );
};

// Main Tab Navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: true,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray,
      tabBarLabelStyle: styles.tabBarLabel,
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeStack}
      options={{
        tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Categories"
      component={CategoriesScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabBarIcon name="grid" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Cart"
      component={CartStack}
      options={{
        tabBarIcon: ({ focused }) => <CartTabIcon focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Orders"
      component={OrdersStack}
      options={{
        tabBarIcon: ({ focused }) => <TabBarIcon name="receipt" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileStack}
      options={{
        tabBarIcon: ({ focused }) => <TabBarIcon name="person" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

// App Navigator
const AppNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={TabNavigator} />
    <Stack.Screen 
      name="ProductDetail" 
      component={ProductDetailScreen}
      options={{ presentation: 'card' }}
    />
    <Stack.Screen 
      name="OrderDetail" 
      component={OrderDetailScreen}
      options={{ presentation: 'card' }}
    />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    height: SPACING.tabBarHeight,
    paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
  },
});

export default AppNavigator;