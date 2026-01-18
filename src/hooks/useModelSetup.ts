import {
  useTensorflowModel
} from 'react-native-fast-tflite';

export function useModelSetup() {
    const plugin = useTensorflowModel(require('../../assets/yolov8n.tflite'));
    return {
        model: plugin.model,
        state: plugin.state
    };
}