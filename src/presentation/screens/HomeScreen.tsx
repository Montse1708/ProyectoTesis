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
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

export const HomeScreen = () => {
  type CarouselItem = {
    id: number;
    image?: any;
  };

  const data: CarouselItem[] = [
    { id: 1, image: require('../../assets/images/carrusel1.png') },
    { id: 2, image: require('../../assets/images/carrusel2.png') },
    { id: 3, image: require('../../assets/images/carrusel3.png') },
    { id: 4, image: require('../../assets/images/carrusel4.png') },
    { id: 5, image: require('../../assets/images/carrusel5.png') },
    { id: 6, image: require('../../assets/images/carrusel6.png') },
  ];

  const categorias = [
    { id: 1, title: 'Series', color: 'rgba(37, 53, 71, 1)', image: require('../../assets/images/series.png') },
    { id: 2, title: 'Suma', color: 'rgba(29, 74, 59, 1)', image: require('../../assets/images/suma.png') },
    { id: 3, title: 'Resta', color: 'rgb(232,186,97)', image: require('../../assets/images/resta.png') },
    { id: 4, title: 'Multiplicación', color: 'rgb(232,186,97)', image: require('../../assets/images/multiplicación.png') },
    { id: 5, title: 'División', color: 'rgba(29, 74, 59, 1)', image: require('../../assets/images/división.png') },
    { id: 6, title: 'Fracciones', color: 'rgba(37, 53, 71, 1)', image: require('../../assets/images/fracciones.png') },
  ];

  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const navigation = useNavigation<any>();

  const handleNavigate = (title: string) => {
    if (title === 'Series') navigation.navigate('Series');
    else if (title === 'Suma') navigation.navigate('Addition');
    else if (title === 'Resta') navigation.navigate('Subtraction');
    else if (title === 'Multiplicación') navigation.navigate('Multiplication');
    else if (title === 'División') navigation.navigate('Division');
    else if (title === 'Fracciones') navigation.navigate('Fractions');
  };

  return (
    <View style={styles.container}>
      {/* Header con degradado */}
      <LinearGradient
        colors={['#253547', '#1d4a3b']} // paleta ajustada
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.header}>DysMathAI</Text>
        <View style={styles.buscarContainer}>
          <Image source={require('../../assets/images/search.png')} style={styles.icon} />
          <TextInput style={styles.buscar} placeholder="Buscar" placeholderTextColor="#666" />
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
          <View style={styles.cardWrapper}>
            <View style={[styles.cardInner, item.image]}>
                <Image source={item.image} style={styles.cardImage} resizeMode="cover" />
            </View>
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
              <Image source={c.image} style={styles.iconCategory} resizeMode="contain" />
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
    height: 380, // aumentado para subir header/buscador/carrusel
    position: 'absolute',
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 0, // quitamos borderBottom para usar arco
    borderBottomRightRadius: 0,
    overflow: 'visible',
    zIndex: 0,
  },

  // Arco blanco (recorta la parte inferior del gradiente)
  arc: {
    position: 'absolute',
    top: 250, // mueve el arco según height del gradiente
    alignSelf: 'center',
    width: width * 2,
    height: width * 2,
    borderRadius: width,
    backgroundColor: '#fff',
    zIndex: 0,
  },

  header: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f3ebdf',
    fontFamily: 'Poppins',
    marginTop: -200,
    zIndex: 2,
  },

  // Carrusel
  carousel: {
    alignSelf: 'center',
    marginTop: 160, // empuja debajo del arco (ajusta si cambias arc.top)
    zIndex: 3
  },

  // card wrapper + inner para borderRadius + sombra
  // estilos relevantes (reemplaza los que tienes)
cardWrapper: {
  width: '100%',
  height: 200,
  marginVertical: 8,
  // sombra (wrapper) — NO poner overflow: 'hidden' aquí
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
  elevation: 6,
  overflow: 'visible',
},
cardInner: {
  flex: 1,// recorte aplicado al contenedor interior
  overflow: 'hidden', // IMPORTANT: recorta la image en iOS/Android
  backgroundColor: '#f3ebdf',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 16,
},
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
},
  // Categorías
  categoriesHeader: { fontSize: 20, fontWeight: 'bold', paddingBottom: 40, marginTop: 10 },
  categoriesContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
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
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
    zIndex: 3,
  },
  cardTextCategories: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 8,
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
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 0
  },

  // buscador
  buscar: { fontSize: 18, paddingLeft: 15, flex: 1, color: '#253547' },
  buscarContainer: {
    marginBottom: 8,
    backgroundColor: '#f3ebdf',
    borderRadius: 50,
    marginTop: 18,
    width: '90%',
    height: 48,
    paddingLeft: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  icon: { width: 28, height: 28, tintColor: '#253547' },

  // íconos
  iconCategory: {
    width: 70,
    height: 70,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  // menú horizontal
  categoryMenu: {
    marginTop: 370,
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
    zIndex: 0
  },
});