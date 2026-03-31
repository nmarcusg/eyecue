import { useState, useCallback} from 'react';
import { StyleSheet, View } from 'react-native';
import { LoadingView, ErrorView, PermissionView, NoDeviceView } from './src/components/FallbackViews';

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
import { useDetectionSpeech } from './src/hooks/useDetectionSpeech';
const SPEECH_COOLDOWN_MS = 3000;

export default function App() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const { model, state } = useModelSetup();
  
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [label, setLabel] = useState<string>("Scanning...")
  
  const speakDetection = useDetectionSpeech(SPEECH_COOLDOWN_MS);
  
  const handleDetectionCallback = useCallback(
    (name: string) => {
      setLabel(name);
      speakDetection(name);
    },
    [speakDetection]
  );

  const onToggleCamera = useCallback(() => {
    setIsCameraActive((prev) => !prev);
  }, []);

  const frameProcessor = useObjectDetection (model, handleDetectionCallback);

  if (state === 'loading') {
    return <LoadingView />;
  }
  if (state === 'error') {
    return <ErrorView />;
  }
  if (!hasPermission)
    return <PermissionView onRequestPermission={requestPermission} />;

  if (device == null)
    return <NoDeviceView />;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isCameraActive}
        frameProcessor={frameProcessor}
      />
      <DetectionOverlay label={label}  />
      <DetectionControls isActive={isCameraActive} onToggle={onToggleCamera} />
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
