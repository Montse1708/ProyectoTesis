import { SafeAreaView } from "react-native";
import { Login } from "./src/presentations/screens/Login";


export const App = () => {
  return (
    <SafeAreaView style={{flex:1}}>
      <Login/>
    </SafeAreaView>
  )
}