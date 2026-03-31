import { Button, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface PermissionViewProps {
  onRequestPermission: () => void;
}

export function LoadingView() {
  return (
    <View>
      <Text>Loading AI Model...</Text>
    </View>
  );
}

export function ErrorView() {
  return (
    <View>
      <Text>Failed to load model!</Text>
    </View>
  );
}

export function PermissionView({ onRequestPermission }: PermissionViewProps) {
  return (
    <View>
      <Text>Camera isn't allowed, click Allow for the app to get access!</Text>
      <Button title="Allow me pls" onPress={onRequestPermission} />
      <StatusBar style="auto" />
    </View>
  );
}

export function NoDeviceView() {
  return (
    <View>
      <Text>No camera detected.</Text>
      <StatusBar style="auto" />
    </View>
  );
}