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
  ScrollView,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Modal,
} from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import Video from 'react-native-video';
import CustomButton from '../components/CustomButton';
import RNFS from 'react-native-fs';
import { FFmpegKit } from 'ffmpeg-kit-react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import Icon1 from 'react-native-vector-icons/Feather';

import { useNavigation } from '@react-navigation/native';
import { createThumbnail } from 'react-native-create-thumbnail';
import { Typography } from '../../constants/constants';
import { CircularProgressBase } from 'react-native-circular-progress-indicator';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// Fixed TimelineComponent with proper handle selection
// const TimelineComponent = ({ 
//   videoDuration, 
//   sliderValues, 
//   onSliderChange, 
//   videoUri 
// }) => {
//   const [thumbnails, setThumbnails] = useState([]);
//   const [thumbnailsLoaded, setThumbnailsLoaded] = useState(false);
//   const [isDragging, setIsDragging] = useState(false);
//   const [dragType, setDragType] = useState(null); 
  
//   const timelineWidth = screenWidth - 40;
//   const frameWidth = 60;
//   const numberOfFrames = Math.floor(timelineWidth / frameWidth);
  
//   const pixelsPerSecond = timelineWidth / videoDuration;
  
//   useEffect(() => {
//     generateThumbnails();
//   }, [videoDuration, videoUri]);
  
//   const generateThumbnails = async () => {
//     if (!videoUri || videoDuration === 0) return;
    
//     try {
//       const thumbnailPromises = [];
//       const interval = videoDuration / numberOfFrames;
      
//       for (let i = 0; i < numberOfFrames; i++) {
//         const timeStamp = i * interval * 1000;
        
//         const thumbnailPromise = createThumbnail({
//           url: videoUri,
//           timeStamp: timeStamp,
//           quality: 75,
//           format: 'jpeg',
//         });
        
//         thumbnailPromises.push(thumbnailPromise);
//       }
      
//       const thumbnailResults = await Promise.all(thumbnailPromises);
//       setThumbnails(thumbnailResults);
//       setThumbnailsLoaded(true);
//     } catch (error) {
//       console.error('Error generating thumbnails:', error);
//       setThumbnailsLoaded(true);
//     }
//   };
  
//   const startHandlePanResponder = PanResponder.create({
//     onStartShouldSetPanResponder: () => true,
//     onMoveShouldSetPanResponder: () => true,
//     onPanResponderGrant: () => {
//       setIsDragging(true);
//       setDragType('start');
//     },
//     onPanResponderMove: (event, gestureState) => {
//       const { dx } = gestureState;
//       const currentStartPosition = (sliderValues[0] / videoDuration) * timelineWidth;
//       const newPosition = Math.max(0, Math.min(timelineWidth, currentStartPosition + dx));
//       const newTime = (newPosition / timelineWidth) * videoDuration;
//       const clampedTime = Math.max(0, Math.min(newTime, sliderValues[1] - 1));
//       onSliderChange([clampedTime, sliderValues[1]]);
//     },
//     onPanResponderRelease: () => {
//       setIsDragging(false);
//       setDragType(null);
//     },
//   });

//   const endHandlePanResponder = PanResponder.create({
//     onStartShouldSetPanResponder: () => true,
//     onMoveShouldSetPanResponder: () => true,
//     onPanResponderGrant: () => {
//       setIsDragging(true);
//       setDragType('end');
//     },
//     onPanResponderMove: (event, gestureState) => {
//       const { dx } = gestureState;
//       const currentEndPosition = (sliderValues[1] / videoDuration) * timelineWidth;
//       const newPosition = Math.max(0, Math.min(timelineWidth, currentEndPosition + dx));
//       const newTime = (newPosition / timelineWidth) * videoDuration;
      
//       const clampedTime = Math.max(sliderValues[0] + 1, Math.min(videoDuration, newTime));
//       onSliderChange([sliderValues[0], clampedTime]);
//     },
//     onPanResponderRelease: () => {
//       setIsDragging(false);
//       setDragType(null);
//     },
//   });

