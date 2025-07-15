import { View, Text, StyleSheet, Pressable, GestureResponderEvent, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import CustomButton from '../components/CustomButton'
import {
    launchImageLibrary,
    ImagePickerResponse,
    MediaType,
  } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Typography } from '../../constants/constants';

export default function HomeScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    // const [videoPath, setVideoPath] = useState<string | null>(null);
    // const [trimmedVideo, setTrimmedVideo] = useState<string | null>(null);
  const pickVideo = async () => {
    setLoading(true);
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

    setLoading(false);
  };
  return (
    <View style={[styles.container,{backgroundColor:Typography.Colors.backgroundColor}]}>
        <Text style={[styles.text,{color:Typography.Colors.white}]}>Video Editor</Text>
        <View>
            <Text style={[styles.heading,{color:Typography.Colors.white}]}>Trim and Merge Videos</Text>
            <Text style={[styles.paragraph,{color:Typography.Colors.white}]}>Easily trim your videos to the perfect length and merge multiple clips into a single masterpiece. Add background music to enhance your videos.</Text>
        </View>
        {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={Typography.Colors.white} />
                    <Text style={{ color: Typography.Colors.white, marginTop: 10 }}>Loading...</Text>
                </View>
            ) : (
                <View style={styles.button}>
                    <CustomButton title='Pick a Video' onPress={pickVideo} />
                </View>
            )}
        {/* <View style={styles.button}>
            <CustomButton title='Pick a Video' onPress={pickVideo}/>
        </View> */}
    </View>
  )
}

const styles = StyleSheet.create({
    container:{
        flex:1,
        padding:10
    },
    text:{
        fontSize:18,
        paddingTop:16,
        textAlign:'center',
        fontWeight:'bold'
    },
    heading:{
        fontSize:28,
        paddingTop:20,
        textAlign:'center',
        fontWeight:'bold'
    },
    paragraph:{
        fontSize:16,
        paddingTop:12,
        textAlign:'center',
        // fontWeight:'bold'
    },
    button:{
        flex:1,
        justifyContent:'flex-end',
        paddingBottom:15
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom:15
    }
})