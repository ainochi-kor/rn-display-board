import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SPEED_MULTIPLIER = 25; // A higher number means slower speed.

export default function DisplayBoardScreen() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"input" | "display">("input");
  const [textWidth, setTextWidth] = useState(0);
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const startDisplay = async () => {
    if (!text.trim()) return;
    setTextWidth(0); // Reset to trigger the measurement phase
    animationRef.current?.stop();

    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
      setMode("display");
    } catch (error) {
      console.log("Failed to lock to landscape:", error);
    }
  };

  const stopDisplay = async () => {
    animationRef.current?.stop();
    try {
      await ScreenOrientation.unlockAsync();
      setMode("input");
    } catch (error) {
      console.log("Failed to unlock orientation:", error);
    }
  };

  useEffect(() => {
    if (textWidth > 0 && mode === "display") {
      const singleTextWidth = textWidth / 2;
      const duration = singleTextWidth * SPEED_MULTIPLIER;

      scrollAnim.setValue(0);
      const animation = Animated.timing(scrollAnim, {
        toValue: -singleTextWidth,
        duration: duration,
        useNativeDriver: true,
        easing: Easing.linear,
      });

      animationRef.current = Animated.loop(animation);
      animationRef.current.start();
    }

    return () => {
      animationRef.current?.stop();
    };
  }, [textWidth, mode]);

  const renderInputMode = () => (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.displayArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.displayText}>
            {text || "전광판에 표시할 텍스트를 입력하세요"}
          </Text>
        </ScrollView>
      </View>
      <View style={styles.inputArea}>
        <TextInput
          style={styles.textInput}
          placeholder="전광판에 표시할 텍스트를 입력하세요"
          placeholderTextColor="#666"
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={[styles.button, styles.startButton]}
          onPress={startDisplay}
          disabled={!text.trim()}
        >
          <Text style={styles.buttonText}>시작</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const DisplayModeView = () => {
    const insets = useSafeAreaInsets();
    const marqueeText = text.trim() + "      " + text.trim();

    return (
      <View style={styles.fullScreenDisplay}>
        {textWidth === 0 ? (
          // STEP 1: Render only the invisible measurer to get the true width
          <Text
            style={styles.textMeasurer}
            onLayout={(e) => {
              if (textWidth === 0) {
                setTextWidth(e.nativeEvent.layout.width);
              }
            }}
          >
            {marqueeText}
          </Text>
        ) : (
          // STEP 2: Width is measured, now render the visible animated text
          <Animated.Text
            style={[
              styles.fullScreenText,
              {
                width: textWidth,
                transform: [{ translateX: scrollAnim }],
              },
            ]}
            numberOfLines={1}
          >
            {marqueeText}
          </Animated.Text>
        )}
        <TouchableOpacity
          style={[
            styles.exitFullScreenButton,
            { top: insets.top > 0 ? insets.top : 20 },
          ]}
          onPress={stopDisplay}
        >
          <Text style={styles.exitButtonText}>나가기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar style="light" backgroundColor="#000" hidden={mode === "display"} />
      {mode === "input" ? renderInputMode() : <DisplayModeView />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  displayArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  displayText: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
  },
  inputArea: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  textInput: {
    backgroundColor: "#222",
    color: "#fff",
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    minHeight: 60,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#28a745",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  fullScreenDisplay: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  textMeasurer: {
    position: "absolute",
    opacity: 0,
    fontSize: 120,
    fontWeight: "bold",
  },
  fullScreenText: {
    color: "#fff",
    fontSize: 120,
    fontWeight: "bold",
  },
  exitFullScreenButton: {
    position: "absolute",
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fff",
    zIndex: 10,
  },
  exitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});