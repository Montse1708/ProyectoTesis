import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window'); // Ancho de la pantalla
const { height } = Dimensions.get('window'); // Altura de la pantalla

export const HomeScreen = () => {
  const data = [
    { id: 1, title: 'Card 1', color: '#FF5733' },
    { id: 2, title: 'Card 2', color: '#33FF57' },
    { id: 3, title: 'Card 3', color: '#3357FF' },
    { id: 4, title: 'Card 4', color: '#F5A623' },
  ];

  const categorias = [
    { id: 1, title: 'Sumas', color: '#FF6347' },
    { id: 2, title: 'Resta', color: '#4682B4' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>DysMathAI</Text>

      {/* Carrusel */}
      <Carousel
        loop
        width={width * 0.90} // Ancho del carrusel (90% de la pantalla)
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

      {/* Categorías */}
      <Text style={styles.categoriesHeader}>Categorías</Text>
      <View style={styles.categoriesContainer}>
        {categorias.map((categoria) => (
          <TouchableOpacity key={categoria.id} style={[styles.card, { backgroundColor: categoria.color }]}>
            <Text style={styles.cardText}>{categoria.title}</Text>
          </TouchableOpacity>
        ))}
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
    fontFamily: 'Poppins',
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
  categoriesHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 15,
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '50%',
    height: '10%',
    paddingHorizontal: 10,
  },
});
