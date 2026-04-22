import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { api, type Skill } from "../api";

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function SkillsCertificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchSkills = useCallback(async () => {
    try {
      const data = await api.getSkills();
      setSkills(data);
    } catch {
      Alert.alert("Error", "Could not load skills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleAddSkill = async () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;

    setAdding(true);
    try {
      const skill = await api.addSkill(trimmed);
      setSkills((prev) => [...prev, skill]);
      setNewSkill("");
      setModalVisible(false);
    } catch {
      Alert.alert("Error", "Could not add skill. It may already exist.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveSkill = async (skill: Skill) => {
    try {
      await api.deleteSkill(skill.id);
      setSkills((prev) => prev.filter((s) => s.id !== skill.id));
    } catch {
      Alert.alert("Error", "Could not remove skill");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#072929" />
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <Text style={styles.pageTitle}>Skills & certifications</Text>
        <Text style={styles.pageSubtitle}>
          Manage your skills & certifications
        </Text>

        {/* Your Skills Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your skills</Text>

          {/* Add a skill button */}
          <Pressable
            style={styles.addSkillButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addSkillPlus}>+</Text>
            <Text style={styles.addSkillText}>Add a skill</Text>
          </Pressable>

          {/* Skill Chips */}
          <View style={styles.chipsContainer}>
            {skills.map((skill) => (
              <View key={skill.id} style={styles.chip}>
                <Text style={styles.chipText}>{skill.name}</Text>
                <Pressable
                  onPress={() => handleRemoveSkill(skill)}
                  hitSlop={8}
                >
                  <View style={styles.chipClose}>
                    <Text style={styles.chipCloseText}>x</Text>
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add Skill Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.dimmer}
          onPress={() => !adding && setModalVisible(false)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalWrapper}
        >
          <View style={styles.bottomSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add a skill</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => !adding && setModalVisible(false)}
              >
                <Text style={styles.modalCloseX}>x</Text>
              </Pressable>
            </View>

            {/* Input */}
            <View style={styles.modalBody}>
              <TextInput
                style={[
                  styles.input,
                  newSkill.trim() ? styles.inputFocused : null,
                ]}
                placeholder="Enter a skill"
                placeholderTextColor="#6a7282"
                value={newSkill}
                onChangeText={setNewSkill}
                autoFocus
                editable={!adding}
              />
            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <Pressable
                style={[
                  styles.addButton,
                  newSkill.trim()
                    ? styles.addButtonActive
                    : styles.addButtonDisabled,
                ]}
                onPress={handleAddSkill}
                disabled={!newSkill.trim() || adding}
              >
                {adding && (
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text
                  style={[
                    styles.addButtonText,
                    newSkill.trim()
                      ? styles.addButtonTextActive
                      : styles.addButtonTextDisabled,
                  ]}
                >
                  Add skill
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfd",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: "#101828",
    letterSpacing: -0.75,
    lineHeight: 34,
    marginTop: 24,
  },
  pageSubtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#4a5565",
    lineHeight: 24,
    letterSpacing: -0.08,
    marginTop: 8,
  },
  section: {
    marginTop: 20,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#101828",
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  addSkillButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  addSkillPlus: {
    fontSize: 16,
    fontWeight: "600",
    color: "#101828",
  },
  addSkillText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#101828",
    lineHeight: 24,
    letterSpacing: 0.08,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fcfcfd",
    borderWidth: 2,
    borderColor: "#1e2939",
    borderRadius: 9999,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    gap: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#101828",
    lineHeight: 22,
    letterSpacing: 0.175,
  },
  chipClose: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#1e2939",
    alignItems: "center",
    justifyContent: "center",
  },
  chipCloseText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 12,
  },
  // Modal
  dimmer: {
    flex: 1,
    backgroundColor: "rgba(41, 50, 58, 0.5)",
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
    paddingBottom: 32,
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
    paddingTop: 16,
    paddingBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5dc",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontWeight: "400",
    color: "#101828",
    lineHeight: 22,
    backgroundColor: "#fff",
  },
  inputFocused: {
    borderColor: "#1e2939",
  },
  modalFooter: {
    paddingTop: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  addButtonDisabled: {
    backgroundColor: "#f3f4f6",
  },
  addButtonActive: {
    backgroundColor: "#009898",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 22,
    letterSpacing: 0.175,
    textAlign: "center",
  },
  addButtonTextDisabled: {
    color: "#9ea5b3",
  },
  addButtonTextActive: {
    color: "#fff",
  },
});
