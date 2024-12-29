import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window'); 

export const Login = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/fondo2.jpeg') } style={styles.backgroundImage}
      />
      <View style={styles.containerBackground}></View>
      <View style={styles.formContainer} >
        <Text style={styles.text}>Login</Text>
        <TextInput style={styles.email} placeholder="Email" />
        <TextInput style={styles.password} placeholder="Contraseña" />
        <Pressable onPress={() => navigation.navigate('HomeScreen' as never)}>
          <Text style={styles.button}>Iniciar sesión</Text>
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
    height: height * 0.5,
    resizeMode: 'cover', 
    zIndex: 0,
  },
  containerBackground: {
    backgroundColor: 'rgba(37, 53, 71, 0.86)',
    width: width,
    height: height * 0.5,  // Asegúrate de que ocupe toda la altura de la pantalla
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
    marginTop: '40%', // Ajuste para que no se sobreponga tanto en la pantalla
    height: height * 0.7, // Establecer un alto proporcional al 70% de la pantalla
    borderTopLeftRadius: 200, // Valor más pequeño para bordes redondeados
    position: 'absolute', // Para asegurarse de que esté encima de la imagen de fondo
    top: '15%', // Para desplazarlo un poco más abajo si es necesario
    zIndex: 2,
  },
  text: {
    fontSize: 70,
    fontWeight: 'bold',
    color: '#e8ba61',
    marginTop: 80,
    fontFamily: 'Poppins',
  },
  email: {
    fontSize: 20,
    padding: 10,
    backgroundColor: '#f3ebdf',
    borderRadius: 10,
    marginTop: 40,
    width: '80%', // Asegura que el campo ocupe todo el ancho disponible
    textAlign: 'left', // Alineación del texto a la izquierda
    fontFamily: 'Poppins'
  },
  password: {
    fontSize: 20,
    padding: 10,
    backgroundColor: '#f3ebdf',
    borderRadius: 10,
    marginTop: 20,
    width: '80%', // Asegura que el campo ocupe todo el ancho disponible
    textAlign: 'left', // Alineación del texto a la izquierda
    shadowColor: '#253547', 
    shadowOffset: { width: 0, height: 20 }, // Desplazamiento de la sombra
    shadowOpacity: 0.8, // Opacidad de la sombra
    shadowRadius: 4, // Radio de la sombra
    // Sombra para Android
    elevation: 5, // Elevación para Android
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
  },
});

