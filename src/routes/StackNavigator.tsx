import { createStackNavigator } from '@react-navigation/stack';
import { Login } from '../presentation/screens/Login';
import { PrincipalScreen } from '../presentation/screens/PrincipalScreen';
import { MenuNavigation } from './MenuNavigation';
import { Addition } from '../presentation/screens/Addition';
import { Subtraction } from '../presentation/screens/Subtraction';
import { Multiplication } from '../presentation/screens/Multiplication';
import { Division } from '../presentation/screens/Division';
import { Fractions } from '../presentation/screens/Fraction';
import { Series } from '../presentation/screens/Series';

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
      <Stack.Screen name='Subtraction' component={Subtraction}
      />
      <Stack.Screen name='Multiplication' component={Multiplication}
      />
      <Stack.Screen name='Division' component={Division}
      />
      <Stack.Screen name='Fractions' component={Fractions}
      />
      <Stack.Screen name='Series' component={Series}
      />
    </Stack.Navigator>
  );
}
