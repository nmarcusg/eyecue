import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  loadTensorflowModel,
  useTensorflowModel,
} from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';

import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';

export default function App() {
  const device = useCameraDevice('back');
  const [toggleCamera, setToggleCamera] = useState<boolean>(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const plugin = useTensorflowModel(require('./assets/yolov8n.tflite'));
  const { resize } = useResizePlugin();

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
      const outputs = plugin.model?.runSync([resized]) as any[];

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
          console.log(
            `Detected Class #${classIndex} with ${Math.round(
              maxScore * 100
            )}% confidence`
          );
        }
      }

      console.log(`First value: ${detectionData[0]}`);
    },
    [plugin]
  );

  if (plugin.state === 'loading') {
    return (
      <View>
        <Text>Loading AI Model...</Text>
      </View>
    );
  }

  if (plugin.state === 'error') {
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
      <Button title="turn" onPress={() => setToggleCamera(!toggleCamera)} />
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
