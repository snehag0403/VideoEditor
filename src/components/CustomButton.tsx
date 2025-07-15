import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
} from "react-native";

type CustomButtonProps = {
  title?: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
};

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  disabled = false,
  buttonStyle,
  textStyle,
}) => {

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, buttonStyle, disabled && styles.disabledButton]}
      disabled={disabled}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#0D80F2",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor:"#808080",
  },
  text: {
    color: "white",
    // fontFamily: 'blue',
    fontSize: 18,
    fontWeight:'bold'
  },
});

export default CustomButton;
