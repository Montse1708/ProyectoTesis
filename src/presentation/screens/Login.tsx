// Login.tsx
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const COLORS = {
  tealDark: '#1d4a3b',
  navy: '#253547',
  cream: '#f3ebdf',
  accent: '#e8ba61',
  white: '#ffffff',
};

export const Login = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.root}>
      {/* HEADER con tu IMAGEN + GRADIENT como en el mockup */}
      <LinearGradient
        colors={[COLORS.navy, COLORS.tealDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        {/* Tu imagen de fondo */}
        <Image
          source={require('../../assets/images/fondo2.jpeg')}
          style={styles.backgroundImageHeader}
        />

        {/* Onda inferior suave */}
        <View style={styles.waveBottom} />

        {/* LOGO de tu app */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            {/* Cambia la ruta del logo por la tuya */}
            <Image
              source={require('../../assets/images/logoSinFondo.png')}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.logoTitle}>DysMathAI</Text>
        </View>
      </LinearGradient>

      {/* TARJETA blanca como en el diseño de referencia */}
      <Animated.View
        style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.welcome}>Iniciar Sesión</Text>

        {/* USERNAME */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Usuario"
            placeholderTextColor={COLORS.accent}
          />
          {/* icono usuario (puedes cambiar a tu PNG si quieres) */}
          <Image
            source={require('../../assets/images/user.png')}
            style={styles.inputIconImage}
          />
        </View>

        {/* PASSWORD */}
        <View style={[styles.inputWrapper, { marginTop: 12 }]}>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={COLORS.accent}
            secureTextEntry
          />
          <Image
            source={require('../../assets/images/password.png')}
            style={styles.inputIconImage}
          />
        </View>

        {/* REMEMBER + FORGOT */}
        <View style={styles.rowBetween}>
          <View style={styles.rowCenter}>
            <View style={styles.radioOuter}>
              <View style={styles.radioInner} />
            </View>
            <Text style={styles.smallText}>Recuerdame</Text>
          </View>
          <Text style={[styles.smallText, { color: COLORS.accent }]}>
            ¿Olvidaste tu contraseña?
          </Text>
        </View>

        {/* BOTÓN LOGIN */}
        <Pressable
          onPress={() => navigation.navigate('HomeScreen' as never)}
          style={({ pressed }) => [
            styles.loginButtonWrapper,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <LinearGradient
            colors={[COLORS.navy, COLORS.tealDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loginButton}
          >
            <Text style={styles.loginButtonText}>Entrar</Text>
          </LinearGradient>
        </Pressable>

        {/* SIGN UP */}
        <View style={styles.centerRow}>
          <Text style={[styles.smallText, { color: COLORS.accent }]}>
            Registrarse
          </Text>
        </View>

        {/* SEPARADOR OR */}
        <View style={styles.separatorRow}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>OR</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* REDES SOCIALES (puedes reemplazar por íconos reales) */}
        <View style={styles.socialRow}>
          <View style={styles.socialCircle}>
            <Text style={styles.socialText}>f</Text>
          </View>
          <View style={styles.socialCircle}>
            <Text style={styles.socialText}>in</Text>
          </View>
          <View style={styles.socialCircle}>
            <Text style={styles.socialText}>G</Text>
          </View>
        </View>

        <Text style={styles.bottomHint}>Registrarse con otra cuenta</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  // HEADER
  gradientHeader: {
    width,
    height: 600,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 40,
  },
  backgroundImageHeader: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
    opacity: 0.3, // tu foto se ve pero el gradient manda
  },
  waveBottom: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    right: -40,
    height: 80,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    backgroundColor: COLORS.navy,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoCircle: {
    width: 220,
    height: 220,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoImage: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
  logoTitle: {
    color: COLORS.white,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // CARD
  card: {
    position: 'absolute',
    top: 400,
    left: 20,
    right: 20,
    backgroundColor: COLORS.white,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  welcome: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.tealDark,
    textAlign: 'center',
    marginBottom: 18,
  },

  // INPUTS
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontWeight: 'bold'
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.navy,
    fontWeight: 'bold'
  },
  inputIconImage: {
    width: 20,
    height: 20,
    tintColor: COLORS.tealDark,
    marginLeft: 8,
    resizeMode: 'contain',
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: 'bold',
  },

  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.accent,
  },

  // BOTÓN LOGIN
  loginButtonWrapper: {
    marginTop: 18,
    borderRadius: 999,
    overflow: 'hidden',
  },
  loginButton: {
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },

  centerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },

  // SEPARADOR OR
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e1e4f0',
  },
  separatorText: {
    marginHorizontal: 8,
    fontSize: 11,
    color: COLORS.white,
  },

  // SOCIAL
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
  },
  socialCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dde1f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  socialText: {
    fontSize: 13,
    color: COLORS.tealDark,
  },
  bottomHint: {
    marginTop: 8,
    fontSize: 11,
    color: COLORS.navy,
    textAlign: 'center',
  },
});