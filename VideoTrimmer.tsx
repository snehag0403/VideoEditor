// import React, { useEffect, useRef, useState } from 'react';
// import { View, Image, PanResponder, StyleSheet, Dimensions, Text } from 'react-native';
// import { createThumbnail } from 'react-native-create-thumbnail';

// const SCREEN_WIDTH = Dimensions.get('window').width;
// const THUMB_SIZE = SCREEN_WIDTH / 6;
// const TIMELINE_HEIGHT = THUMB_SIZE + 20;

// type Props = {
//   videoUri: string;
//   videoDuration: number;
//   onTrimChange: (startSec: number, endSec: number) => void;
// };

// export default function VideoTrimmer({ videoUri, videoDuration, onTrimChange }: Props) {
//   const timelineWidth = SCREEN_WIDTH;
//   const minTrimPx = THUMB_SIZE * 1.5;

//   const [thumbs, setThumbs] = useState<string[]>([]);
//   const [leftX, setLeftX] = useState(0);
//   const [rightX, setRightX] = useState(timelineWidth - THUMB_SIZE);
//   const lastLeft = useRef(0);
//   const lastRight = useRef(timelineWidth - THUMB_SIZE);

//   useEffect(() => {
//     const count = 6;
//     const interval = videoDuration / count;
//     const arr = Array.from({ length: count }, (_, i) => i * interval);

//     Promise.all(
//       arr.map(sec =>
//         createThumbnail({ url: videoUri, timeStamp: sec * 1000 }).then(t => t.path)
//       )
//     ).then(setThumbs);
//   }, [videoUri]);

//   useEffect(() => {
//     const secPerPx = videoDuration / (timelineWidth - THUMB_SIZE);
//     const startSec = leftX * secPerPx;
//     const endSec = rightX * secPerPx;
//     onTrimChange(startSec, endSec);
//   }, [leftX, rightX]);

//   const leftPan = PanResponder.create({
//     onStartShouldSetPanResponder: () => true,
//     onPanResponderGrant: () => { lastLeft.current = leftX; },
//     onPanResponderMove: (_, { dx }) => {
//       let x = lastLeft.current + dx;
//       x = Math.max(0, Math.min(x, rightX - minTrimPx));
//       setLeftX(x);
//     },
//   });

//   const rightPan = PanResponder.create({
//     onStartShouldSetPanResponder: () => true,
//     onPanResponderGrant: () => { lastRight.current = rightX; },
//     onPanResponderMove: (_, { dx }) => {
//       let x = lastRight.current + dx;
//       x = Math.min(timelineWidth - THUMB_SIZE, Math.max(x, leftX + minTrimPx));
//       setRightX(x);
//     },
//   });

//   return (
//     <View style={styles.container}>
//       <View style={styles.timeline}>
//         {thumbs.map((uri, i) => (
//           <Image key={i} source={{ uri }} style={styles.thumbnail} />
//         ))}
//       </View>

//       <View
//         style={[
//           styles.selection,
//           { left: leftX + THUMB_SIZE / 2, width: rightX - leftX },
//         ]}
//       />

//       <View
//         style={[styles.handle, { left: leftX }]}
//         {...leftPan.panHandlers}
//       />
//       <View
//         style={[styles.handle, { left: rightX }]}
//         {...rightPan.panHandlers}
//       />

//       <View style={styles.labels}>
//         <Text>{(leftX * videoDuration / (timelineWidth - THUMB_SIZE)).toFixed(1)}s</Text>
//         <Text>{(rightX * videoDuration / (timelineWidth - THUMB_SIZE)).toFixed(1)}s</Text>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     width: SCREEN_WIDTH,
//     height: TIMELINE_HEIGHT,
//     justifyContent: 'center',
//     marginVertical: 16,
//   },
//   timeline: {
//     flexDirection: 'row',
//     width: SCREEN_WIDTH,
//     height: THUMB_SIZE,
//     overflow: 'hidden',
//   },
//   thumbnail: {
//     width: THUMB_SIZE,
//     height: THUMB_SIZE,
//   },
//   selection: {
//     position: 'absolute',
//     top: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0,123,255,0.3)',
//   },
//   handle: {
//     position: 'absolute',
//     top: 0,
//     width: THUMB_SIZE,
//     height: THUMB_SIZE,
//     backgroundColor: '#007bff',
//     opacity: 0.9,
//   },
//   labels: {
//     position: 'absolute',
//     top: THUMB_SIZE + 4,
//     left: 0,
//     right: 0,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingHorizontal: THUMB_SIZE / 2,
//   },
// });

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  PanResponder,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';
import { createThumbnail } from 'react-native-create-thumbnail';

