import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { CircularProgressBase } from 'react-native-circular-progress-indicator';
import Video from 'react-native-video';
import { pick } from '@react-native-documents/picker';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/AntDesign';
import Icon1 from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');
import { FFmpegKit, FFmpegKitConfig } from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';

const AudioScreen = ({ route }) => {
  const { videoUri } = route.params;
  const [audioPath, setAudioPath] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioStartTime, setAudioStartTime] = useState(0);
  const [audioEndTime, setAudioEndTime] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);

  const navigation = useNavigation();
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const pickAudio = async () => {
    try {
      const result = await pick({ type: ['audio/*'] });

      if (Array.isArray(result) && result.length > 0 && result[0].uri) {
        setAudioPath(result[0].uri);
        console.log('Audio selected:', result[0].uri);
        Alert.alert('Success', 'Audio selected! You can now trim it.');
      }
    } catch (error) {
      if (error.code === 'DOCUMENT_PICKER_CANCELED') {
        console.log('User cancelled audio picker');
      } else {
        console.error('Picker error:', error);
        Alert.alert('Error', 'Failed to pick audio');
      }
    }
  };

  const onVideoLoad = data => {
    setVideoDuration(data.duration);
    console.log('Video duration:', data.duration);
  };

  const onAudioLoad = data => {
    setAudioDuration(data.duration);
    const initialEndTime = Math.min(
      data.duration,
      videoDuration || data.duration,
    );
    setAudioEndTime(initialEndTime);
    console.log('Audio duration:', data.duration);
  };

  useEffect(() => {
    if (videoDuration > 0 && audioDuration > 0) {
      const newEndTime = Math.min(
        audioStartTime + videoDuration,
        audioDuration,
      );
      setAudioEndTime(newEndTime);
    }
  }, [videoDuration, audioDuration, audioStartTime]);

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onStartTimeChange = value => {
    setAudioStartTime(value);

    if (videoDuration > 0) {
      const calculatedEndTime = Math.min(value + videoDuration, audioDuration);
      setAudioEndTime(calculatedEndTime);
    } else {
      if (value >= audioEndTime) {
        setAudioEndTime(Math.min(value + 1, audioDuration));
      }
    }
  };

  const previewAudioSegment = () => {
    if (videoRef.current?.pause) {
      videoRef.current.pause();
    }
    if (audioRef.current) {
      audioRef.current.seek(audioStartTime);
      setIsAudioPlaying(true);
    }
  };

  const stopAudioPreview = () => {
    setIsAudioPlaying(false);
  };

  const onAudioProgress = data => {
    if (data.currentTime >= audioEndTime) {
      setIsAudioPlaying(false);
    }
  };

  const updateProgress = (step, progressValue) => {
    setProcessingStep(step);
    setProgress(progressValue);
  };

  const confirmAudioTrim = async () => {
    if (!audioPath || !videoUri) {
      Alert.alert('Error', 'Video or audio not selected');
      return;
    }

    setIsProcessing(true);
    updateProgress('Preparing files...', 10);

    const trimmedDuration = audioEndTime - audioStartTime;
    const timestamp = Date.now();
    const tempAudioPath = `${RNFS.CachesDirectoryPath}/temp_audio_${timestamp}.aac`;
    const trimmedAudioPath = `${RNFS.CachesDirectoryPath}/trimmed_audio_${timestamp}.aac`;
    const outputVideoPath = `${RNFS.CachesDirectoryPath}/merged_output_${timestamp}.mp4`;

    try {

      await RNFS.unlink(tempAudioPath).catch(() => {});
      await RNFS.unlink(trimmedAudioPath).catch(() => {});
      await RNFS.unlink(outputVideoPath).catch(() => {});

      updateProgress('Processing audio file...', 25);

      let sourceAudioPath = audioPath;
      
      if (audioPath.startsWith('content://')) {
        console.log('Converting content URI to local file...');
        
        await RNFS.copyFile(audioPath, tempAudioPath);
        sourceAudioPath = tempAudioPath;
        
        const tempExists = await RNFS.exists(tempAudioPath);
        if (!tempExists) {
          setIsProcessing(false);
          Alert.alert('Error', 'Could not access the selected audio file');
          return;
        }
        console.log('Audio copied to temp file:', tempAudioPath);
      }

      updateProgress('Trimming audio...', 50);


      const trimCmd = `-i "${sourceAudioPath}" -ss ${audioStartTime} -t ${trimmedDuration} -c:a aac -b:a 128k "${trimmedAudioPath}"`;
      
      console.log('Trim command:', trimCmd);

      const trimSession = await FFmpegKit.execute(trimCmd);
      const trimReturnCode = await trimSession.getReturnCode();

      if (!trimReturnCode.isValueSuccess()) {
        const logs = await trimSession.getAllLogs();
        console.error('Trim failed:', logs.map(l => l.getMessage()).join('\n'));
        setIsProcessing(false);
        Alert.alert('Trim Failed', 'Audio could not be trimmed. Please try again.');
        return;
      }

      console.log(' Audio trimmed successfully');

      const trimmedExists = await RNFS.exists(trimmedAudioPath);
      if (!trimmedExists) {
        setIsProcessing(false);
        Alert.alert('Error', 'Trimmed audio file was not created');
        return;
      }

      updateProgress('Processing video file...', 70);

      let sourceVideoPath = videoUri;
      const tempVideoPath = `${RNFS.CachesDirectoryPath}/temp_video_${timestamp}.mp4`;
      
      if (videoUri.startsWith('content://')) {
        console.log('Converting video content URI to local file...');
        await RNFS.copyFile(videoUri, tempVideoPath);
        sourceVideoPath = tempVideoPath;
        
        const videoTempExists = await RNFS.exists(tempVideoPath);
        if (!videoTempExists) {
          setIsProcessing(false);
          Alert.alert('Error', 'Could not access the video file');
          return;
        }
        console.log(' Video copied to temp file:', tempVideoPath);
      }

      updateProgress('Merging audio and video...', 85);


      const mergeCmd = `-i "${sourceVideoPath}" -i "${trimmedAudioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest -y "${outputVideoPath}"`;
      
      console.log('Merge command:', mergeCmd);

      const mergeSession = await FFmpegKit.execute(mergeCmd);
      const mergeReturnCode = await mergeSession.getReturnCode();

      if (!mergeReturnCode.isValueSuccess()) {
        const logs = await mergeSession.getAllLogs();
        console.error(' Merge failed:', logs.map(l => l.getMessage()).join('\n'));
        setIsProcessing(false);
        Alert.alert('Merge Failed', 'Could not merge audio with video. Please try again.');
        return;
      }

      const outputExists = await RNFS.exists(outputVideoPath);
      if (!outputExists) {
        setIsProcessing(false);
        Alert.alert('Error', 'Output video file was not created');
        return;
      }

      updateProgress('Finalizing...', 100);


      setTimeout(() => {
        setIsProcessing(false);
        navigation.navigate('PreviewScreen', { 
          videoUri: `file://${outputVideoPath}` 
        });
      }, 500);


      await RNFS.unlink(tempAudioPath).catch(() => {});
      await RNFS.unlink(tempVideoPath).catch(() => {});
      await RNFS.unlink(trimmedAudioPath).catch(() => {});

    } catch (err) {
      console.error('FFmpeg error:', err);
      setIsProcessing(false);
      Alert.alert('Error', `Something went wrong during audio processing: ${err.message}`);
    }
  };

  const handleVideoProgress = () => {
    if (isAudioPlaying) {
      console.log('Video is playing, stopping audio preview...');
      audioRef.current?.pause();
      setIsAudioPlaying(false);
    }
  };


  const handleSkipAudio = async () => {
    if (!videoUri) {
      Alert.alert('Error', 'No video selected');
      return;
    }
  
    setIsProcessing(true);
    updateProgress('Preparing original video...', 30);
  
    try {
      const timestamp = Date.now();
      const outputVideoPath = `${RNFS.CachesDirectoryPath}/skipped_output_${timestamp}.mp4`;
  
      let sourceVideoPath = videoUri;
  
      if (videoUri.startsWith('content://')) {
        const tempVideoPath = `${RNFS.CachesDirectoryPath}/temp_video_${timestamp}.mp4`;
        await RNFS.copyFile(videoUri, tempVideoPath);
        sourceVideoPath = tempVideoPath;
      }
  
      // Simply copy original video to output path
      await RNFS.copyFile(sourceVideoPath, outputVideoPath);
  
      updateProgress('Finalizing...', 100);
  
      setTimeout(() => {
        setIsProcessing(false);
        navigation.navigate('PreviewScreen', { videoUri: `file://${outputVideoPath}` });
      }, 500);
  
    } catch (err) {
      setIsProcessing(false);
      console.error('Skip error:', err);
      Alert.alert('Error', 'Could not proceed without audio');
    }
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Pressable onPress={() => navigation.goBack()}>
          <Icon1 name="arrow-left" size={22} color="white" />
        </Pressable>
        <Text style={styles.title}>Audio Selection</Text>
        <Pressable onPress={handleSkipAudio}>
        <Text  style={[styles.title,{fontWeight:'400'}]}>Skip</Text>
        </Pressable>
      </View>

      <Video
        ref={videoRef} 
        source={{ uri: videoUri }}
        style={styles.video}
        controls
        resizeMode="contain"
        paused={true}
        onLoad={onVideoLoad}
        onProgress={handleVideoProgress}
      />

      <Pressable style={styles.button} onPress={pickAudio}>
        <Text style={styles.buttonText}>Pick Music from Device</Text>
      </Pressable>

      {audioPath && (
        <View style={styles.audioControlsContainer}>
          <Text style={styles.sectionTitle}>Audio Trimming Controls</Text>

          <Video
            ref={audioRef}
            source={{ uri: audioPath }}            
            style={{ height: 0, width: 0 }}
            onLoad={onAudioLoad}
            onProgress={onAudioProgress}
            paused={!isAudioPlaying}
            volume={1.0}
            audioOnly={true}
          />

          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>
              Video Duration: {formatTime(videoDuration)}
            </Text>
            <Text style={styles.timeText}>
              Audio Duration: {formatTime(audioDuration)}
            </Text>
            <Text style={styles.highlightText}>
              Selected Audio Duration:{' '}
              {formatTime(audioEndTime - audioStartTime)}
            </Text>
          </View>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>
              Start Time: {formatTime(audioStartTime)}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={Math.max(0, audioDuration - videoDuration)}
              value={audioStartTime}
              onValueChange={onStartTimeChange}
              minimumTrackTintColor="#0069D9"
              maximumTrackTintColor="#666"
              thumbStyle={styles.sliderThumb}
            />
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>
              End Time: {formatTime(audioEndTime)} (Auto-calculated)
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.previewButton]}
              onPress={previewAudioSegment}
            >
              <Text style={styles.buttonText}>Preview Selection</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.stopButton]}
              onPress={stopAudioPreview}
            >
              <Text style={styles.buttonText}>Stop Preview</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.button, styles.confirmButton]}
            onPress={confirmAudioTrim}
          >
            <Text style={styles.buttonText}>Confirm Audio Trim</Text>
          </Pressable>
        </View>
      )}

      <Modal
        transparent={true}
        visible={isProcessing}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.loadingContainer}>
              <Text style={styles.modalStep}>{processingStep}</Text>
            </View>
            
            <View style={styles.progressContainer}>
              <CircularProgressBase
                value={progress}
                radius={60}
                duration={500}
                progressValueColor={'#fff'}
                maxValue={100}
                title={'%'}
                titleColor={'#fff'}
                titleStyle={{
                  fontSize: 14,
                  fontWeight: 'bold',
                }}
                activeStrokeColor={'#0069D9'}
                inActiveStrokeColor={'#333'}
                inActiveStrokeOpacity={0.5}
                activeStrokeWidth={8}
                inActiveStrokeWidth={8}
                progressValueStyle={{
                  fontSize: 24,
                  fontWeight: 'bold',
                }}
              />
            </View>
            
            <Text style={styles.modalSubtext}>
              Please don't close the app while processing...
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 25,
  },
  title: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  video: {
    width: width - 20,
    height: height * 0.3,
    alignSelf: 'center',
  },
  button: {
    marginTop: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#0069D9',
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  audioControlsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  timeInfo: {
    marginBottom: 15,
  },
  timeText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
  highlightText: {
    color: '#0069D9',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sliderContainer: {
    marginBottom: 15,
  },
  sliderLabel: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
  infoContainer: {
    marginBottom: 15,
  },
  infoLabel: {
    color: '#28a745',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#0069D9',
    width: 20,
    height: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  previewButton: {
    backgroundColor: '#28a745',
    flex: 0.48,
  },
  stopButton: {
    backgroundColor: '#dc3545',
    flex: 0.48,
  },
  confirmButton: {
    backgroundColor: '#17a2b8',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: width * 0.85,
    maxWidth: 350,
    borderWidth: 1,
    borderColor: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },
  modalStep: {
    color: '#0069D9',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    // fontStyle: 'italic',
  },
});

export default AudioScreen;

// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Dimensions,
//   Alert,
//   Pressable,
//   Modal,
//   ActivityIndicator,
// } from 'react-native';
// import Video from 'react-native-video';
// import { pick } from '@react-native-documents/picker';
// import Slider from '@react-native-community/slider';
// import { useNavigation } from '@react-navigation/native';
// import Icon from 'react-native-vector-icons/AntDesign';
// const { width, height } = Dimensions.get('window');
// import { FFmpegKit, FFmpegKitConfig } from 'ffmpeg-kit-react-native';
// import RNFS from 'react-native-fs';

// const AudioScreen = ({ route }) => {
//   const { videoUri } = route.params;
//   const [audioPath, setAudioPath] = useState(null);
//   const [videoDuration, setVideoDuration] = useState(0);
//   const [audioDuration, setAudioDuration] = useState(0);
//   const [audioStartTime, setAudioStartTime] = useState(0);
//   const [audioEndTime, setAudioEndTime] = useState(0);
//   const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
//   // Modal and progress states
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [processingStep, setProcessingStep] = useState('');
//   const [progress, setProgress] = useState(0);

//   const navigation = useNavigation();
//   const videoRef = useRef(null);
//   const audioRef = useRef(null);

//   const pickAudio = async () => {
//     try {
//       const result = await pick({ type: ['audio/*'] });

//       if (Array.isArray(result) && result.length > 0 && result[0].uri) {
//         setAudioPath(result[0].uri);
//         console.log('Audio selected:', result[0].uri);
//         Alert.alert('Success', 'Audio selected! You can now trim it.');
//       }
//     } catch (error) {
//       if (error.code === 'DOCUMENT_PICKER_CANCELED') {
//         console.log('User cancelled audio picker');
//       } else {
//         console.error('Picker error:', error);
//         Alert.alert('Error', 'Failed to pick audio');
//       }
//     }
//   };

//   const onVideoLoad = data => {
//     setVideoDuration(data.duration);
//     console.log('Video duration:', data.duration);
//   };

//   const onAudioLoad = data => {
//     setAudioDuration(data.duration);
//     const initialEndTime = Math.min(
//       data.duration,
//       videoDuration || data.duration,
//     );
//     setAudioEndTime(initialEndTime);
//     console.log('Audio duration:', data.duration);
//   };

//   useEffect(() => {
//     if (videoDuration > 0 && audioDuration > 0) {
//       const newEndTime = Math.min(
//         audioStartTime + videoDuration,
//         audioDuration,
//       );
//       setAudioEndTime(newEndTime);
//     }
//   }, [videoDuration, audioDuration, audioStartTime]);

//   const formatTime = seconds => {
//     const mins = Math.floor(seconds / 60);
//     const secs = Math.floor(seconds % 60);
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

//   const onStartTimeChange = value => {
//     setAudioStartTime(value);

//     if (videoDuration > 0) {
//       const calculatedEndTime = Math.min(value + videoDuration, audioDuration);
//       setAudioEndTime(calculatedEndTime);
//     } else {
//       if (value >= audioEndTime) {
//         setAudioEndTime(Math.min(value + 1, audioDuration));
//       }
//     }
//   };

//   const previewAudioSegment = () => {
//     if (videoRef.current?.pause) {
//       videoRef.current.pause();
//     }
//     if (audioRef.current) {
//       audioRef.current.seek(audioStartTime);
//       setIsAudioPlaying(true);
//     }
//   };

//   const stopAudioPreview = () => {
//     setIsAudioPlaying(false);
//   };

//   const onAudioProgress = data => {
//     if (data.currentTime >= audioEndTime) {
//       setIsAudioPlaying(false);
//     }
//   };

//   const updateProgress = (step, progressValue) => {
//     setProcessingStep(step);
//     setProgress(progressValue);
//   };

//   const confirmAudioTrim = async () => {
//     if (!audioPath || !videoUri) {
//       Alert.alert('Error', 'Video or audio not selected');
//       return;
//     }

//     setIsProcessing(true);
//     updateProgress('Preparing files...', 10);

//     const trimmedDuration = audioEndTime - audioStartTime;
//     const timestamp = Date.now();
//     const tempAudioPath = `${RNFS.CachesDirectoryPath}/temp_audio_${timestamp}.aac`;
//     const trimmedAudioPath = `${RNFS.CachesDirectoryPath}/trimmed_audio_${timestamp}.aac`;
//     const outputVideoPath = `${RNFS.CachesDirectoryPath}/merged_output_${timestamp}.mp4`;

//     try {
//       // Clean up any existing files
//       await RNFS.unlink(tempAudioPath).catch(() => {});
//       await RNFS.unlink(trimmedAudioPath).catch(() => {});
//       await RNFS.unlink(outputVideoPath).catch(() => {});

//       updateProgress('Processing audio file...', 25);

//       // STEP 1: Copy the content URI to a local file that FFmpeg can access
//       let sourceAudioPath = audioPath;
      
//       if (audioPath.startsWith('content://')) {
//         console.log('Converting content URI to local file...');
        
//         await RNFS.copyFile(audioPath, tempAudioPath);
//         sourceAudioPath = tempAudioPath;
        
//         const tempExists = await RNFS.exists(tempAudioPath);
//         if (!tempExists) {
//           setIsProcessing(false);
//           Alert.alert('Error', 'Could not access the selected audio file');
//           return;
//         }
//         console.log('✅ Audio copied to temp file:', tempAudioPath);
//       }

//       updateProgress('Trimming audio...', 50);

//       // STEP 2: Trim the audio from the accessible file path
//       const trimCmd = `-i "${sourceAudioPath}" -ss ${audioStartTime} -t ${trimmedDuration} -c:a aac -b:a 128k "${trimmedAudioPath}"`;
      
//       console.log('Trim command:', trimCmd);

//       const trimSession = await FFmpegKit.execute(trimCmd);
//       const trimReturnCode = await trimSession.getReturnCode();

//       if (!trimReturnCode.isValueSuccess()) {
//         const logs = await trimSession.getAllLogs();
//         console.error('❌ Trim failed:', logs.map(l => l.getMessage()).join('\n'));
//         setIsProcessing(false);
//         Alert.alert('Trim Failed', 'Audio could not be trimmed. Please try again.');
//         return;
//       }

//       console.log('✅ Audio trimmed successfully');

//       const trimmedExists = await RNFS.exists(trimmedAudioPath);
//       if (!trimmedExists) {
//         setIsProcessing(false);
//         Alert.alert('Error', 'Trimmed audio file was not created');
//         return;
//       }

//       updateProgress('Processing video file...', 70);

//       // STEP 3: Handle video URI similar to audio (if it's also a content URI)
//       let sourceVideoPath = videoUri;
//       const tempVideoPath = `${RNFS.CachesDirectoryPath}/temp_video_${timestamp}.mp4`;
      
//       if (videoUri.startsWith('content://')) {
//         console.log('Converting video content URI to local file...');
//         await RNFS.copyFile(videoUri, tempVideoPath);
//         sourceVideoPath = tempVideoPath;
        
//         const videoTempExists = await RNFS.exists(tempVideoPath);
//         if (!videoTempExists) {
//           setIsProcessing(false);
//           Alert.alert('Error', 'Could not access the video file');
//           return;
//         }
//         console.log('✅ Video copied to temp file:', tempVideoPath);
//       }

//       updateProgress('Merging audio and video...', 85);

//       // STEP 4: Merge trimmed audio with video
//       const mergeCmd = `-i "${sourceVideoPath}" -i "${trimmedAudioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest -y "${outputVideoPath}"`;
      
//       console.log('Merge command:', mergeCmd);

//       const mergeSession = await FFmpegKit.execute(mergeCmd);
//       const mergeReturnCode = await mergeSession.getReturnCode();

//       if (!mergeReturnCode.isValueSuccess()) {
//         const logs = await mergeSession.getAllLogs();
//         console.error('❌ Merge failed:', logs.map(l => l.getMessage()).join('\n'));
//         setIsProcessing(false);
//         Alert.alert('Merge Failed', 'Could not merge audio with video. Please try again.');
//         return;
//       }

//       const outputExists = await RNFS.exists(outputVideoPath);
//       if (!outputExists) {
//         setIsProcessing(false);
//         Alert.alert('Error', 'Output video file was not created');
//         return;
//       }

//       updateProgress('Finalizing...', 100);

//       // Small delay to show completion
//       setTimeout(() => {
//         setIsProcessing(false);
//         navigation.navigate('PreviewScreen', { 
//           videoUri: `file://${outputVideoPath}` 
//         });
//       }, 500);

//       // Clean up temporary files after successful merge
//       await RNFS.unlink(tempAudioPath).catch(() => {});
//       await RNFS.unlink(tempVideoPath).catch(() => {});
//       await RNFS.unlink(trimmedAudioPath).catch(() => {});

//     } catch (err) {
//       console.error('FFmpeg error:', err);
//       setIsProcessing(false);
//       Alert.alert('Error', `Something went wrong during audio processing: ${err.message}`);
//     }
//   };

//   const handleVideoProgress = () => {
//     if (isAudioPlaying) {
//       console.log('Video is playing, stopping audio preview...');
//       audioRef.current?.pause();
//       setIsAudioPlaying(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.heading}>
//         <Pressable onPress={() => navigation.goBack()}>
//           <Icon name="close" size={22} color="white" />
//         </Pressable>
//         <Text style={styles.title}>Audio Selection</Text>
//         <View />
//       </View>

//       <Video
//         ref={videoRef} 
//         source={{ uri: videoUri }}
//         style={styles.video}
//         controls
//         resizeMode="contain"
//         paused={true}
//         onLoad={onVideoLoad}
//         onProgress={handleVideoProgress}
//       />

//       <Pressable style={styles.button} onPress={pickAudio}>
//         <Text style={styles.buttonText}>Pick Music from Device</Text>
//       </Pressable>

//       {audioPath && (
//         <View style={styles.audioControlsContainer}>
//           <Text style={styles.sectionTitle}>Audio Trimming Controls</Text>

//           <Video
//             ref={audioRef}
//             source={{ uri: audioPath }}
//             style={{ height: 0, width: 0 }}
//             onLoad={onAudioLoad}
//             onProgress={onAudioProgress}
//             paused={!isAudioPlaying}
//             volume={1.0}
//             audioOnly={true}
//           />

//           <View style={styles.timeInfo}>
//             <Text style={styles.timeText}>
//               Video Duration: {formatTime(videoDuration)}
//             </Text>
//             <Text style={styles.timeText}>
//               Audio Duration: {formatTime(audioDuration)}
//             </Text>
//             <Text style={styles.highlightText}>
//               Selected Audio Duration:{' '}
//               {formatTime(audioEndTime - audioStartTime)}
//             </Text>
//           </View>

//           <View style={styles.sliderContainer}>
//             <Text style={styles.sliderLabel}>
//               Start Time: {formatTime(audioStartTime)}
//             </Text>
//             <Slider
//               style={styles.slider}
//               minimumValue={0}
//               maximumValue={Math.max(0, audioDuration - videoDuration)}
//               value={audioStartTime}
//               onValueChange={onStartTimeChange}
//               minimumTrackTintColor="#0069D9"
//               maximumTrackTintColor="#666"
//               thumbStyle={styles.sliderThumb}
//             />
//           </View>

//           <View style={styles.infoContainer}>
//             <Text style={styles.infoLabel}>
//               End Time: {formatTime(audioEndTime)} (Auto-calculated)
//             </Text>
//           </View>

//           <View style={styles.buttonRow}>
//             <Pressable
//               style={[styles.button, styles.previewButton]}
//               onPress={previewAudioSegment}
//             >
//               <Text style={styles.buttonText}>Preview Selection</Text>
//             </Pressable>

//             <Pressable
//               style={[styles.button, styles.stopButton]}
//               onPress={stopAudioPreview}
//             >
//               <Text style={styles.buttonText}>Stop Preview</Text>
//             </Pressable>
//           </View>

//           <Pressable
//             style={[styles.button, styles.confirmButton]}
//             onPress={confirmAudioTrim}
//           >
//             <Text style={styles.buttonText}>Confirm Audio Trim</Text>
//           </Pressable>
//         </View>
//       )}

//       {/* Processing Modal */}
//       <Modal
//         transparent={true}
//         visible={isProcessing}
//         animationType="fade"
//         onRequestClose={() => {}}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="large" color="#0069D9" />
//               <Text style={styles.modalTitle}>Processing Audio</Text>
//               <Text style={styles.modalStep}>{processingStep}</Text>
//             </View>
            
//             <View style={styles.progressContainer}>
//               <View style={styles.progressBar}>
//                 <View 
//                   style={[
//                     styles.progressFill, 
//                     { width: `${progress}%` }
//                   ]} 
//                 />
//               </View>
//               <Text style={styles.progressText}>{progress}%</Text>
//             </View>
            
//             <Text style={styles.modalSubtext}>
//               Please don't close the app while processing...
//             </Text>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//     paddingTop: 20,
//     paddingHorizontal: 10,
//   },
//   heading: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingTop: 10,
//   },
//   title: {
//     color: 'white',
//     textAlign: 'center',
//     marginBottom: 10,
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   video: {
//     width: width - 20,
//     height: height * 0.3,
//     alignSelf: 'center',
//   },
//   button: {
//     marginTop: 10,
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     backgroundColor: '#0069D9',
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: 'white',
//     textAlign: 'center',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   audioControlsContainer: {
//     marginTop: 20,
//     padding: 15,
//     backgroundColor: '#1a1a1a',
//     borderRadius: 10,
//   },
//   sectionTitle: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   timeInfo: {
//     marginBottom: 15,
//   },
//   timeText: {
//     color: '#ccc',
//     fontSize: 14,
//     marginBottom: 5,
//   },
//   highlightText: {
//     color: '#0069D9',
//     fontSize: 14,
//     fontWeight: 'bold',
//     marginBottom: 5,
//   },
//   sliderContainer: {
//     marginBottom: 15,
//   },
//   sliderLabel: {
//     color: 'white',
//     fontSize: 14,
//     marginBottom: 5,
//   },
//   infoContainer: {
//     marginBottom: 15,
//   },
//   infoLabel: {
//     color: '#28a745',
//     fontSize: 14,
//     fontWeight: 'bold',
//     marginBottom: 5,
//   },
//   slider: {
//     width: '100%',
//     height: 40,
//   },
//   sliderThumb: {
//     backgroundColor: '#0069D9',
//     width: 20,
//     height: 20,
//   },
//   buttonRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 10,
//   },
//   previewButton: {
//     backgroundColor: '#28a745',
//     flex: 0.48,
//   },
//   stopButton: {
//     backgroundColor: '#dc3545',
//     flex: 0.48,
//   },
//   confirmButton: {
//     backgroundColor: '#17a2b8',
//   },
//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContent: {
//     backgroundColor: '#1a1a1a',
//     borderRadius: 20,
//     padding: 30,
//     alignItems: 'center',
//     width: width * 0.85,
//     maxWidth: 350,
//     borderWidth: 1,
//     borderColor: '#333',
//   },
//   loadingContainer: {
//     alignItems: 'center',
//     marginBottom: 25,
//   },
//   modalTitle: {
//     color: 'white',
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginTop: 15,
//     marginBottom: 8,
//   },
//   modalStep: {
//     color: '#0069D9',
//     fontSize: 16,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   progressContainer: {
//     width: '100%',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   progressBar: {
//     width: '100%',
//     height: 8,
//     backgroundColor: '#333',
//     borderRadius: 4,
//     overflow: 'hidden',
//     marginBottom: 10,
//   },
//   progressFill: {
//     height: '100%',
//     backgroundColor: '#0069D9',
//     borderRadius: 4,
//   },
//   progressText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   modalSubtext: {
//     color: '#ccc',
//     fontSize: 14,
//     textAlign: 'center',
//     fontStyle: 'italic',
//   },
// });

// export default AudioScreen;