//   const handleTimelinePress = (event) => {
//     if (isDragging) return;
    
//     const { locationX } = event.nativeEvent;
//     const clickedTime = (locationX / timelineWidth) * videoDuration;
    
//     const distanceToStart = Math.abs(clickedTime - sliderValues[0]);
//     const distanceToEnd = Math.abs(clickedTime - sliderValues[1]);
    
//     if (distanceToStart < distanceToEnd) {
//       const newStart = Math.max(0, Math.min(clickedTime, sliderValues[1] - 1));
//       onSliderChange([newStart, sliderValues[1]]);
//     } else {
//       const newEnd = Math.max(sliderValues[0] + 1, Math.min(videoDuration, clickedTime));
//       onSliderChange([sliderValues[0], newEnd]);
//     }
//   };

//   const renderFrames = () => {
//     const frames = [];
//     for (let i = 0; i < numberOfFrames; i++) {
//       const thumbnail = thumbnails[i];
      
//       frames.push(
//         <View key={i} style={styles.frameContainer}>
//           <View style={styles.framePlaceholder}>
//             {thumbnailsLoaded && thumbnail ? (
//               <Image 
//                 source={{ uri: thumbnail.path }} 
//                 style={styles.thumbnailImage}
//                 resizeMode="cover"
//               />
//             ) : (
//               <View style={styles.thumbnailLoading}>
//                 {thumbnailsLoaded ? (
//                   <Icon name="play" size={16} color={Typography.Colors.disableButton} />
//                 ) : (
//                   <ActivityIndicator size="small" color={Typography.Colors.disableButton} />
//                 )}
//               </View>
//             )}
//           </View>
//         </View>
//       );
//     }
//     return frames;
//   };

//   const renderTimeMarkers = () => {
//     const markers = [];
//     const markerInterval = Math.ceil(videoDuration / 5);
    
//     for (let i = 0; i <= videoDuration; i += markerInterval) {
//       const position = (i / videoDuration) * timelineWidth;
//       markers.push(
//         <View key={i} style={[styles.timeMarker, { left: position }]}>
//           <View style={styles.timeMarkerLine} />
//           <Text style={styles.timeMarkerText}>{formatTime(i)}</Text>
//         </View>
//       );
//     }
//     return markers;
//   };

//   const formatTime = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = Math.floor(seconds % 60);
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

//   const startPosition = (sliderValues[0] / videoDuration) * timelineWidth;
//   const endPosition = (sliderValues[1] / videoDuration) * timelineWidth;
//   const selectionWidth = endPosition - startPosition;

//   return (
//     <View style={styles.timelineContainer}>
//       <View style={styles.timeMarkersContainer}>
//         {renderTimeMarkers()}
//       </View>
      
//       <TouchableOpacity 
//         style={styles.timelineTrack}
//         onPress={handleTimelinePress}
//         activeOpacity={0.9}
//       >
//         <ScrollView 
//           horizontal 
//           showsHorizontalScrollIndicator={false}
//           style={styles.framesScrollView}
//         >
//           <View style={styles.framesContainer}>
//             {renderFrames()}
//           </View>
//         </ScrollView>
        
//         <View style={styles.selectionOverlay}>
//           <View style={[styles.dimmedArea, { width: startPosition }]} />
//           <View style={[styles.selectionArea, { 
//             left: startPosition, 
//             width: selectionWidth 
//           }]}>

//             <View 
//               style={[
//                 styles.trimHandle, 
//                 styles.startHandle,
//                 dragType === 'start' && styles.handleActive
//               ]}
//               {...startHandlePanResponder.panHandlers}
//             >
//               <View style={styles.trimHandleBar} />
//               <View style={styles.trimHandleBar} />
//             </View>
            
//             <View 
//               style={[
//                 styles.trimHandle, 
//                 styles.endHandle,
//                 dragType === 'end' && styles.handleActive
//               ]}
//               {...endHandlePanResponder.panHandlers}
//             >
//               <View style={styles.trimHandleBar} />
//               <View style={styles.trimHandleBar} />
//             </View>
//           </View>
          
