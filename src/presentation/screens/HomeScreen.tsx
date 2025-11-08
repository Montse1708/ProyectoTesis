import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Image,
  Pressable,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import LinearGradient from 'react-native-linear-gradient';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export const HomeScreen = () => {
  const data = [
    { id: 1, title: 'Card 1', color: '#FF5733' },
    { id: 2, title: 'Card 2', color: '#33FF57' },
    { id: 3, title: 'Card 3', color: '#3357FF' },
    { id: 4, title: 'Card 4', color: '#F5A623' },
    { id: 5, title: 'Card 5', color: '#33FF57' },
    { id: 6, title: 'Card 6', color: '#33FF57' },
  ];

  const categorias = [
    { id: 1, title: 'Series',          color: 'rgba(37, 53, 71, 1)', image: require('../../assets/images/series.png') },
    { id: 2, title: 'Suma',            color: 'rgba(29, 74, 59, 1)', image: require('../../assets/images/suma.png') },
    { id: 3, title: 'Resta',           color: 'rgb(232,186,97)',     image: require('../../assets/images/resta.png') },
    { id: 4, title: 'Multiplicación',  color: 'rgb(232,186,97)',     image: require('../../assets/images/multiplicación.png') },
    { id: 5, title: 'División',        color: 'rgba(29, 74, 59, 1)', image: require('../../assets/images/división.png') },
    { id: 6, title: 'Fracciones',      color: 'rgba(37, 53, 71, 1)', image: require('../../assets/images/fracciones.png') },
  ];

  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const navigation = useNavigation<any>();

  const handleNavigate = (title: string) => {
    if (title === 'Series')           navigation.navigate('Series');
    else if (title === 'Suma')        navigation.navigate('Addition');
    else if (title === 'Resta')       navigation.navigate('Subtraction');
    else if (title === 'Multiplicación') navigation.navigate('Multiplication');
    else if (title === 'División')    navigation.navigate('Division');
    else if (title === 'Fracciones')  navigation.navigate('Fractions');
  };

  return (
    <View style={styles.container}>
      {/* Header con degradado */}
      <LinearGradient
        colors={['rgb(37, 53, 71)', 'rgba(29, 74, 59, 0.72)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.header}>DysMathAI</Text>
        <View style={styles.buscarContainer}>
          <Image source={require('../../assets/images/search.png')} style={styles.icon} />
          <TextInput style={styles.buscar} placeholder="Buscar" />
        </View>
      </LinearGradient>

      {/* Arco blanco que “muerde” el degradado */}
      <View style={styles.arc} />

      {/* Carrusel */}
      <Carousel
        loop
        width={width * 0.9}
        height={200}
        autoPlay
        data={data}
        scrollAnimationDuration={1000}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: item.color }]}>
            <Text style={styles.cardText}>{item.title}</Text>
          </View>
        )}
        style={styles.carousel}
      />

      {/* Menú horizontal */}
      <ScrollView
        style={styles.categoryMenu}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {categorias.map((categoria) => (
          <TouchableOpacity
            key={categoria.id}
            style={[
              styles.menuCircle,
              { backgroundColor: activeCategory === categoria.id ? '#e8ba61' : '#f3ebdf' },
            ]}
            onPress={() => setActiveCategory(categoria.id)}
          >
            <Text style={styles.menuText}>{categoria.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Categorías */}
      <Text style={styles.categoriesHeader}>Categorías</Text>

      <View style={styles.categoriesContainer}>
        {/* Fila 1 */}
        <View style={styles.row}>
          {categorias.slice(0, 3).map((c) => (
            <Pressable
              key={c.id}
              style={[styles.cardCategories, { backgroundColor: c.color }]}
              onPress={() => handleNavigate(c.title)}
            >
              <View style={styles.circle} />
              <Image source={c.image} style={styles.iconCategory} resizeMode="contain" />
              <Text style={styles.cardTextCategories}>{c.title}</Text>
            </Pressable>
          ))}
        </View>

        {/* Fila 2 */}
        <View style={styles.row}>
          {categorias.slice(3, 6).map((c) => (
            <Pressable
              key={c.id}
              style={[styles.cardCategories, { backgroundColor: c.color }]}
              onPress={() => handleNavigate(c.title)}
            >
              <View style={styles.circle} />
              <Image
                source={c.image}
                style={c.title === 'Fracciones' ? styles.iconFraccion : styles.iconCategory}
                resizeMode="contain"
              />
              <Text style={styles.cardTextCategories}>{c.title}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Layout base
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    height,
  },

  // Header con gradiente
  gradient: {
    width: '100%',
    height: 350,
    position: 'absolute',
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'visible',     // que no recorte el arco
    zIndex: 0,
  },

  // Arco blanco
  arc: {
    position: 'absolute',
    top: 250,                // ajusta para mover el arco
    alignSelf: 'center',
    width: width * 2,        // grande para cubrir todo
    height: width * 2,
    borderRadius: width,     // círculo perfecto
    backgroundColor: '#fff',
    zIndex: 0,
  },

  header: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins',
    zIndex: 2,
  },

  // Carrusel
  carousel: {
    alignSelf: 'center',
    marginTop: 170,          // empuja debajo del arco
    zIndex: 2,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },

  // Categorías
  categoriesHeader: { fontSize: 20, fontWeight: 'bold', paddingBottom: 30 },
  categoriesContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 30,
  },
  cardCategories: {
    width: '30%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#fff',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  cardTextCategories: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 18,
  },

  // círculo detrás del ícono
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3ebdf',
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#f3ebdf',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  // buscador
  buscar: { fontSize: 20, paddingLeft: 15, flex: 1 },
  buscarContainer: {
    marginBottom: '35%',
    backgroundColor: '#f3ebdf',
    borderRadius: 50,
    marginTop: 20,
    width: '90%',
    height: 50,
    paddingLeft: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  icon: { width: 30, height: 30 },

  // íconos
  iconCategory: {
    width: 70,
    height: 70,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  iconFraccion: {
    width: 70,
    height: 70,
    marginBottom: 6,
    resizeMode: 'contain',
  },

  // menú horizontal
  categoryMenu: {
    marginTop: '78%',
    marginHorizontal: 15,
    marginLeft: 5,
    marginRight: 25,
  },
  menuText: {
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
    alignItems: 'center',
    paddingTop: 15,
  },
  menuCircle: {
    width: 120,
    height: 50,
    backgroundColor: '#f3ebdf',
    borderRadius: 20,
    marginLeft: 20,
  },
});