import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window'); // Ancho de la pantalla
const { height } = Dimensions.get('window')

export const HomeScreen = () => {
  const data = [
    { id: 1, title: 'Card 1', color: '#FF5733' },
    { id: 2, title: 'Card 2', color: '#33FF57' },
    { id: 3, title: 'Card 3', color: '#3357FF' },
    { id: 4, title: 'Card 4', color: '#F5A623' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>DysMathAI</Text>
      <Carousel
        loop
        width={width*0.90} // Ancho del carrusel (90% de la pantalla)
        height={200} // Altura de las tarjetas
        autoPlay={true}
        data={data}
        scrollAnimationDuration={1000}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: item.color }]}>
            <Text style={styles.cardText}>{item.title}</Text>
          </View>
        )}
        style={styles.carousel}
      />
      <View>
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    height: height,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily:'Popping',
    marginTop: 20,
  },
  carousel: {
    alignSelf: 'center', // Centra el carrusel horizontalmente
  },
  card: {
    width: '100%', // Las tarjetas ocupan todo el ancho del carrusel
    height: '100%', // Se ajusta al alto del carrusel
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});
