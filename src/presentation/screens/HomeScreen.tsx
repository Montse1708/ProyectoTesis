import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React, { useState } from 'react';
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
    { id: 1, title: 'Suma', color: 'rgba(37, 53, 71, 0.8)', image: <Image source={require('../../assets/images/suma.png')} style={styles.iconSuma}/>},
    { id: 2, title: 'Resta', color: 'rgba(29, 74, 59, 0.72)', image: <Image source={require('../../assets/images/resta.png')} style={styles.iconCategory}/> },
    { id: 3, title: 'Multiplicación', color: 'rgb(232,186,97)', image: <Image source={require('../../assets/images/multiplicación.png')} style={styles.iconCategory}/> },
    { id: 4, title: 'División', color: 'rgba(37, 53, 71, 0.65)', image: <Image source={require('../../assets/images/división.png')} style={styles.iconDivision}/> },
  ];

  const [activeCategory, setActiveCategory] = useState(Number);

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

        <ScrollView style={styles.categoryMenu}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          horizontal
          showsHorizontalScrollIndicator={false} 
          >
          {
            categorias.map((categoria) => (
              <TouchableOpacity
              key={categoria.id}
              style={[
                styles.menuCircle,
                { backgroundColor: activeCategory === categoria.id ? '#e8ba61' : '#f3ebdf' }, // Cambia el color dinámicamente
              ]}
              onPress={() => setActiveCategory(categoria.id)} // Actualiza la categoría activa
            >
              <Text style={styles.menuText}>{categoria.title}</Text>
            </TouchableOpacity>
            ))
          }
        </ScrollView>

      {/* Categorías */}
        <Text style={styles.categoriesHeader}>Categorías</Text>
        <View style={styles.categoriesContainer}>
        <View style={styles.categoriesContainer}>
        {/* Primera fila: 3 tarjetas */}
        <View style={styles.row}>
          {categorias.slice(0, 3).map((categoria) => (
            <View key={categoria.id} style={[styles.cardCategories, { backgroundColor: categoria.color }]}>
              <View style={styles.circle} />
              {categoria.image}
              <Text style={styles.cardTextCategories}>{categoria.title}</Text>
            </View>
          ))}
        </View>

        {/* Segunda fila: 2 tarjetas */}
        <View style={styles.row}>
          {categorias.slice(3, 5).map((categoria) => (
            <View key={categoria.id} style={[styles.cardCategories, { backgroundColor: categoria.color }]}>
              <View style={styles.circle} />
              {categoria.image}
              <Text style={styles.cardTextCategories}>{categoria.title}</Text>
            </View>
          ))}
        </View>
      </View>

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
    paddingBottom: 30
  },
  categoriesContainer: {
    flexDirection: 'column', // Organiza las filas en columna
    alignItems: 'center', // Centra las filas horizontalmente
    width: '100%', // Asegura que el contenedor ocupe todo el ancho
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row', // Las tarjetas de cada fila se colocan en fila
    justifyContent: 'space-between', // Espacia las tarjetas uniformemente
    width: '90%', // Ancho de la fila
    marginBottom: 20, // Espacio entre filas
  },
  cardCategories: {
    width: '30%', // Cada tarjeta ocupa el 30% del ancho (ideal para 3 tarjetas por fila)
    height: 120, // Altura de las tarjetas
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
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
    borderWidth: 3, // Borde opcional para destacar el círculo
    borderColor: '#f3ebdf', // Color del borde
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
  iconSuma: {
    width: '40%',
    height: '60%',
    padding: 45,
  },
  iconDivision: {
    width: '60%',
    height: '60%',
    marginBottom: 20,
  },
  categoryMenu: {
    marginTop: '70%',
    marginHorizontal: 15,
    marginLeft: 5,
    marginRight: 25,
  },
  menuText:{
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
    alignItems: 'center',
    paddingTop: 15,
  },
  menuCircle: {
    width: 120, 
    height: 50, 
    backgroundColor: '#f3ebdf', // Color del círculo
    borderRadius: 20,
    marginLeft: 20,
  }
});
