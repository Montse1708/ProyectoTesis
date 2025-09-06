import { createStackNavigator } from '@react-navigation/stack';
import { Login } from '../presentation/screens/Login';
import { HomeScreen } from '../presentation/screens/HomeScreen';
import { PrincipalScreen } from '../presentation/screens/PrincipalScreen';
import { MenuNavigation } from './MenuNavigation';
import { Addition } from '../presentation/screens/Addition';
import { Tutor } from '../presentation/screens/Tutor';
const Stack = createStackNavigator();

export const StackNavigation = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PrincipalScreen" component={PrincipalScreen}  //options={{ headerShown: false }} 
      />
      <Stack.Screen name="Login" component={Login}  //options={{ headerShown: false }} 
      />
      <Stack.Screen name="HomeScreen" component={MenuNavigation} //options={{ headerShown: false }} 
      />
      <Stack.Screen name="Addition" component={Addition} //options={{ headerShown: false }} 
      />
      <Stack.Screen name="Tutor" component={Tutor} />
    </Stack.Navigator>
  );
}
