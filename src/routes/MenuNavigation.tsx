import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../presentation/screens/HomeScreen';
import { Image, View, Animated, StyleSheet } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';

const Tab = createBottomTabNavigator();

export const MenuNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused, color, size }) => menuIcons(route, focused),
        tabBarStyle: {
          marginBottom: 20,
          borderRadius: 50,
          backgroundColor: 'rgba(37, 53, 71, 0.8)',
          alignSelf: 'center',
          width: '95%',
          height: 70,
        },
        tabBarItemStyle: {
          marginTop: 15,
        }
      })}
    >
      <Tab.Screen name="HomeScreen" component={HomeScreen} />
      <Tab.Screen name="Favorite" component={HomeScreen} />
      <Tab.Screen name="Car" component={HomeScreen} />
    </Tab.Navigator>
  );
};

const menuIcons = (route: any, focused: boolean) => {
  // Usamos useRef para crear las animaciones
  const scale = useRef(new Animated.Value(1)).current; // Inicializa la escala en 1
  const translateY = useRef(new Animated.Value(0)).current; // Inicializa el desplazamiento en Y en 0

  useEffect(() => {
    // Inicia la animación de escala y desplazamiento cuando la pestaña cambia
    Animated.parallel([
      Animated.timing(scale, {
        toValue: focused ? 1.2 : 1, // Escala al 1.2 si está enfocado, al 1 si no lo está
        duration: 200, // Duración de la animación
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: focused ? -20 : 0, // Desplaza hacia arriba cuando está enfocado
        duration: 200, // Duración de la animación
        useNativeDriver: true,
      })
    ]).start();
  }, [focused, scale, translateY]); // Añadir dependencias para animaciones

  let icon;
  if (route.name === 'HomeScreen') {
    icon = focused ? (
      <Animated.View
        style={[styles.circleStyle, { transform: [{ scale }, { translateY }] }]}>
        <Image
          source={require('../assets/images/home-active.png')}
          style={styles.iconStyle}
        />
      </Animated.View>
    ) : (
        <Image
          source={require('../assets/images/home.png')}
          style={styles.iconStyle}
        />
    );
  } else {
    icon = focused ? (
      <Animated.View
        style={[styles.circleStyle, { transform: [{ scale }, { translateY }] }]}>
        <Image
          source={require('../assets/images/home-active.png')}
          style={styles.iconStyle}
        />
      </Animated.View>
    ) : (
        <Image
          source={require('../assets/images/home.png')}
          style={styles.iconStyle}
        />
    );
  }

  return <View>{icon}</View>;
};

const styles = StyleSheet.create({
  circleStyle: {
    width: 50,
    height: 50,
    borderRadius: 25, // Esto hace que el contenedor sea un círculo
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8ba61', // Fondo cuando está activo
  },
  iconStyle: {
    width: 30,
    height: 30,
  },
});
