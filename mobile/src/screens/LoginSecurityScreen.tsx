import { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deactivating, setDeactivating] = useState(false);

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
    if (confirmText !== "DEACTIVATE ACCOUNT") return;
    setDeactivating(true);
    try {
      await api.deactivateAccount();
      setDeactivateModal(false);
      setConfirmText("");
      showToast("Account deactivation requested");
    } catch {
      showToast("Failed to deactivate account");
    } finally {
      setDeactivating(false);
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
            <Pressable onPress={() => setDeactivateModal(true)}>
              <Text style={styles.actionLink}>Deactivate</Text>
            </Pressable>
          </View>
        )}

        {/* Delete account button */}
        {!editing && (
          <Pressable style={styles.deleteButton} onPress={() => setDeactivateModal(true)}>
            <Text style={styles.deleteButtonIcon}>{"⚠"}</Text>
            <Text style={styles.deleteButtonText}>Delete account</Text>
          </Pressable>
        )}
      </View>

      {/* Deactivate confirmation modal */}
      <Modal
        visible={deactivateModal}
        transparent
        animationType="slide"
        onRequestClose={() => { if (!deactivating) { setDeactivateModal(false); setConfirmText(""); } }}
      >
        <Pressable
          style={styles.dimmer}
          onPress={() => { if (!deactivating) { setDeactivateModal(false); setConfirmText(""); } }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalWrapper}
        >
          <View style={styles.bottomSheet}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deactivate account</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => { if (!deactivating) { setDeactivateModal(false); setConfirmText(""); } }}
              >
                <Text style={styles.modalCloseX}>x</Text>
              </Pressable>
            </View>

            {/* Body */}
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalBodyText}>
                Are you sure you want to deactivate your account? This will permanently delete your account and all personal data. This action cannot be undone. To confirm, please type "DEACTIVATE ACCOUNT" below.
              </Text>
              <Text style={styles.modalInputLabel}>Confirmation</Text>
              <TextInput
                style={styles.modalInput}
                placeholder=""
                value={confirmText}
                onChangeText={setConfirmText}
                autoCapitalize="characters"
                editable={!deactivating}
              />
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <Pressable
                style={[
                  styles.deactivateButton,
                  confirmText === "DEACTIVATE ACCOUNT" ? styles.deactivateButtonActive : styles.deactivateButtonDisabled,
                ]}
                onPress={handleDeactivate}
                disabled={confirmText !== "DEACTIVATE ACCOUNT" || deactivating}
              >
                {deactivating && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
                <Text style={[
                  styles.deactivateButtonText,
                  confirmText === "DEACTIVATE ACCOUNT" ? styles.deactivateButtonTextActive : styles.deactivateButtonTextDisabled,
                ]}>
                  Deactivate account
                </Text>
              </Pressable>
              <Pressable
                style={styles.cancelButton}
                onPress={() => { setDeactivateModal(false); setConfirmText(""); }}
                disabled={deactivating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  // Delete account button
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3d3d3",
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    alignSelf: "flex-start",
    height: 38,
    marginTop: 8,
  },
  deleteButtonIcon: {
    fontSize: 14,
    color: "#9b2c2c",
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#101828",
    lineHeight: 22,
    letterSpacing: 0.175,
  },
  // Modal
  dimmer: {
    flex: 1,
    backgroundColor: "rgba(41,41,58,0.4)",
  },
  modalWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#101828",
    lineHeight: 28,
    letterSpacing: -0.33,
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseX: {
    fontSize: 14,
    fontWeight: "600",
    color: "#101828",
  },
  modalBody: {
    paddingVertical: 8,
  },
  modalBodyText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#101828",
    lineHeight: 22,
    marginBottom: 12,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#101828",
    letterSpacing: 0.14,
    lineHeight: 16,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5dc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#101828",
    lineHeight: 22,
    height: 46,
  },
  modalFooter: {
    paddingTop: 16,
    gap: 16,
  },
  deactivateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  deactivateButtonActive: {
    backgroundColor: "#f3d3d3",
  },
  deactivateButtonDisabled: {
    backgroundColor: "#f3d3d3",
    opacity: 0.5,
  },
  deactivateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    letterSpacing: 0.08,
    textAlign: "center",
  },
  deactivateButtonTextActive: {
    color: "#9b2c2c",
  },
  deactivateButtonTextDisabled: {
    color: "#9ea5b3",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#d1d5dc",
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#101828",
    lineHeight: 24,
    letterSpacing: 0.08,
  },
});
