import {
  View,
  Text,
  StyleSheet,
  Button,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Image,
} from 'react-native';
import React, { useState } from 'react';
import Video from 'react-native-video';
import CustomButton from '../components/CustomButton';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import RNFS from 'react-native-fs';
import { FFmpegKit } from 'ffmpeg-kit-react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';

const VideoScreen = ({ route }: { route: any }) => {
  const navigation = useNavigation();
  const { videoUri } = route.params;
  const [sliderValues, setSliderValues] = useState([0, 0]); // default from 0s to 15s
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimmedUri, setTrimmedUri] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);

  const onSliderChange = values => {
    setSliderValues(values);
  };

  const trimVideo = async () => {
    const [startTime, endTime] = sliderValues;
    const duration = endTime - startTime;

    if (duration <= 0) {
      Alert.alert('Invalid Range', 'End time must be greater than start time.');
      return;
    }

    const outputPath =
      Platform.OS === 'android'
        ? `${RNFS.DownloadDirectoryPath}/trimmed_${Date.now()}.mp4`
        : `${RNFS.DocumentDirectoryPath}/trimmed_${Date.now()}.mp4`;

    const command = `-i "${videoUri}" -ss ${startTime} -t ${duration} -c:v libx264 -c:a aac "${outputPath}"`;

    setIsTrimming(true);
    try {
      await FFmpegKit.execute(command).then(async session => {
        const returnCode = await session.getReturnCode();
        if (returnCode.isValueSuccess()) {
          setTrimmedUri(outputPath);
          Alert.alert('Success', 'Video trimmed successfully!');
        } else {
          Alert.alert('Error', 'Failed to trim video.');
        }
      });
    } catch (error) {
      console.error('Trimming error:', error);
      Alert.alert('Error', 'Trimming failed.');
    } finally {
      setIsTrimming(false);
    }
  };
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const paddedMins = mins < 10 ? `0${mins}` : mins;
    const paddedSecs = secs < 10 ? `0${secs}` : secs;
    return `${paddedMins}:${paddedSecs}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
      <Pressable  onPress={() => navigation.goBack()}>
        <Icon name="close" size={22} color='white'/>
        </Pressable>
        <Text style={styles.headingText}>Selected Video</Text>
        <View/>
      </View>
      <Video
        source={{ uri: trimmedUri || videoUri }}
        style={styles.video}
        controls
        resizeMode="contain"
        onLoad={meta => {
          const duration = Math.floor(meta.duration);
          setVideoDuration(duration);
          setSliderValues([0, Math.min(0, duration)]); 
        }}
      />

      <Text style={styles.timeLabel}>
        Start: {formatTime(sliderValues[0])} | End:{' '}
        {formatTime(sliderValues[1])}
      </Text>
      <MultiSlider
        values={sliderValues}
        sliderLength={300}
        onValuesChange={onSliderChange}
        min={0}
        max={videoDuration} 
        step={1}
        allowOverlap={false}
        snapped
      />

      {isTrimming ? (
        <ActivityIndicator
          size="large"
          color="#000"
          style={{ marginTop: 20 }}
        />
      ) : (
        <Button title="Trim Selected Range" onPress={trimVideo} />
      )}

      <View style={styles.button}>
        <CustomButton
          title="Pick a Audio"
          onPress={() => console.log('pressed')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1C2128',
  },
  heading:{
    flexDirection:'row',
    justifyContent:'space-between',
    paddingTop:10
  },
  headingText: {
    color: 'white',
    fontSize: 18,
    // paddingTop: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  video: {
    width: '100%',
    height: 300,
    marginTop: 50,
  },
  button: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 15,
  },
  timeLabel: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
  },
});

export default VideoScreen;
