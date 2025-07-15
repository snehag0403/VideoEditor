import { View, Text, StyleSheet, Pressable, GestureResponderEvent } from 'react-native'
import React, { useState } from 'react'
import CustomButton from '../components/CustomButton'
import {
    launchImageLibrary,
    ImagePickerResponse,
    MediaType,
  } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
    const navigation = useNavigation();

    const [videoPath, setVideoPath] = useState<string | null>(null);
    const [trimmedVideo, setTrimmedVideo] = useState<string | null>(null);
  const pickVideo = async () => {
    const options = {
      mediaType: 'video' as MediaType,
      videoQuality: 'high' as const,
      selectionLimit: 1,
    };
    const result: ImagePickerResponse = await launchImageLibrary(options);
    if (result.assets && result.assets[0].uri) {
      const videoUri = result.assets[0].uri;
    //   setVideoPath(videoUri);
    //   setTrimmedVideo(null);
      navigation.navigate('VideoScreen', { videoUri });
    }
  };
  return (
    <View style={styles.container}>
        <Text style={styles.text}>Video Editor</Text>
        <View>
            <Text style={styles.heading}>Trim and Merge Videos</Text>
            <Text style={styles.paragraph}>Easily trim your videos to the perfect length and merge multiple clips into a single masterpiece. Add background music to enhance your videos.</Text>
        </View>
        <View style={styles.button}>
            <CustomButton title='Pick a Video' onPress={pickVideo}/>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
    container:{
        flex:1,
        backgroundColor:'#1C2128',
        padding:10
    },
    text:{
        color:"white",
        fontSize:18,
        paddingTop:16,
        textAlign:'center',
        fontWeight:'bold'
    },
    heading:{
        color:"white",
        fontSize:28,
        paddingTop:20,
        textAlign:'center',
        fontWeight:'bold'
    },
    paragraph:{
        color:"white",
        fontSize:16,
        paddingTop:12,
        textAlign:'center',
        // fontWeight:'bold'
    },
    button:{
        flex:1,
        justifyContent:'flex-end',
        paddingBottom:15
    }
})