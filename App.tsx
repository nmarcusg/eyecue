import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useCallback} from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import {
  Camera,
  useCameraDevice,
  useCameraPermission
} from 'react-native-vision-camera';
import * as Speech from 'expo-speech';

//hooks, utils, ui
import { DetectionOverlay } from './src/components/DetectionOverlay';
import { DetectionControls } from './src/components/DetectionControls';
import { useModelSetup } from './src/hooks/useModelSetup';
import { useObjectDetection } from './src/hooks/useObjectDetection';

export default function App() {
  const device = useCameraDevice('back');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  
  const [label, setLabel] = useState<string>("Scanning...")
  const lastSpokenTimestamp = useRef<number>(0)

  const { model, state } = useModelSetup();

  const handleDetectionCallback = useCallback((name: string) => {
    setLabel(name);

    const now = Date.now();

    if (now - lastSpokenTimestamp.current > 3000) {
      Speech.speak(name);
      lastSpokenTimestamp.current = now;
    }
  },[]);
  
  const frameProcessor = useObjectDetection (model, handleDetectionCallback);


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
        isActive={isCameraActive}
        frameProcessor={frameProcessor}
      />
      <DetectionOverlay label={label}  />
      <DetectionControls isActive={isCameraActive} onToggle={() => setIsCameraActive(prev => !prev)} />
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
