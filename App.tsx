import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';

import { useResizePlugin } from 'vision-camera-resize-plugin';
import { Worklets } from 'react-native-worklets-core';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import * as Speech from 'expo-speech';
import { COCO_LABELS } from './src/constants/cocoLabels';
import { DetectionOverlay } from './src/components/DetectionOverlay';
import { DetectionControls } from './src/components/DetectionControls';
import { useModelSetup} from './src/hooks/useModelSetup';

export default function App() {
  const device = useCameraDevice('back');
  const [toggleCamera, setToggleCamera] = useState<boolean>(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const { resize } = useResizePlugin();
  const [label, setLabel] = useState<string>("Scanning...")
  const lastSpokenTimestamp = useRef<number>(0)
  const { model, state } = useModelSetup();

  const handleDetection = Worklets.createRunOnJS((name: string) => {
    setLabel(name);

    const now = Date.now();

    if (now - lastSpokenTimestamp.current > 3000) {
      Speech.speak(name);
      lastSpokenTimestamp.current = now;
    }
  })
  
  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';

      const resized = resize(frame, {
        scale: {
          width: 640,
          height: 640,
        },
        pixelFormat: 'rgb',
        dataType: 'float32',
      });
      const outputs = model?.runSync([resized]) as any[];

      const detectionData = outputs[0] as Float32Array;

      const num_boxes = 8400;
      const num_features = 84;
      const confidence_threshold = 0.5;

      for (let i = 0; i < num_boxes; i++) {
        let maxScore = 0;
        let classIndex = -1;

        for (let j = 4; j < num_features; j++) {
          const score = detectionData[j * num_boxes + i];

          if (score > maxScore) {
            maxScore = score;
            classIndex = j - 4;
          }
        }

        if (maxScore > confidence_threshold) {
          const name = COCO_LABELS[classIndex];

          handleDetection(name);

          console.log(
            `Detected Class #${classIndex} with ${Math.round(
              maxScore * 100
            )}% confidence`
          );
        }
      }

      console.log(`First value: ${detectionData[0]}`);
    },
    [model, handleDetection]
  );

  if (state === 'loading') {
    return (
      <View>
        <Text>Loading AI Model...</Text>
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View>
        <Text>Failed to load model!</Text>
      </View>
    );
  }

  if (!hasPermission)
    return (
      <View style={styles.container}>
        <Text>
          Camera isn't allowed, click Allow for the app to get access!
        </Text>
        <Button title="Allow me pls" onPress={requestPermission} />
        <StatusBar style="auto" />
      </View>
    );

  if (device == null)
    return (
      <View style={styles.container}>
        <Text>CNo camera detectesd!!!</Text>
        <Button title="Allow me pls" onPress={requestPermission} />
        <StatusBar style="auto" />
      </View>
    );

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={toggleCamera}
        frameProcessor={frameProcessor}
      />
      <DetectionOverlay label={label}  />
      <DetectionControls isActive={toggleCamera} onToggle={() => setToggleCamera(prev => !prev)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