//           <View style={[styles.dimmedArea, { 
//             left: endPosition, 
//             width: timelineWidth - endPosition 
//           }]} />
//         </View>
//       </TouchableOpacity>
      
//       <View style={styles.currentTimeContainer}>
//         <Text style={styles.currentTimeText}>
//           {formatTime(sliderValues[0])} - {formatTime(sliderValues[1])}
//         </Text>
//       </View>
//     </View>
//   );
// };

// Loading Modal Component

const TimelineComponent = ({ 
  videoDuration, 
  sliderValues, 
  onSliderChange, 
  videoUri 
}) => {
  const [thumbnails, setThumbnails] = useState([]);
  const [thumbnailsLoaded, setThumbnailsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null);
  
  const timelineWidth = screenWidth - 40;
  const frameWidth = 60;
  const numberOfFrames = Math.floor(timelineWidth / frameWidth);
  
  useEffect(() => {
    generateThumbnails();
  }, [videoDuration, videoUri]);
  
  const generateThumbnails = async () => {
    if (!videoUri || videoDuration === 0) return;
    
    try {
      const thumbnailPromises = [];
      const interval = videoDuration / numberOfFrames;
      
      for (let i = 0; i < numberOfFrames; i++) {
        const timeStamp = i * interval * 1000;
        
        const thumbnailPromise = createThumbnail({
          url: videoUri,
          timeStamp: timeStamp,
          quality: 75,
          format: 'jpeg',
        });
        
        thumbnailPromises.push(thumbnailPromise);
      }
      
      const thumbnailResults = await Promise.all(thumbnailPromises);
      setThumbnails(thumbnailResults);
      setThumbnailsLoaded(true);
    } catch (error) {
      console.error('Error generating thumbnails:', error);
      setThumbnailsLoaded(true);
    }
  };
  
  // Simplified and fixed PanResponder for start handle
  const startHandlePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: () => {
      setIsDragging(true);
      setDragType('start');
    },
    onPanResponderMove: (event, gestureState) => {
      const { dx } = gestureState;
      const deltaTime = (dx / timelineWidth) * videoDuration;
      const newStartTime = sliderValues[0] + deltaTime;
      
      // Clamp the start time
      const clampedStartTime = Math.max(0, Math.min(newStartTime, sliderValues[1] - 0.1));
      
      if (clampedStartTime !== sliderValues[0]) {
        onSliderChange([clampedStartTime, sliderValues[1]]);
      }
    },
    onPanResponderRelease: () => {
      setIsDragging(false);
      setDragType(null);
    },
    onPanResponderTerminate: () => {
      setIsDragging(false);
      setDragType(null);
    },
  });

  // Fixed PanResponder for end handle
  const endHandlePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: () => {
      setIsDragging(true);
      setDragType('end');
    },
    onPanResponderMove: (event, gestureState) => {
      const { dx } = gestureState;
      const deltaTime = (dx / timelineWidth) * videoDuration;
      const newEndTime = sliderValues[1] + deltaTime;
      
      // Clamp the end time
      const clampedEndTime = Math.max(sliderValues[0] + 0.1, Math.min(videoDuration, newEndTime));
      
      if (clampedEndTime !== sliderValues[1]) {
        onSliderChange([sliderValues[0], clampedEndTime]);
      }
    },
    onPanResponderRelease: () => {
      setIsDragging(false);
      setDragType(null);
    },
    onPanResponderTerminate: () => {
      setIsDragging(false);
      setDragType(null);
    },
  });

  const handleTimelinePress = (event) => {
    if (isDragging) return;
    
    const { locationX } = event.nativeEvent;
    const clickedTime = (locationX / timelineWidth) * videoDuration;
    
    const distanceToStart = Math.abs(clickedTime - sliderValues[0]);
    const distanceToEnd = Math.abs(clickedTime - sliderValues[1]);
    
    if (distanceToStart < distanceToEnd) {
      const newStart = Math.max(0, Math.min(clickedTime, sliderValues[1] - 0.1));
      onSliderChange([newStart, sliderValues[1]]);
    } else {
      const newEnd = Math.max(sliderValues[0] + 0.1, Math.min(videoDuration, clickedTime));
      onSliderChange([sliderValues[0], newEnd]);
    }
  };

  const renderFrames = () => {
    const frames = [];
    for (let i = 0; i < numberOfFrames; i++) {
      const thumbnail = thumbnails[i];
      
      frames.push(
        <View key={i} style={styles.frameContainer}>
          <View style={styles.framePlaceholder}>
            {thumbnailsLoaded && thumbnail ? (
              <Image 
                source={{ uri: thumbnail.path }} 
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.thumbnailLoading}>
                {thumbnailsLoaded ? (
                  <Icon name="play" size={16} color="#666" />
                ) : (
                  <ActivityIndicator size="small" color="#666" />
                )}
              </View>
            )}
          </View>
        </View>
      );
    }
    return frames;
  };

  const renderTimeMarkers = () => {
    const markers = [];
    const markerInterval = Math.ceil(videoDuration / 5);
    
    for (let i = 0; i <= videoDuration; i += markerInterval) {
      const position = (i / videoDuration) * timelineWidth;
      markers.push(
        <View key={i} style={[styles.timeMarker, { left: position }]}>
          <View style={styles.timeMarkerLine} />
          <Text style={styles.timeMarkerText}>{formatTime(i)}</Text>
        </View>
      );
    }
    return markers;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startPosition = (sliderValues[0] / videoDuration) * timelineWidth;
  const endPosition = (sliderValues[1] / videoDuration) * timelineWidth;
  const selectionWidth = endPosition - startPosition;

  return (
    <View style={styles.timelineContainer}>
      <View style={styles.timeMarkersContainer}>
        {renderTimeMarkers()}
      </View>
      
      <View style={styles.timelineTrack}>
        {/* Frames background */}
        <View style={styles.framesContainer}>
          {renderFrames()}
        </View>
        
        {/* Selection overlay */}
        <View style={styles.selectionOverlay}>
          {/* Left dimmed area - everything before start handle */}
          <View style={[styles.dimmedArea, { 
            left: 0,
            width: startPosition 
          }]} />
          
          {/* Selection area - clear area between handles */}
          <View style={[styles.selectionArea, { 
            left: startPosition, 
            width: selectionWidth 
          }]} />
          
          {/* Right dimmed area - everything after end handle */}
          <View style={[styles.dimmedArea, { 
            left: endPosition, 
            width: timelineWidth - endPosition 
          }]} />
        </View>
        
        {/* Handles - positioned absolutely over everything */}
        <View 
          style={[
            styles.trimHandle, 
            styles.startHandle,
            { left: startPosition - 12 },
            dragType === 'start' && styles.handleActive
          ]}
          {...startHandlePanResponder.panHandlers}
        >
          <View style={styles.trimHandleBar} />
          <View style={styles.trimHandleBar} />
        </View>
        
        <View 
          style={[
            styles.trimHandle, 
            styles.endHandle,
            { left: endPosition - 12 },
            dragType === 'end' && styles.handleActive
          ]}
          {...endHandlePanResponder.panHandlers}
        >
          <View style={styles.trimHandleBar} />
          <View style={styles.trimHandleBar} />
        </View>
        
        {/* Invisible touch area for timeline press */}
        <TouchableOpacity 
          style={styles.timelineTouchArea}
          onPress={handleTimelinePress}
          activeOpacity={1}
        />
      </View>
      
      <View style={styles.currentTimeContainer}>
        <Text style={styles.currentTimeText}>
          {formatTime(sliderValues[0])} - {formatTime(sliderValues[1])}
        </Text>
      </View>
    </View>
  );
};


