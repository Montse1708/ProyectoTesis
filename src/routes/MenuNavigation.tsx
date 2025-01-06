import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../presentation/screens/HomeScreen';
import Ionicons from 'react-native-vector-icons/Ionicons'; 
import { View } from 'react-native';

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
          height: 60,
        },
      })}
    >
      <Tab.Screen name="HomeScreen" component={HomeScreen} />
      
    </Tab.Navigator>
  );
};


const menuIcons = (route: any, focused: boolean) => {
  let icon;

  if (route.name === 'HomeScreen') {
    icon = focused ? <Ionicons name={'home'} size={24} color={'#FF5733'}/> : <Ionicons name={'home-outline'} size={24} color={'#aaa'}/>; 
  }

  // Devuelve el ícono de Ionicons
  return (
    <View>
      {icon}
    </View>
  )
};