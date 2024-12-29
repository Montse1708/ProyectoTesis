import { createStackNavigator } from '@react-navigation/stack';
import { Login } from '../presentation/screens/Login';
import { HomeScreen } from '../presentation/screens/HomeScreen';
import { PrincipalScreen } from '../presentation/screens/PrincipalScreen';
const Stack = createStackNavigator();

export const StackNavigation = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PrincipalScreen" component={PrincipalScreen}  //options={{ headerShown: false }} 
      />
      <Stack.Screen name="Login" component={Login}  //options={{ headerShown: false }} 
      />
      <Stack.Screen name="HomeScreen" component={HomeScreen} //options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
}
