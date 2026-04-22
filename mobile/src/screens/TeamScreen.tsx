import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api, TeamMember } from "../api";

// ── Colors (matching existing codebase pattern) ────────────────────

const colors = {
  bgScreen: "#fcfcfd",
  bgElevated: "#ffffff",
  bgPrimary: "#f3f4f6",
  bgPrimaryMedium: "#e5e7eb",
  borderBase: "#e5e7eb",
  borderMedium: "#d1d5dc",
  textHeading: "#101828",
  textBody: "#4a5565",
  textSubtle: "#6a7282",
  textDisabled: "#9ea5b3",
  textLight: "#ffffff",
  brandStrong: "#072929",
  success: "#87c068",
};

// ── Add Member Modal ───────────────────────────────────────────────

type AddMemberModalProps = {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
};

function AddMemberModal({ visible, onClose, onAdded }: AddMemberModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = firstName.trim() && lastName.trim() && !submitting;

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setRole("");
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await api.addTeamMember({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: role.trim(),
      });
      resetForm();
      onClose();
      onAdded();
    } catch {
      Alert.alert("Error", "Could not add team member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={modalStyles.keyboardView}
        >
          <View style={modalStyles.sheet}>
            {/* Header */}
            <View style={modalStyles.header}>
              <Text style={modalStyles.headerTitle}>Invite team member</Text>
              <TouchableOpacity style={modalStyles.closeButton} onPress={handleClose}>
                <Text style={modalStyles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Body */}
            <ScrollView style={modalStyles.body} keyboardShouldPersistTaps="handled">
              <InputField label="First name" placeholder="Enter first name" value={firstName} onChangeText={setFirstName} />
              <InputField label="Last name" placeholder="Enter last name" value={lastName} onChangeText={setLastName} />
              <InputField label="Email address" placeholder="Enter email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
              <InputField label="Mobile number" placeholder="Enter mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <InputField label="Role" placeholder="Enter role" value={role} onChangeText={setRole} />
            </ScrollView>

            {/* Footer */}
            <View style={modalStyles.footer}>
              <TouchableOpacity
                style={[modalStyles.submitButton, !canSubmit && modalStyles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.textDisabled} />
                ) : (
                  <Text style={[modalStyles.submitText, !canSubmit && modalStyles.submitTextDisabled]}>
                    Add member
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ── Input Field ────────────────────────────────────────────────────

type InputFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
};

function InputField({ label, placeholder, value, onChangeText, keyboardType = "default" }: InputFieldProps) {
  return (
    <View style={inputStyles.container}>
      <Text style={inputStyles.label}>{label}</Text>
      <TextInput
        style={inputStyles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
      />
    </View>
  );
}

// ── Snackbar ───────────────────────────────────────────────────────

function Snackbar({ visible, message }: { visible: boolean; message: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View style={[snackStyles.container, { opacity, transform: [{ translateY }] }]}>
      <Text style={snackStyles.icon}>✓</Text>
      <Text style={snackStyles.text}>{message}</Text>
    </Animated.View>
  );
}

// ── Member Row ─────────────────────────────────────────────────────

type MemberRowProps = {
  member: TeamMember;
  onPress: () => void;
};

function MemberRow({ member, onPress }: MemberRowProps) {
  const initial = (member.first_name.charAt(0) + member.last_name.charAt(0)).toUpperCase();
  const isOnline = member.status === "active";
  const isPending = member.status === "pending";

  return (
    <TouchableOpacity style={memberStyles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={memberStyles.inner}>
        <View style={memberStyles.avatarAndName}>
          {/* Avatar */}
          <View style={memberStyles.avatarWrapper}>
            {member.avatar_url ? (
              <View style={memberStyles.avatar}>
                <Text style={memberStyles.avatarInitial}>{initial}</Text>
              </View>
            ) : (
              <View style={[memberStyles.avatar, isPending && memberStyles.avatarPending]}>
                <Text style={[memberStyles.avatarInitial, isPending && memberStyles.avatarInitialPending]}>
                  {member.first_name.charAt(0)}
                </Text>
              </View>
            )}
            <View style={[memberStyles.statusDot, isOnline ? memberStyles.dotOnline : memberStyles.dotOffline]} />
          </View>

          {/* Name + Role */}
          <View style={memberStyles.nameContainer}>
            <Text style={memberStyles.name} numberOfLines={1}>
              {member.first_name} {member.last_name}
            </Text>
            <Text style={memberStyles.role} numberOfLines={1}>
              {member.role}
            </Text>
          </View>
        </View>

        {/* Badge */}
        {isPending ? (
          <View style={memberStyles.pendingBadge}>
            <Text style={memberStyles.pendingBadgeText}>Pending</Text>
          </View>
        ) : (
          <View style={memberStyles.bookedBadge}>
            <Text style={memberStyles.bookedBadgeText}>{member.booked_percentage}% booked</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Main Team Screen ───────────────────────────────────────────────

type TeamScreenProps = {
  navigation: any;
};

export default function TeamScreen({ navigation }: TeamScreenProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [showSnack, setShowSnack] = useState(false);

  const fetchMembers = useCallback(async (query?: string) => {
    try {
      const data = await api.getTeamMembers(query);
      setMembers(data.members);
    } catch {
      Alert.alert("Error", "Could not load team members");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchMembers(search || undefined);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, fetchMembers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers(search || undefined);
  };

  const handleMemberAdded = () => {
    fetchMembers(search || undefined);
    setSnackMessage("New team member added");
    setShowSnack(true);
    setTimeout(() => setShowSnack(false), 3000);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandStrong} />
      </View>
    );
  }

  const isEmpty = members.length === 0 && !search;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Navigation header */}
        <View style={styles.navHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Page title */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Team</Text>
          <Text style={styles.pageSubtitle}>Manage your team members</Text>
        </View>

        {isEmpty ? (
          <>
            {/* Empty state */}
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No team members found</Text>
              <Text style={styles.emptyDescription}>
                Get started by adding all your team members.
              </Text>
            </View>

            {/* Add button */}
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addButtonIcon}>+</Text>
              <Text style={styles.addButtonText}>Add team member</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Add button */}
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addButtonIcon}>+</Text>
              <Text style={styles.addButtonText}>Add team member</Text>
            </TouchableOpacity>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a team member"
                placeholderTextColor={colors.textSubtle}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Members list */}
            <View style={styles.membersList}>
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  onPress={() => navigation.navigate("TeamMemberDetail", { memberId: member.id })}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Snackbar */}
      <Snackbar visible={showSnack} message={snackMessage} />

      {/* Add Member Modal */}
      <AddMemberModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={handleMemberAdded}
      />
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgScreen,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bgScreen,
    alignItems: "center",
    justifyContent: "center",
  },

  // Nav header
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 18,
    color: colors.textHeading,
  },

  // Title
  titleSection: {
    gap: 8,
    marginTop: 24,
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.textHeading,
    letterSpacing: -0.75,
    lineHeight: 34,
  },
  pageSubtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: colors.textBody,
    lineHeight: 24,
    letterSpacing: -0.08,
  },

  // Empty state
  emptyCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderBase,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textHeading,
    textAlign: "center",
    lineHeight: 24,
  },
  emptyDescription: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textBody,
    textAlign: "center",
    lineHeight: 22,
  },

  // Add button
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.bgPrimary,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  addButtonIcon: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textHeading,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textHeading,
    lineHeight: 24,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgPrimary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    color: colors.textHeading,
    lineHeight: 24,
    padding: 0,
  },

  // Members list
  membersList: {
    gap: 2,
  },
});

