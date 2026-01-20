import { useState } from 'react';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { Worklets } from 'react-native-worklets-core';
import * as Speech from 'expo-speech';
import {useFrameProcessor} from 'react-native-vision-camera';
import { COCO_LABELS } from '../constants/cocoLabels'

interface onDetection {
     label: string;
}

export function useObjectDetection(model: any, onDetection: (label: string) => void) {
    const { resize } = useResizePlugin();
    
    const runOnJs = Worklets.createRunOnJS(onDetection);

    const frameProcessor = useFrameProcessor((frame) => {
          'worklet';
        
          if (model == null) return;

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
    
              runOnJs(name);
    
              console.log(
                `Detected Class #${classIndex} with ${Math.round(
                  maxScore * 100
                )}% confidence`
              );
            }
          }
    
          console.log(`First value: ${detectionData[0]}`);
        },
        [model, runOnJs]
      );
      return frameProcessor;
    }