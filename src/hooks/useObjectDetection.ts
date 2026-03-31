import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useSharedValue, Worklets } from 'react-native-worklets-core';
import { useFrameProcessor } from 'react-native-vision-camera';
import { COCO_LABELS } from '../constants/cocoLabels';
import { useTensorflowModel } from 'react-native-fast-tflite';

type TfliteModel = ReturnType<typeof useTensorflowModel>['model'];
type DetectionCallback = (label: string) => void;
type InferenceOutputs = readonly [Float32Array, ...unknown[]];

const NUM_BOXES = 8400;
const NUM_FEATURES = 84;
const CONFIDENCE_THRESHOLD = 0.5;
const INFERENCE_INTERVAL_MS = 200;

export function useObjectDetection(
  model: TfliteModel,
  onDetection: DetectionCallback
) {
  const { resize } = useResizePlugin();
  const runOnJs = Worklets.createRunOnJS(onDetection);
  const lastRunTime = useSharedValue(0);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';

      if (model == null) return;


      //throttle inference to prevent overload
      const now = Date.now();

      if (now - lastRunTime.value < INFERENCE_INTERVAL_MS) {
        return
      };
      lastRunTime.value = now;
      
      try {
      const resized = resize(frame, {
        scale: { width: 640, height: 640 },
        pixelFormat: 'rgb',
        dataType: 'float32',
      });

      const outputs = model.runSync([resized]) as unknown as InferenceOutputs;
      const detectionData = outputs[0];


      let bestOverallScore = 0;
      let bestOverallClassIndex = -1;

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

        if (maxScore > bestOverallScore) {
          bestOverallScore = maxScore;
          bestOverallClassIndex = classIndex;
        }
      }

      if (
        bestOverallScore > CONFIDENCE_THRESHOLD && bestOverallClassIndex >= 0 && bestOverallClassIndex < COCO_LABELS.length
      ) {
        const name = COCO_LABELS[bestOverallClassIndex];
        if (name) {
          runOnJs(name)
        }
      }
    } 
    catch (error) {
      // Handle errors gracefully
      console.error('Error during object detection:', error);
    }},  
    [model, runOnJs, lastRunTime]
  );

  return frameProcessor;
}