// ── Member row styles ───────────────────────────────────────────────

const memberStyles = StyleSheet.create({
  row: {
    paddingVertical: 0,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    gap: 16,
  },
  avatarAndName: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    position: "relative",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgPrimaryMedium,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPending: {
    backgroundColor: colors.bgPrimaryMedium,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textHeading,
  },
  avatarInitialPending: {
    color: colors.textDisabled,
  },
  statusDot: {
    position: "absolute",
    top: 4,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.bgElevated,
  },
  dotOnline: {
    backgroundColor: colors.success,
  },
  dotOffline: {
    backgroundColor: colors.bgScreen,
    borderColor: colors.bgElevated,
  },
  nameContainer: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textHeading,
    lineHeight: 24,
  },
  role: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSubtle,
    lineHeight: 16,
  },
  pendingBadge: {
    backgroundColor: colors.brandStrong,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textLight,
    lineHeight: 16,
    textAlign: "center",
  },
  bookedBadge: {
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bookedBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textHeading,
    lineHeight: 16,
    textAlign: "center",
  },
});

// ── Modal styles ────────────────────────────────────────────────────

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(41, 50, 58, 0.5)",
    justifyContent: "flex-start",
  },
  keyboardView: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    paddingTop: 64,
    paddingBottom: 32,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textHeading,
    lineHeight: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 16,
    color: colors.textHeading,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderBase,
  },
  submitButton: {
    backgroundColor: colors.brandStrong,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: colors.bgPrimary,
  },
  submitText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textLight,
    textAlign: "center",
    lineHeight: 22,
  },
  submitTextDisabled: {
    color: colors.textDisabled,
  },
});

// ── Input field styles ──────────────────────────────────────────────

const inputStyles = StyleSheet.create({
  container: {
    gap: 4,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textHeading,
    lineHeight: 16,
  },
  input: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "400",
    color: colors.textHeading,
    lineHeight: 22,
  },
});

// ── Snackbar styles ─────────────────────────────────────────────────

const snackStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: colors.brandStrong,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    shadowColor: "#1d293d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  icon: {
    fontSize: 16,
    color: colors.textLight,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    color: colors.textLight,
    lineHeight: 20,
  },
});
