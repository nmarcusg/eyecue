import { Text } from "react-native"

interface DetectonOverlayProps {
    label: string;
}

export function DetectionOverlay({label} : DetectonOverlayProps) {
    return(<Text>{label}</Text>)
}