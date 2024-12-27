import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window'); 

export const Login = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/fondo.jpg') } style={styles.backgroundImage}
      />
      
      <View style={styles.formContainer}>
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
    backgroundColor: '#f5f5f5',
    position: 'relative', 
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width, 
    height: height,
    resizeMode: 'cover', 
  },
  formContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: width,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: '30%', // Ajuste para que no se sobreponga tanto en la pantalla
    height: height * 0.7, // Establecer un alto proporcional al 70% de la pantalla
    borderRadius: 100, // Valor más pequeño para bordes redondeados
    position: 'absolute', // Para asegurarse de que esté encima de la imagen de fondo
    top: '15%', // Para desplazarlo un poco más abajo si es necesario
  },
  text: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#e8ba61',
    marginTop: 80
  },
  email: {
    fontSize: 20,
    padding: 10,
    backgroundColor: '#f3ebdf',
    borderRadius: 10,
    marginTop: 40,
    width: '80%', // Asegura que el campo ocupe todo el ancho disponible
    textAlign: 'left', // Alineación del texto a la izquierda
  },
  password: {
    fontSize: 20,
    padding: 10,
    backgroundColor: '#f3ebdf',
    borderRadius: 10,
    marginTop: 20,
    width: '80%', // Asegura que el campo ocupe todo el ancho disponible
    textAlign: 'left', // Alineación del texto a la izquierda
  },
  button: {
    fontSize: 20,
    color: 'white',
    backgroundColor: '#253547',
    padding: 10,
    borderRadius: 5,
    marginTop: 30,
  },
});