const LoadingModal = ({ visible, progress, onCancel }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.progressContainer}>
            <CircularProgressBase
              value={progress}
              radius={60}
              duration={100}
              progressValueColor={Typography.Colors.white}
              maxValue={100}
              title="Trimming..."
              titleColor={Typography.Colors.white}
              titleStyle={{ fontSize: 16, fontWeight: '600' }}
              activeStrokeColor={Typography.Colors.primary}
              inActiveStrokeColor={Typography.Colors.grey}
              inActiveStrokeOpacity={0.3}
              inActiveStrokeWidth={8}
              activeStrokeWidth={8}
            />
          </View>
          
          <Text style={styles.loadingText}>
            Processing your video...
          </Text>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Preview Modal Component
const PreviewModal = ({ visible, videoUri, onClose, onConfirm }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={styles.previewModalContainer}>
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={Typography.Colors.white} />
          </TouchableOpacity>
          <Text style={styles.previewTitle}>Preview Trimmed Video</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.previewVideoContainer}>
          <Video
            source={{ uri: videoUri }}
            style={styles.previewVideo}
            controls={true}
            resizeMode="contain"
            repeat={true}
          />
        </View>
        
        <View style={styles.previewActions}>
          <TouchableOpacity 
            style={styles.previewButton}
            onPress={onClose}
          >
            <Text style={styles.previewButtonText}>Re-trim</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.previewButton, styles.confirmButton]}
            onPress={onConfirm}
          >
            <Text style={[styles.previewButtonText, styles.confirmButtonText]}>
              Confirm
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const VideoScreen = ({ route }: { route: any }) => {
  const navigation = useNavigation();
  const { videoUri } = route.params;
  const [sliderValues, setSliderValues] = useState([0, 0]);
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimmedUri, setTrimmedUri] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimProgress, setTrimProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const onSliderChange = values => {
    setSliderValues(values);
  };

  useEffect(() => {
    console.log('videoUri:', videoUri);
  }, [videoUri]);

  const simulateProgress = (sessionId) => {
    const progressInterval = setInterval(() => {
      setTrimProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 500);
    
    return progressInterval;
  };
   
  const trimVideo = async () => {
    const [startTime, endTime] = sliderValues;
    const duration = endTime - startTime;

    if (duration <= 0) {
      Alert.alert('Invalid Range', 'End time must be greater than start time.');
      return;
    }

    const outputPath =`${RNFS.CachesDirectoryPath}/trimmed_${Date.now()}.mp4`

    const command = `-i "${videoUri}" -ss ${startTime} -t ${duration} -c:v libx264 -c:a aac "${outputPath}"`;

    setIsTrimming(true);
    setTrimProgress(0);
    
    const progressInterval = simulateProgress();
    
    try {
      await FFmpegKit.execute(command).then(async session => {
        const returnCode = await session.getReturnCode();
        clearInterval(progressInterval);
        
        if (returnCode.isValueSuccess()) {
          setTrimProgress(100);
          setTimeout(() => {
            setTrimmedUri(outputPath);
            setIsTrimming(false);
            setShowPreview(true);
          }, 500);
        } else {
          setIsTrimming(false);
          Alert.alert('Error', 'Failed to trim video.');
        }
      });
    } catch (error) {
      console.error('Trimming error:', error);
      clearInterval(progressInterval);
      setIsTrimming(false);
      Alert.alert('Error', 'Trimming failed.');
    }
  };

  const handleCancelTrim = () => {
    setIsTrimming(false);
    setTrimProgress(0);
  };

  const handlePreviewConfirm = () => {
    setShowPreview(false);
  
    navigation.navigate('AudioScreen', {
      videoUri: trimmedUri,
    });
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const paddedMins = mins < 10 ? `0${mins}` : mins;
    const paddedSecs = secs < 10 ? `0${secs}` : secs;
    return `${paddedMins}:${paddedSecs}`;
  };
  const videoRef = useRef(null);
  const [isVideoPaused, setIsVideoPaused] = useState(true);

  useEffect(() => {
    if ((isTrimming || showPreview) && videoRef.current?.pause) {
      videoRef.current.pause(); 
    }
  }, [isTrimming, showPreview]);
  
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Pressable onPress={() => navigation.goBack()}>
          <Icon1 name="arrow-left" size={22} color='white'/>
        </Pressable>
        <Text style={styles.headingText}>Selected Video</Text>
        <View/>
      </View> 
      
      <Video
      ref={videoRef}
        source={{ uri: videoUri }}
        style={styles.video}
        controls
        paused={isVideoPaused}
        resizeMode="contain"
        onLoad={meta => {
          const duration = Math.floor(meta.duration);
          setVideoDuration(duration);
          setSliderValues([0, duration]);  
        }}
        />

      {videoDuration > 0 && (
        <TimelineComponent
          videoDuration={videoDuration}
          sliderValues={sliderValues}
          onSliderChange={onSliderChange}
          videoUri={videoUri}
        />
      )}

      <Text style={styles.instructionText}>
        Drag the handles to select the portion you want to keep.
      </Text>

      <View style={styles.button}>
        <CustomButton
          title="Trim Video"
          onPress={trimVideo}
          disabled={isTrimming}
        />
      </View>

      {/* Loading Modal */}
      <LoadingModal
        visible={isTrimming}
        progress={trimProgress}
        onCancel={handleCancelTrim}
      />


      <PreviewModal
        visible={showPreview}
        videoUri={trimmedUri}
        onClose={() => setShowPreview(false)}
        onConfirm={handlePreviewConfirm}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Typography.Colors.backgroundColor,
  },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  headingText: {
    color: 'white',
    fontSize: 18,
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
  
  timelineContainer: {
    marginVertical: 20,
    height: 120,
  },
  timeMarkersContainer: {
    height: 20,
    position: 'relative',
    marginBottom: 5,
  },
  timeMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  timeMarkerLine: {
    width: 1,
    height: 8,
    backgroundColor: Typography.Colors.disableButton,
  },
  timeMarkerText: {
    color: Typography.Colors.disableButton,
    fontSize: 10,
    marginTop: 2,
  },
  timelineTrack: {
    height: 60,
    backgroundColor: '#2C3E50',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  framesScrollView: {
    flex: 1,
  },
  framesContainer: {
    flexDirection: 'row',
    height: 60,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  frameContainer: {
    width: 60,
    height: 60,
    borderRightWidth: 1,
    borderRightColor: Typography.Colors.grey,
  },
  framePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Typography.Colors.grey,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  dimmedArea: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    height: '100%',
    position: 'absolute',
    top: 0,
  },
  selectionArea: {
    position: 'absolute',
    height: '100%',
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderTopColor: Typography.Colors.primary,
    borderBottomColor: Typography.Colors.primary,
    backgroundColor: 'transparent',
  },
  trimHandle: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: 6,
    zIndex: 100,
  },
  handleActive: {
    backgroundColor: Typography.Colors.handleColor,
    transform: [{ scale: 1.1 }],
  },
  trimHandleBar: {
    width: 2,
    height: 20,
    backgroundColor: Typography.Colors.white,
    borderRadius: 1,
    marginHorizontal: 1,
  },
  timelineTouchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  currentTimeContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  currentTimeText: {
    color: Typography.Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  instructionText: {
    color: Typography.Colors.disableButton,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  trimButtonContainer: {
    marginTop: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Typography.Colors.backgroundColor,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 280,
  },
  progressContainer: {
    marginBottom: 20,
  },
  loadingText: {
    color: Typography.Colors.white,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: Typography.Colors.disableButton,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: Typography.Colors.white,
    fontSize: 16,
  },

  // Preview Modal Styles
  previewModalContainer: {
    flex: 1,
    backgroundColor: Typography.Colors.backgroundColor,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  previewTitle: {
    color: Typography.Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  previewVideo: {
    width: '100%',
    height: 300,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  previewButton: {
    flex: 1,
    backgroundColor: Typography.Colors.grey,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: Typography.Colors.primary,
  },
  previewButtonText: {
    color: Typography.Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: Typography.Colors.white,
  },
});

export default VideoScreen;