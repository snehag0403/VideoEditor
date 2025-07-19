import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform, PermissionsAndroid } from 'react-native';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import { Typography } from '../../constants/constants';
import CustomButton from '../components/CustomButton';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

const PreviewScreen = ({ route }) => {
  const { videoUri } = route.params;
  const videoRef = useRef(null);
  const [isPaused, setIsPaused] = useState(true);
const navigation=useNavigation()
const isFocused = useIsFocused(); // Add this

  // const handlePreview = () => {
  //   setIsPaused(false); // play the video
  // };
  // Pause video when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsPaused(true);
      };
    }, [])
  );
  

  const handlePreview = () => {
    if (videoRef.current) {
      videoRef.current.seek(0); // restart video from the beginning
    }
    setIsPaused(false); // start playing
  };
  
  const handleSave = async () => {
    try {
      const fileName = `edited_${Date.now()}.mp4`;
      const folderName = 'Video Editing';
      const destFolderPath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${folderName}`
          : `${RNFS.DocumentDirectoryPath}/${folderName}`;
  
      const folderExists = await RNFS.exists(destFolderPath);
      if (!folderExists) {
        await RNFS.mkdir(destFolderPath);
      }
  
      const destPath = `${destFolderPath}/${fileName}`;
  
      await RNFS.copyFile(videoUri, destPath);
      Alert.alert('Success', `Video saved to ${Platform.OS === 'android' ? 'Downloads' : 'Documents'}`);
      navigation.navigate('HomeScreen')
    } catch (err) {
      console.error('Save Error:', err);
      Alert.alert('Error', 'Failed to save the video.');
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preview</Text>
      <Video
        ref={videoRef}
        source={{ uri: videoUri }}
        style={styles.video}
        paused={!isFocused || isPaused}
        controls
        resizeMode="contain"
      />
      <View>
        <Text style={styles.text}>Your video is ready!</Text>
        <Text style={styles.paragraph}>
          The video has been successfully trimmed and merged. You can now preview and save your creation.
        </Text>
      </View>
      <View style={{ flexDirection: "row",justifyContent:'center' }}>
        {/* <CustomButton
          title="Preview"
          buttonStyle={{ width: 100 }}
          onPress={handlePreview}
        /> */}    
        <CustomButton
          title="Save"
          buttonStyle={{ width: 100, backgroundColor: Typography.Colors.grey }}
          onPress={handleSave}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000', 
    padding:20,
    paddingTop:60
  },
  title: { 
    color:Typography.Colors.white,
    textAlign: 'center', 
    fontSize: 18, 
    // paddingTop: 100
  },
  video: { 
    width: '100%', 
    height: 300 ,
    marginTop:20
  },
  text:{
    color:Typography.Colors.white,
    fontSize:24,
    paddingVertical:10,
    textAlign: 'center', 
  },
  paragraph:{
    color:Typography.Colors.white,
    fontSize:18,
    paddingVertical:10,
  }
});

export default PreviewScreen;
