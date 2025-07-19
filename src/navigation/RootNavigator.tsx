import { View, Text } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from '../screens/HomeScreen';
import VideoScreen from '../screens/VideoScreen';
import AudioScreen from '../screens/AudioScreen';
import PreviewScreen from '../screens/PreviewScreen';
const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}} >
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="VideoScreen" component={VideoScreen} />
      <Stack.Screen name="AudioScreen" component={AudioScreen} />
      <Stack.Screen name="PreviewScreen" component={PreviewScreen} />
    </Stack.Navigator>
  )
}

export default RootNavigator