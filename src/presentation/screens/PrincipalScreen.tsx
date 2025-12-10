import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

export const PrincipalScreen = () => {
  const navigation = useNavigation();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.85));
  const [translateAnim] = useState(new Animated.Value(20));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, translateAnim]);

  return (
    <View style={styles.container}>
      {/* Fondo */}
      <Image
        source={require('../../assets/images/fondo2.jpeg')}
        style={styles.backgroundImage}
      />

      {/* Capa de color con degradado */}
      <LinearGradient
        colors={['rgba(29, 74, 59, 0.85)', 'rgba(37, 53, 71, 0.9)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientLayer}
      />

      {/* Logo + nombre app */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../../assets/images/logoSinFondo.png')}
          style={styles.logo}
        />
        <Text style={styles.appName}>DysMathAI</Text>
        <Text style={styles.appTagline}>
          Actividades de matemáticas adaptadas para ti.  
        </Text>
      </Animated.View>

      {/* Tarjeta borrosa con botones */}
      <Animated.View
        style={[
          styles.blurContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateAnim }],
          },
        ]}
      >
        <BlurView blurAmount={18} blurType="light" style={styles.blurView} />

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Bienvenido</Text>
          <Text style={styles.cardSubtitle}>
            Inicia sesión o entra directo a explorar actividades.
          </Text>

          <Pressable
            onPress={() => navigation.navigate('Login' as never)}
            style={styles.login}
          >
            <Text style={styles.loginText}>Iniciar sesión</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('HomeScreen' as never)}
            style={styles.registro}
          >
            <Text style={styles.registroText}>Registrarse</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#000',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    resizeMode: 'cover',
    zIndex: 0,
  },
  gradientLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 1,
  },
  logoContainer: {
    zIndex: 2,
    marginTop: height * 0.05,
    alignItems: 'center',
  },
  logo: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 43,
    fontWeight: '800',
    color: '#ffff',
    marginTop: -10,
  },
  appTagline: {
    marginTop: 6,
    fontSize: 18,
    color: 'rgba(243,235,223,0.9)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  blurContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    width: '86%',
    zIndex: 3,
    alignSelf: 'center',
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(243,235,223,0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  blurView: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingVertical: 22,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffff',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#ffff',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },

  login: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgb(232, 186, 97)',
    alignItems: 'center',
    marginTop: 4,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  loginText: {
    fontSize: 17,
    color: '#253547',
    fontWeight: '700',
  },

  registro: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#f3ebdf',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(37, 53, 71, 0.25)',
  },
  registroText: {
    fontSize: 16,
    color: '#f3ebdf',
    fontWeight: '600',
  },
});