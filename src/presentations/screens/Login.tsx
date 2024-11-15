import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export const Login = () => {
  return (
    <LinearGradient colors={['#2c3e50', '#bdc3c7']} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Sign In to your account</Text>
        <TextInput
          placeholder="nombre@gmail.com"
          placeholderTextColor={'gray'}
          style={styles.TextInput}
        />
        <TextInput
          placeholder="Contraseña"
          placeholderTextColor={'gray'}
          style={styles.TextInput}
        />
      </View>
    </LinearGradient>
  );
};
//Test
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', 
  },
  title: {
    fontSize: 50,
    textAlign: 'center',
    color: '#34434D',
    padding: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 30,
    color: 'gray',
  },
  TextInput: {
    borderColor: 'gray',
    padding: 10,
    paddingStart: 20,
    width: '80%',
    color: 'gray',
    marginTop: 20,
    height: 50,
    borderRadius: 30,
    backgroundColor: '#FFFF',
  },
});
