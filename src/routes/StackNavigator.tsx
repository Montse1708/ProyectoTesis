import { createStackNavigator } from '@react-navigation/stack';
import { Login } from '../presentation/screens/Login';
import { HomeScreen } from '../presentation/screens/HomeScreen';
const Stack = createStackNavigator();

export const StackNavigation = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={Login}  options={{ headerShown: false }} />
      <Stack.Screen name="HomeScreen" component={HomeScreen}  options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
