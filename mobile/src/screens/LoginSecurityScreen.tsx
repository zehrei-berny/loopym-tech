import { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LoginSecurityScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastOpacity] = useState(new Animated.Value(0));

  const showToast = (message: string) => {
    setToast(message);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      await api.updatePassword(newPassword, confirmPassword);
      setEditing(false);
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password successfully updated");
    } catch {
      showToast("Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      await api.deactivateAccount();
      showToast("Account deactivation requested");
    } catch {
      showToast("Failed to deactivate account");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{"<"}</Text>
        </Pressable>
      </View>

      {/* Page Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Log in & security</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {/* Password Row */}
        <View style={styles.item}>
          <View style={styles.itemTitle}>
            <Text style={styles.icon}>{"🔒"}</Text>
            <Text style={styles.itemLabel}>Password</Text>
          </View>
          <Pressable
            onPress={() => {
              if (editing) {
                setEditing(false);
                setNewPassword("");
                setConfirmPassword("");
              } else {
                setEditing(true);
              }
            }}
          >
            <Text style={styles.actionLink}>{editing ? "Cancel" : "Update"}</Text>
          </Pressable>
        </View>

        {/* Password Edit Fields */}
        {editing && (
          <View style={styles.editSection}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor="#6a7282"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                autoFocus
              />
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor="#6a7282"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
            <Pressable
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleUpdatePassword}
              disabled={saving}
            >
              {saving && (
                <ActivityIndicator size="small" color="#fff" style={styles.spinner} />
              )}
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>
        )}

        {/* Deactivate Account Row (hidden during edit) */}
        {!editing && (
          <View style={[styles.item, styles.itemAlignTop]}>
            <View style={[styles.itemTitle, styles.itemTitleAlignTop]}>
              <Text style={styles.icon}>{"👤"}</Text>
              <View style={styles.deactivateText}>
                <Text style={styles.itemLabel}>Deactivate account</Text>
                <Text style={styles.itemSubtitle}>
                  This action cannot be undone
                </Text>
              </View>
            </View>
            <Pressable onPress={handleDeactivate}>
              <Text style={styles.actionLink}>Deactivate</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Toast */}
      {toast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastIcon}>{"✓"}</Text>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfd",
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 18,
    fontWeight: "600",
    color: "#101828",
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#101828",
    letterSpacing: -0.75,
    lineHeight: 34,
  },
  actions: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  itemAlignTop: {
    alignItems: "flex-start",
  },
  itemTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  itemTitleAlignTop: {
    alignItems: "flex-start",
  },
  icon: {
    fontSize: 18,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#101828",
    letterSpacing: 0.14,
    lineHeight: 16,
  },
  itemSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6a7282",
    lineHeight: 16,
    marginTop: 4,
  },
  deactivateText: {
    flex: 1,
  },
  actionLink: {
    fontSize: 14,
    fontWeight: "500",
    color: "#101828",
    textDecorationLine: "underline",
    letterSpacing: 0.175,
    lineHeight: 22,
  },
  editSection: {
    gap: 16,
    paddingRight: 80,
  },
  inputWrapper: {
    width: "100%",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5dc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#101828",
    lineHeight: 22,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#072929",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: "flex-start",
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
    letterSpacing: 0.175,
    lineHeight: 22,
  },
  spinner: {
    marginRight: 0,
  },
  toast: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: "#072929",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toastIcon: {
    fontSize: 16,
    color: "#4ade80",
    fontWeight: "700",
  },
  toastText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
    letterSpacing: 0.175,
  },
});
