import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, TextInput, Image } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import LinearGradient from 'react-native-linear-gradient'; // Importa LinearGradient
import { ScrollView } from 'react-native-gesture-handler';
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
    { id: 1, title: 'Suma', color: '#FF6347' },
    { id: 2, title: 'Resta', color: '#4682B4' },
    { id: 3, title: 'Multiplicación', color: '#FF6347' },
    { id: 4, title: 'División', color: '#4682B4' },
  ];

  return (
    <View style={styles.container}>
      {/* Degradado solo en la parte superior */}
      <LinearGradient
      colors={['rgb(37, 53, 71)','rgba(29, 74, 59, 0.72)']}
      start={{ x: 0, y: 0 }} // Comienza en la parte superior izquierda
      end={{ x: 1, y: 1 }} // Termina en la parte inferior derecha
      style={styles.gradient}
    >
      <Text style={styles.header}>DysMathAI</Text>
      <View style={styles.buscarContainer}>
        <Image
                    source={require('../../assets/images/search.png')}
                    style={styles.icon}
                  />
        <TextInput style={styles.buscar} placeholder="Buscar"/>
      </View>
    </LinearGradient>


      {/* Carrusel */}
      <Carousel
        loop
        width={width * 0.90} // Ancho del carrusel (90% de la pantalla)
        height={200} // Altura de las tarjetas
        autoPlay={true}
        data={data}
        scrollAnimationDuration={1000}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: item.color }]} >
            <Text style={styles.cardText}>{item.title}</Text>
          </View>
        )}
        style={styles.carousel}
      />

      {/* Categorías */}
        <Text style={styles.categoriesHeader}>Categorías</Text>
        <View style={styles.categoriesContainer}>
        <ScrollView 
      contentContainerStyle={{ paddingHorizontal: 20 }}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {
        categorias.map((categoria) => (
          <View key={categoria.id} style={[styles.cardCategories, { backgroundColor: categoria.color }]}>
            {/* Círculo */}
            <View style={styles.circle} />
            <Image
                    source={require('../../assets/images/suma.png')}
                    style={styles.iconCategory}
                  />
            <Text style={styles.cardTextCategories}>{categoria.title}</Text>
          </View>
        ))
      }
    </ScrollView>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'flex-start', // Asegura que los elementos se alineen desde la parte superior
    alignItems: 'center',
    height: height,
    paddingTop: 20, // Ajuste para que el contenido no quede pegado al borde superior
  },
  gradient: {
    width: '100%',
    height: 250, // Solo la parte superior tendrá el degradado
    position: 'absolute', // Lo coloca sobre la parte superior de la pantalla
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  header: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins',
    marginTop: '20%',
  },
  carousel: {
    alignSelf: 'center',
    marginTop: 150, // Deja espacio para el encabezado y el degradado
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
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Alinea los elementos a la izquierda
    width: '100%', // Asegura que ocupe el 100% del ancho
    marginBottom: '55%',
  },
  cardCategories: {
    width: width * 0.3, // El ancho de cada tarjeta es un 30% del ancho de la pantalla
    height: 120, // Altura de las tarjetas
    marginRight: 10, // Espacio entre tarjetas
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 30,
  },
  cardTextCategories: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  circle: {
    width: 100, // Ancho del círculo (más grande)
    height: 100, // Altura del círculo (más grande)
    borderRadius: 50, // La mitad del ancho/alto para mantener la forma circular
    backgroundColor: '#fff', // Color del círculo
    position: 'absolute', // Posiciona el círculo sobre la tarjeta
    top: -20, // Coloca el círculo por encima de la tarjeta
    alignSelf: 'center', // Centra el círculo horizontalmente en la tarjeta
    borderWidth: 2, // Borde opcional para destacar el círculo
    borderColor: '	#f3ebdf', // Color del borde
  },
  buscar: {
    fontSize: 20,
    paddingLeft: 15, // Espacio para el texto
    flex: 1, // Hace que el input ocupe el espacio disponible
  },
  buscarContainer: {
    marginBottom: '35%',
    backgroundColor: '#f3ebdf',
    borderRadius: 50,
    marginTop: 20,
    width: '90%',
    height: 50, // Ajusta la altura del contenedor
    paddingLeft: 15,
    flexDirection: 'row', // Coloca el ícono y el input en fila
    alignItems: 'center', // Centra el ícono y el input verticalmente
    zIndex: 1,
  },
  icon: {
    width: 30,
    height: 30,// Añade espacio entre el ícono y el TextInput
  },
  iconCategory: {
    width: '70%',
    height: '70%',// Añade espacio entre el ícono y el TextInput
    marginBottom: 10,
  },
});
