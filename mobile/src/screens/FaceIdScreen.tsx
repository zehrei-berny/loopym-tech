import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

// ── Face ID icon (matches Figma scan-face design) ─────────────────
function FaceIdIcon({ size = 160 }: { size?: number }) {
  const s = size;
  const corner = s * 0.28;
  const thickness = s * 0.04;
  const radius = s * 0.12;
  const inset = s * 0.06;

  // Face features
  const eyeSize = s * 0.065;
  const eyeY = s * 0.34;
  const leftEyeX = s * 0.33;
  const rightEyeX = s * 0.67 - eyeSize;
  const noseWidth = thickness;
  const noseHeight = s * 0.14;
  const noseX = s * 0.5 - noseWidth / 2;
  const noseY = s * 0.38;
  const mouthWidth = s * 0.22;
  const mouthHeight = s * 0.045;
  const mouthX = s * 0.5 - mouthWidth / 2;
  const mouthY = s * 0.66;

  return (
    <View style={{ width: s, height: s }}>
      {/* Top-left corner */}
      <View
        style={{
          position: "absolute",
          top: inset,
          left: inset,
          width: corner,
          height: corner,
          borderTopWidth: thickness,
          borderLeftWidth: thickness,
          borderColor: "white",
          borderTopLeftRadius: radius,
        }}
      />
      {/* Top-right corner */}
      <View
        style={{
          position: "absolute",
          top: inset,
          right: inset,
          width: corner,
          height: corner,
          borderTopWidth: thickness,
          borderRightWidth: thickness,
          borderColor: "white",
          borderTopRightRadius: radius,
        }}
      />
      {/* Bottom-left corner */}
      <View
        style={{
          position: "absolute",
          bottom: inset,
          left: inset,
          width: corner,
          height: corner,
          borderBottomWidth: thickness,
          borderLeftWidth: thickness,
          borderColor: "white",
          borderBottomLeftRadius: radius,
        }}
      />
      {/* Bottom-right corner */}
      <View
        style={{
          position: "absolute",
          bottom: inset,
          right: inset,
          width: corner,
          height: corner,
          borderBottomWidth: thickness,
          borderRightWidth: thickness,
          borderColor: "white",
          borderBottomRightRadius: radius,
        }}
      />

      {/* Left eye */}
      <View
        style={{
          position: "absolute",
          top: eyeY,
          left: leftEyeX,
          width: eyeSize,
          height: eyeSize,
          borderRadius: eyeSize / 2,
          backgroundColor: "white",
        }}
      />
      {/* Right eye */}
      <View
        style={{
          position: "absolute",
          top: eyeY,
          left: rightEyeX,
          width: eyeSize,
          height: eyeSize,
          borderRadius: eyeSize / 2,
          backgroundColor: "white",
        }}
      />
      {/* Nose */}
      <View
        style={{
          position: "absolute",
          top: noseY,
          left: noseX,
          width: noseWidth,
          height: noseHeight,
          backgroundColor: "white",
          borderBottomLeftRadius: noseWidth,
          borderBottomRightRadius: noseWidth,
        }}
      />
      {/* Mouth */}
      <View
        style={{
          position: "absolute",
          top: mouthY,
          left: mouthX,
          width: mouthWidth,
          height: mouthHeight,
          borderBottomLeftRadius: mouthHeight,
          borderBottomRightRadius: mouthHeight,
          backgroundColor: "white",
        }}
      />
    </View>
  );
}

export default function FaceIdScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [enrolling, setEnrolling] = useState(false);

  const handleEnable = async () => {
    setEnrolling(true);
    try {
      // 1. Check hardware support
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        Alert.alert(
          "Not Supported",
          "Your device does not support biometric authentication."
        );
        return;
      }

      // 2. Check if biometrics are enrolled on device
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert(
          "Not Set Up",
          "No biometric records found. Please set up Face ID or fingerprint in your device settings."
        );
        return;
      }

      // 3. Prompt biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to enable Face ID",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (!result.success) {
        if (result.error !== "user_cancel") {
          Alert.alert("Authentication Failed", "Please try again.");
        }
        return;
      }

      // 4. Call backend to enroll
      await api.enrollFaceId();

      // 5. Update profile
      await api.updateProfile({ face_id: 1 });

      Alert.alert("Face ID Enabled", "You can now log in with Face ID.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleNotNow = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Icon + Content */}
      <View style={styles.content}>
        <FaceIdIcon size={160} />
        <Text style={styles.heading}>LOG IN WITH A{"\n"}LOOK</Text>
        <Text style={styles.description}>
          Keep your account secure. Use Face ID instead of a password to log in.
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <Pressable
          style={[styles.enableButton, enrolling && styles.enableButtonDisabled]}
          onPress={handleEnable}
          disabled={enrolling}
        >
          {enrolling ? (
            <ActivityIndicator size="small" color="#101828" />
          ) : (
            <Text style={styles.enableButtonText}>Enable Face ID</Text>
          )}
        </Pressable>

        <Pressable style={styles.notNowButton} onPress={handleNotNow}>
          <Text style={styles.notNowButtonText}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#009898",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  heading: {
    fontWeight: "900",
    fontSize: 48,
    lineHeight: 50,
    color: "white",
    textAlign: "center",
    letterSpacing: -1.2,
    marginTop: 32,
  },
  description: {
    fontWeight: "500",
    fontSize: 16,
    lineHeight: 24,
    color: "white",
    textAlign: "center",
    letterSpacing: 0.08,
    marginTop: 16,
    maxWidth: 301,
  },
  buttons: {
    paddingHorizontal: 40,
    paddingBottom: 24,
    gap: 16,
  },
  enableButton: {
    backgroundColor: "white",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    height: 52,
  },
  enableButtonDisabled: {
    opacity: 0.8,
  },
  enableButtonText: {
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 24,
    color: "#101828",
    textAlign: "center",
    letterSpacing: 0.08,
  },
  notNowButton: {
    borderWidth: 1,
    borderColor: "#8afef4",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    height: 52,
  },
  notNowButtonText: {
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 24,
    color: "#00fee9",
    textAlign: "center",
    letterSpacing: 0.08,
  },
});
