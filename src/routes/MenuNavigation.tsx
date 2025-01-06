import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../presentation/screens/HomeScreen';
import Ionicons from 'react-native-vector-icons/Ionicons'; 
import { Image, View } from 'react-native';
import { StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

export const MenuNavigation = () => {
  return (
    
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused, color, size }) => menuIcons(route, focused),
        tabBarStyle: {
          marginBottom: 20,
          borderRadius: 50,
          backgroundColor: 'rgba(37, 53, 71, 0.8)',
          alignSelf: 'center',
          width: '95%',
          height: 70,
        },
        tabBarItemStyle: {
          marginTop: 15,
        }
      })}
    >
      <Tab.Screen name="HomeScreen" component={HomeScreen} />
      <Tab.Screen name="Favorite" component={HomeScreen} />
      <Tab.Screen name="Car" component={HomeScreen} />
    </Tab.Navigator>
  );
};


const menuIcons = (route: any, focused: boolean) => {
  let icon;
  if (route.name === 'HomeScreen') {
    icon = focused ? (
      <View style={styles.circleStyle}>
        <Image
          source={require('../assets/images/home-active.png')}
          style={styles.iconStyle}
        />
      </View>
    ) :  <Image
      source={require('../assets/images/home.png')} 
      style={{ width: 30, height: 30 }}
    />;
  }else{
    icon = focused ? (
      <View style={styles.circleStyle}>
        <Image
          source={require('../assets/images/home-active.png')}
          style={styles.iconStyle}
        />
      </View>
    ) :  <Image
      source={require('../assets/images/home.png')} 
      style={{ width: 30, height: 30 }}
    />;
  }

  // Devuelve el ícono de Ionicons
  return (
    <View>
      {icon}
    </View>
  )
};

const styles = StyleSheet.create({
  circleStyle: {
      width: 50,
      height: 50,
      borderRadius: 25, // Esto hace que el contenedor sea un círculo
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#e8ba61', // Fondo rojo cuando está activo
  },
  iconStyle:{
    width: 30, 
    height: 30
  }
});