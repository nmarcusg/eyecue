import { useResizePlugin } from 'vision-camera-resize-plugin';
import { Worklets } from 'react-native-worklets-core';
import { useFrameProcessor } from 'react-native-vision-camera';
import { COCO_LABELS } from '../constants/cocoLabels';
import { useTensorflowModel } from 'react-native-fast-tflite';

type TfliteModel = ReturnType<typeof useTensorflowModel>['model'];
type DetectionCallback = (label: string) => void;
type InferenceOutputs = readonly [Float32Array, ...unknown[]];

const NUM_BOXES = 8400;
const NUM_FEATURES = 84;
const CONFIDENCE_THRESHOLD = 0.5;

export function useObjectDetection(
  model: TfliteModel,
  onDetection: DetectionCallback
) {
  const { resize } = useResizePlugin();
  const runOnJs = Worklets.createRunOnJS(onDetection);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';

      if (model == null) return;

      const resized = resize(frame, {
        scale: { width: 640, height: 640 },
        pixelFormat: 'rgb',
        dataType: 'float32',
      });

      const outputs = model.runSync([resized]) as unknown as InferenceOutputs;
      const detectionData = outputs[0];

      for (let i = 0; i < NUM_BOXES; i++) {
        let maxScore = 0;
        let classIndex = -1;

        for (let j = 4; j < NUM_FEATURES; j++) {
          const score = detectionData[j * NUM_BOXES + i];
          if (score > maxScore) {
            maxScore = score;
            classIndex = j - 4;
          }
        }

        if (maxScore <= CONFIDENCE_THRESHOLD) continue;
        if (classIndex < 0 || classIndex >= COCO_LABELS.length) continue;

        const name = COCO_LABELS[classIndex];
        if (!name) continue;

        runOnJs(name);
      }
    },
    [model, runOnJs]
  );

  return frameProcessor;
}