import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api, PersonalInfo } from "../api";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type FieldKey = "first_name" | "last_name" | "mobile_number" | "email";

const FIELDS: { key: FieldKey; label: string; keyboard?: "email-address" | "phone-pad" }[] = [
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "mobile_number", label: "Mobile number", keyboard: "phone-pad" },
  { key: "email", label: "Email address", keyboard: "email-address" },
];

export default function PersonalInfoScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [info, setInfo] = useState<PersonalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<FieldKey | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastOpacity] = useState(new Animated.Value(0));

  const fetchInfo = useCallback(async () => {
    try {
      const data = await api.getPersonalInfo();
      setInfo(data);
    } catch {
      showToast("Failed to load personal info");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

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

  const handleEdit = (key: FieldKey) => {
    if (!info) return;
    setEditingField(key);
    setEditValue(info[key]);
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleSave = async () => {
    if (!editingField || !info) return;

    setSaving(true);
    try {
      const updated = await api.updatePersonalInfoField(editingField, editValue);
      setInfo(updated);
      setEditingField(null);
      setEditValue("");
      showToast("Updated successfully");
    } catch {
      showToast("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }, styles.centered]}>
        <ActivityIndicator size="large" color="#072929" />
      </View>
    );
  }

  if (!info) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.navHeader}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>{"<"}</Text>
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Could not load personal info</Text>
        </View>
      </View>
    );
  }

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
        <Text style={styles.title}>Personal info</Text>
      </View>

      {/* Fields */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {FIELDS.map((field, index) => {
          const isEditing = editingField === field.key;
          const isLast = index === FIELDS.length - 1;

          return (
            <View
              key={field.key}
              style={[styles.fieldItem, !isLast && styles.fieldItemBorder]}
            >
              {isEditing ? (
                /* ── Edit mode ── */
                <View style={styles.editContainer}>
                  <View style={styles.fieldHeader}>
                    <View style={styles.labelRow}>
                      <Text style={styles.fieldLabel}>{field.label}</Text>
                      <Text style={styles.requiredStar}> *</Text>
                    </View>
                    <Pressable onPress={handleCancel}>
                      <Text style={styles.actionLink}>Cancel</Text>
                    </Pressable>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType={field.keyboard ?? "default"}
                    autoCapitalize={field.key === "email" ? "none" : "words"}
                    autoFocus
                  />
                  <Pressable
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving && (
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 4 }} />
                    )}
                    <Text style={styles.saveButtonText}>Save</Text>
                  </Pressable>
                </View>
              ) : (
                /* ── View mode ── */
                <View style={styles.fieldHeader}>
                  <View style={styles.fieldContent}>
                    <View style={styles.labelRow}>
                      <Text style={styles.fieldLabel}>{field.label}</Text>
                      <Text style={styles.requiredStar}> *</Text>
                    </View>
                    <Text style={styles.fieldValue}>{info[field.key]}</Text>
                  </View>
                  <Pressable onPress={() => handleEdit(field.key)}>
                    <Text style={styles.actionLink}>Edit</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  content: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  fieldItem: {
    paddingBottom: 24,
    gap: 16,
  },
  fieldItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginBottom: 24,
  },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 32,
  },
  fieldContent: {
    flex: 1,
    gap: 2,
    paddingTop: 4,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#101828",
    letterSpacing: 0.14,
    lineHeight: 16,
  },
  requiredStar: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9b2c2c",
    lineHeight: 16,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: "400",
    color: "#4a5565",
    lineHeight: 22,
  },
  actionLink: {
    fontSize: 14,
    fontWeight: "500",
    color: "#101828",
    textDecorationLine: "underline",
    letterSpacing: 0.175,
    lineHeight: 22,
  },
  editContainer: {
    gap: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#9ea5b3",
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
  errorText: {
    fontSize: 14,
    color: "#6a7282",
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
