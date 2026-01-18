import { Button } from "react-native"

interface DetectionControlProps {
    isActive: boolean;
    onToggle: () => void;
}

export function DetectionControls({isActive, onToggle} : DetectionControlProps) {
    return(<Button title={isActive ? "Pause" : "Start"} onPress={onToggle} />)
}