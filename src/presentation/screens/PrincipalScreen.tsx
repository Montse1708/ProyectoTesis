import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export const PrincipalScreen = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/fondo2.jpeg')}
        style={styles.backgroundImage}
      />
      <View style={styles.containerBackground}></View>
      
      <Image
        source={require('../../assets/images/logoSinFondo.png')}
        style={styles.logo}
      />
      <View style={styles.blurContainer}>
        <BlurView
          blurAmount={10}
          blurType="light"
          style={styles.blurView}
        />
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
    backgroundColor: '#rgba(255, 255, 255, 0.86)',
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
  logo: {
    zIndex: 2,
    width: 250,
    height: 250,
    marginTop: '30%',
  },
  blurContainer: {
    position: 'absolute',
    top: '50%', // Ajustar la posición vertical
    width: '80%',
    height: height * 0.25,
    zIndex: 3,
    alignSelf: 'center', // Centra el contenedor horizontalmente
    borderColor: 'rgb(243,235,223)',
    borderWidth: 3, // Define el borde
    borderRadius: 10, // Esquinas redondeadas
    overflow: 'hidden', // Asegura que el BlurView se recorte dentro del contenedor
    justifyContent: 'center', // Centra el contenido verticalmente
    alignItems: 'center', // Centra el contenido horizontalmente
  },
  blurView: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  login: {
    zIndex: 4, // Asegura que el botón esté por encima del BlurView
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgb(232, 187, 97)',
    borderRadius: 10,
    width: '70%',
    alignItems: 'center',
  },
  registro: {
    zIndex: 4, // Asegura que el botón esté por encima del BlurView
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(37, 53, 71, 0.68)',
    borderRadius: 10,
    width: '70%',
    alignItems: 'center',
    marginTop: 30
  },
  buttonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
});
