import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');

export const PrincipalScreen = () => {
  const navigation = useNavigation();
  const [fadeAnim] = useState(new Animated.Value(0)); // Animación de desvanecimiento
  const [scaleAnim] = useState(new Animated.Value(0.7)); // Animación de escala

  // Animación de entrada para el logo y los botones
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/fondo2.jpeg')}
        style={styles.backgroundImage}
      />
      <View style={styles.containerBackground}></View>

      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={require('../../assets/images/logoSinFondo.png')}
          style={styles.logo}
        />
      </Animated.View>

      <View style={styles.blurContainer}>
        <BlurView blurAmount={10} blurType="light" style={styles.blurView} />
        <Pressable onPress={() => navigation.navigate('Login' as never)} style={styles.login}>
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('HomeScreen' as never)} style={styles.registro}>
          <Text style={styles.buttonText}>Registrarse</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    resizeMode: 'cover',
    zIndex: 0,
  },
  containerBackground: {
    backgroundColor: 'rgba(37, 53, 71, 0.82)',
    width: width,
    height: height,
    position: 'absolute',
    top: 1,
    zIndex: 1,
  },
  logoContainer: {
    zIndex: 2,
    width: 250,
    height: 250,
    marginTop: '30%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  blurContainer: {
    position: 'absolute',
    top: '50%',
    width: '80%',
    height: height * 0.25,
    zIndex: 3,
    alignSelf: 'center',
    borderColor: 'rgb(243,235,223)',
    borderWidth: 3,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurView: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  login: {
    zIndex: 4,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: 'rgb(232, 187, 97)', // Mismo color de fondo para el botón de login
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  registro: {
    zIndex: 4,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: 'rgba(37, 53, 71, 0.68)', // Mismo color de fondo para el botón de registro
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    marginTop: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  buttonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
});