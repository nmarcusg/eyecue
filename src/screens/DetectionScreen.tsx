import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
	Camera,
	useCameraDevice,
	useCameraPermission,
} from 'react-native-vision-camera';

import {
	ErrorView,
	LoadingView,
	NoDeviceView,
	PermissionView,
} from '../components/FallbackViews';
import { DetectionOverlay } from '../components/DetectionOverlay';
import { DetectionControls } from '../components/DetectionControls';
import { useModelSetup } from '../hooks/useModelSetup';
import { useObjectDetection } from '../hooks/useObjectDetection';
import { useDetectionSpeech } from '../hooks/useDetectionSpeech';

const SPEECH_COOLDOWN_MS = 3000;

export function DetectionScreen() {
	const device = useCameraDevice('back');
	const { hasPermission, requestPermission } = useCameraPermission();
	const { model, state } = useModelSetup();

	const [isDetection, setIsDetection] = useState<boolean>(true);
	const [label, setLabel] = useState<string>('Scanning...');

	const speakDetection = useDetectionSpeech(SPEECH_COOLDOWN_MS);

	const handleDetectionCallback = useCallback(
		(name: string) => {
			setLabel(name);
			speakDetection(name);
		},
		[speakDetection]
	);

	const onToggleDetection = useCallback(() => {
		setIsDetection((prev) => !prev);
	}, []);

	const frameProcessor = useObjectDetection(
		model,
		isDetection,
		handleDetectionCallback
	);

	if (state === 'loading') {
		return <LoadingView />;
	}
	if (state === 'error') {
		return <ErrorView />;
	}
	if (!hasPermission) {
		return <PermissionView onRequestPermission={requestPermission} />;
	}

	if (device == null) {
		return <NoDeviceView />;
	}

	return (
		<View style={styles.container}>
			<Camera
				style={StyleSheet.absoluteFill}
				device={device}
				isActive={true}
				frameProcessor={frameProcessor}
			/>
			<DetectionOverlay label={label} />
			<DetectionControls isActive={isDetection} onToggle={onToggleDetection} />
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
