import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';

export const Login = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Login</Text>
      <TextInput style={styles.email} placeholder="Email" />
      <TextInput style={styles.password} placeholder="Contraseña" />
      <Pressable onPress={() => navigation.navigate('HomeScreen' as never)}>
        <Text style={styles.button}>Iniciar sesión</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    textShadowColor: 'white',
    flex: 1, 
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 50,
    fontWeight: 'bold',
    marginTop: 100,
  },
  email: {
    fontSize: 20,
    padding: 15, 
    backgroundColor: 'lightblue',
    borderRadius: 10,
    width: '80%',
    marginTop: 40,
  },
  password: {
    fontSize: 20,
    padding: 15, 
    backgroundColor: 'lightblue',
    borderRadius: 10,
    width: '80%',
    marginTop: 40,
  },
  button:{
    marginTop: 40,
    fontSize: 20,
    backgroundColor: 'violet',
    padding: 10,
    borderRadius: 10,
    width: '100%',
    margin: 10
  }
});
