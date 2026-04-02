import {
  useTensorflowModel
} from 'react-native-fast-tflite';

type TensorflowPlugin = ReturnType<typeof useTensorflowModel>;

export interface ModelSetupResult {
    model: TensorflowPlugin['model'];
    state: TensorflowPlugin['state'];
}

export function useModelSetup() {
    const plugin = useTensorflowModel(require('../../assets/yolov8n.tflite'));
    return {
        model: plugin.model,
        state: plugin.state
    };
}                                                                                                                                           