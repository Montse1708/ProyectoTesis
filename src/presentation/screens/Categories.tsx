// src/presentation/screens/Categories.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const COLORS = {
  tealDark: '#1d4a3b',   // (29,74,59)
  navy: '#253547',       // (37,53,71)
  cream: '#f3ebdf',      // (243,235,223)
  accent: '#e8ba61',     // (232,186,97)
};

type CategoryId = 'seq' | 'add' | 'sub' | 'mul' | 'div' | 'frac';

type Category = {
  id: CategoryId;
  title: string;
  subtitle: string;
  image: any;
  colors: [string, string];
};

const CATEGORIES: Category[] = [
  {
    id: 'seq',
    title: 'Series',
    subtitle: 'Secuencias aritméticas y geométricas',
    image: require('../../assets/images/series.png'),
    colors: ['#1d4a3b', '#253547'], // teal → navy
  },
  {
    id: 'add',
    title: 'Sumas',
    subtitle: 'Practica sumas con llevadas',
    image: require('../../assets/images/suma.png'),
    colors: ['#e8ba61', '#1d4a3b'], // accent → teal
  },
  {
    id: 'sub',
    title: 'Restas',
    subtitle: 'Restas con préstamo paso a paso',
    image: require('../../assets/images/resta.png'),
    colors: [COLORS.navy, '#1d4a3b'], // navy → teal
  },
  {
    id: 'mul',
    title: 'Multiplicación',
    subtitle: 'Tablas y productos más grandes',
    image: require('../../assets/images/multiplicación.png'),
    colors: ['#e8ba61', '#253547'], // accent → navy
  },
  {
    id: 'div',
    title: 'División',
    subtitle: 'Repartos con cociente entero',
    image: require('../../assets/images/división.png'),
    colors: ['#1d4a3b', '#253547'],
  },
  {
    id: 'frac',
    title: 'Fracciones',
    subtitle: 'Opera fracciones con explicación',
    image: require('../../assets/images/fracciones.png'),
    colors: ['#253547', '#1d4a3b'],
  },
];

const CARD_WIDTH = width - 32; // margen lateral
const CARD_HEIGHT = 96;

// ---------- Card individual ----------
type CategoryCardProps = {
  item: Category;
  onPress: (cat: Category) => void;
};

const CategoryCard: React.FC<CategoryCardProps> = ({ item, onPress }) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress(item)}
    >
      <Animated.View style={{ transform: [{ scale }], marginBottom: 14 }}>
        <LinearGradient
          colors={item.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Ícono */}
          <View style={styles.iconContainer}>
            <Image
              source={item.image}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>

          {/* Texto */}
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// ---------- Pantalla de categorías ----------
export const Categories = () => {
  const navigation = useNavigation<any>();

const handleCategoryPress = (cat: Category) => {
  console.log("Category pressed:", cat.id);
  switch (cat.id) {
    case "add":
      navigation.navigate("Addition");
      break;
    case "sub":
      navigation.navigate("Subtraction");
      break;
    case "mul":
      navigation.navigate("Multiplication");
      break;
    case "div":
      navigation.navigate("Division");
      break;
    case "frac":
      navigation.navigate("Fractions");
      break;
    case "seq":
      navigation.navigate("Series");
      break;
  }
};
  return (
    <View style={styles.container}>
      {/* HEADER FULL WIDTH CON OVERLAY NAVY */}
      <View style={styles.heroContainer}>
        <Image
          source={require('../../assets/images/header-math.png')}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay} />

        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Entrenamiento Matemático</Text>
          <Text style={styles.heroSubtitle}>DysMath AI</Text>

          <Text style={styles.heroDescription}>
            Practica operaciones adaptativas con explicaciones paso a paso,
            pensadas para estudiantes con dificultades en matemáticas.
          </Text>

          <View style={styles.heroMetaRow} />
        </View>
      </View>

      {/* Lista de tarjetas */}
      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CategoryCard item={item} onPress={handleCategoryPress} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Fondo general
  container: {
    flex: 1,
    backgroundColor: '#1d4a3bb7',
  },

  // ----- HEADER FULL WIDTH -----
  heroContainer: {
    width: '100%',
    height: 170,
    position: 'relative',
    marginBottom: 10,
    backgroundColor: COLORS.navy,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(37,53,71,0.65)', // NAVY translúcido
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.accent,
    marginBottom: 6,
    fontWeight: '600',
  },
  heroDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 10,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // ----- LISTA -----
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },

  // Card tipo screenshot
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  iconContainer: {
    width: CARD_HEIGHT - 24,
    height: CARD_HEIGHT - 24,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    width: '70%',
    height: '70%',
  },

  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.cream,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(243,235,223,0.9)',
  },
});
