// src/navigation/MenuNavigation.tsx
import React, { useRef, useEffect } from 'react';
import { Image, View, Animated, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeScreen } from '../presentation/screens/HomeScreen';
import { Categories } from '../presentation/screens/Categories';
import { Tutor } from '../presentation/screens/Tutor';

const Tab = createBottomTabNavigator();

const COLORS = {
  navy: '#253547',
  accent: '#e8ba61',
};

export const MenuNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => menuIcons(route, focused),
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: COLORS.navy,
          borderRadius: 30,
          height: 70,
          marginHorizontal: 16,
          marginBottom: 16,
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarItemStyle: {
          marginTop: 8,
        },
      })}
    >
      <Tab.Screen name="Tutor" component={Tutor} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Categories" component={Categories} />
    </Tab.Navigator>
  );
};

const menuIcons = (route: any, focused: boolean) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: focused ? 1.2 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: focused ? -12 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, scale, translateY]);

  let iconSource;

  if (route.name === 'HomeScreen') {
    iconSource = focused
      ? require('../assets/images/home-active.png')
      : require('../assets/images/home.png');
  } else if (route.name === 'Categories') {
    iconSource = focused
      ? require('../assets/images/menu-active.png')
      : require('../assets/images/menu.png');
  } else {
    // Tutor
    iconSource = focused
      ? require('../assets/images/menu-active.png')
      : require('../assets/images/menu.png');
  }

  const icon = (
    <Image source={iconSource} style={styles.iconStyle} resizeMode="contain" />
  );

  if (!focused) {
    return <View>{icon}</View>;
  }

  return (
    <Animated.View
      style={[styles.circleStyle, { transform: [{ scale }, { translateY }] }]}
    >
      {icon}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  circleStyle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8ba61',
  },
  iconStyle: {
    width: 26,
    height: 26,
  },
});