const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMB_COUNT = 8;
const HANDLE_WIDTH = 20;

type Props = {
  videoUri: string;
  videoDuration: number;
  onTrimChange: (startSec: number, endSec: number) => void;
};

export default function VideoTrimmer({
  videoUri,
  videoDuration,
  onTrimChange,
}: Props) {
  const containerWidth = SCREEN_WIDTH - 40; // for padding
  const thumbnailWidth = containerWidth / THUMB_COUNT;

  const [thumbs, setThumbs] = useState<string[]>([]);
  const [leftX, setLeftX] = useState(0);
  const [rightX, setRightX] = useState(containerWidth);
  const lastLeft = useRef(0);
  const lastRight = useRef(containerWidth);

  // Generate thumbnails
  useEffect(() => {
    const interval = videoDuration / THUMB_COUNT;
    const promises = Array.from({ length: THUMB_COUNT }, (_, i) =>
      createThumbnail({
        url: videoUri,
        timeStamp: i * interval * 1000,
      }).then((res) => res.path)
    );

    Promise.all(promises).then(setThumbs);
  }, [videoUri]);

  // Convert X to time in seconds
  useEffect(() => {
    const pxPerSecond = containerWidth / videoDuration;
    const start = leftX / pxPerSecond;
    const end = rightX / pxPerSecond;
    onTrimChange(start, end);
  }, [leftX, rightX]);

  // Handle drag
  const leftPan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      lastLeft.current = leftX;
    },
    onPanResponderMove: (_, { dx }) => {
      let x = lastLeft.current + dx;
      x = Math.max(0, Math.min(x, rightX - HANDLE_WIDTH * 2));
      setLeftX(x);
    },
  });

  const rightPan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      lastRight.current = rightX;
    },
    onPanResponderMove: (_, { dx }) => {
      let x = lastRight.current + dx;
      x = Math.min(containerWidth, Math.max(x, leftX + HANDLE_WIDTH * 2));
      setRightX(x);
    },
  });

  return (
    <View style={styles.wrapper}>
      <View style={[styles.timeline, { width: containerWidth }]}>
        {thumbs.map((uri, idx) => (
          <Image key={idx} source={{ uri }} style={[styles.thumb, { width: thumbnailWidth }]} />
        ))}

        <View
          style={[
            styles.overlay,
            {
              left: leftX,
              width: rightX - leftX,
            },
          ]}
        />

        {/* Left handle */}
        <View
          style={[styles.handle, { left: leftX - HANDLE_WIDTH / 2 }]}
          {...leftPan.panHandlers}
        />

        {/* Right handle */}
        <View
          style={[styles.handle, { left: rightX - HANDLE_WIDTH / 2 }]}
          {...rightPan.panHandlers}
        />
      </View>

      {/* Time Labels */}
      <View style={styles.timeLabels}>
        <Text>{(leftX * videoDuration / containerWidth).toFixed(1)}s</Text>
        <Text>{(rightX * videoDuration / containerWidth).toFixed(1)}s</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  timeline: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#ddd',
    position: 'relative',
  },
  thumb: {
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,123,255,0.3)',
    borderColor: '#007bff',
    borderWidth: 2,
  },
  handle: {
    position: 'absolute',
    top: 0,
    width: HANDLE_WIDTH,
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: 2,
  },
  timeLabels: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
