import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, Dimensions, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Login = () => {
  const navigation = useNavigation();
  const [fadeAnim] = useState(new Animated.Value(0)); // Animación de desvanecimiento
  const [slideAnim] = useState(new Animated.Value(50)); // Animación de deslizamiento desde abajo

  // Animación de entrada cuando el componente se monta
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/fondo2.jpeg')}
        style={styles.backgroundImage}
      />
      <View style={styles.containerBackground}></View>

      <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.text}>Login</Text>
        <View style={styles.inputContainer}>
          <Image
            source={require('../../assets/images/user.png')}
            style={styles.icon}
          />
          <TextInput style={styles.email} placeholder="Email" />
        </View>
        <View style={styles.inputContainer}>
          <Image
            source={require('../../assets/images/password.png')}
            style={styles.icon}
          />
          <TextInput style={styles.email} placeholder="Contraseña" secureTextEntry />
        </View>
        <Pressable onPress={() => navigation.navigate('HomeScreen' as never)}>
          <Text style={styles.button}>Iniciar sesión</Text>
        </Pressable>
      </Animated.View>
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
    height: height * 0.5,
    resizeMode: 'cover',
    zIndex: 0,
    opacity: 0.8, // Le da un toque de suavidad al fondo
  },
  containerBackground: {
    backgroundColor: 'rgba(37, 53, 71, 0.8)',
    width: width,
    height: height * 0.5,
    position: 'absolute',
    top: 1,
    zIndex: 1,
  },
  formContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: width,
    backgroundColor: 'rgb(255, 255, 255)',
    marginTop: '40%',
    height: height * 0.7,
    borderTopLeftRadius: 40, // Borde más suave
    position: 'absolute',
    top: '15%',
    zIndex: 2,
    shadowColor: '#000', // Sombra para el formulario
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5, // Sombra para Android
  },
  text: {
    fontSize: 70,
    fontWeight: 'bold',
    color: '#e8ba61',
    marginTop: 80,
    fontFamily: 'Popping-Regular',
  },
  email: {
    fontSize: 20,
    paddingLeft: 15,
    flex: 1,
  },
  password: {
    fontSize: 20,
    padding: 10,
    backgroundColor: '#f3ebdf',
    borderRadius: 10,
    marginTop: 20,
    width: '80%',
    textAlign: 'left',
  },
  button: {
    fontSize: 20,
    color: 'white',
    backgroundColor: '#253547',
    padding: 10,
    borderRadius: 10,
    marginTop: 70,
    width: width * 0.75,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3ebdf',
    borderRadius: 10,
    marginTop: 20,
    width: '80%',
    paddingLeft: 15,
  },
  icon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
});

