import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api, Profile } from "./api";

// --- Icon components (SVG-style using simple RN shapes) ---

function BellIcon() {
  return (
    <View style={iconStyles.bellOuter}>
      <Text style={iconStyles.bellText}>🔔</Text>
    </View>
  );
}

function StarIcon() {
  return <Text style={{ fontSize: 16, color: "#0d9488" }}>★</Text>;
}

function ChevronRight() {
  return <Text style={{ fontSize: 16, color: "#9ca3af" }}>›</Text>;
}

function EditIcon() {
  return (
    <View style={iconStyles.editBadge}>
      <Text style={{ fontSize: 12, color: "#fff" }}>✎</Text>
    </View>
  );
}

// --- Menu item icons ---

function SecurityIcon() {
  return <Text style={iconStyles.menuIcon}>🔒</Text>;
}
function FeedbackIcon() {
  return <Text style={iconStyles.menuIcon}>💬</Text>;
}
function DocumentIcon() {
  return <Text style={iconStyles.menuIcon}>📄</Text>;
}
function LogoutIcon() {
  return <Text style={iconStyles.menuIcon}>🚪</Text>;
}

// --- Card icons (placeholder 3D-style) ---

function PersonalInfoIcon() {
  return <Text style={cardStyles.cardIcon}>👤</Text>;
}
function AvailabilityIcon() {
  return <Text style={cardStyles.cardIcon}>📅</Text>;
}
function PaymentsIcon() {
  return <Text style={cardStyles.cardIcon}>💰</Text>;
}
function MyTeamIcon() {
  return <Text style={cardStyles.cardIcon}>👥</Text>;
}
function SkillsIcon() {
  return <Text style={cardStyles.cardIcon}>🧰</Text>;
}

// --- Editable field modal-like inline editing ---

type EditableFieldProps = {
  label: string;
  value: string;
  onSave: (value: string) => void;
  keyboardType?: "default" | "numeric" | "decimal-pad";
};

function EditableField({
  label,
  value,
  onSave,
  keyboardType = "default",
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  if (!editing) {
    return (
      <TouchableOpacity
        style={editStyles.row}
        onPress={() => setEditing(true)}
      >
        <View style={editStyles.labelRow}>
          <Text style={editStyles.label}>{label}</Text>
          <Text style={editStyles.value}>{value}</Text>
        </View>
        <Text style={editStyles.editHint}>tap to edit</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={editStyles.row}>
      <Text style={editStyles.label}>{label}</Text>
      <TextInput
        style={editStyles.input}
        value={draft}
        onChangeText={setDraft}
        keyboardType={keyboardType}
        autoFocus
        onBlur={() => {
          onSave(draft);
          setEditing(false);
        }}
        returnKeyType="done"
        onSubmitEditing={() => {
          onSave(draft);
          setEditing(false);
        }}
      />
    </View>
  );
}

// --- Main Profile Screen ---

type ProfileScreenProps = {
  navigation: any;
};

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch {
      Alert.alert("Error", "Could not load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdate = async (fields: Partial<Omit<Profile, "id">>) => {
    try {
      const updated = await api.updateProfile(fields);
      setProfile(updated);
    } catch {
      Alert.alert("Error", "Could not update profile");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#072929" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Could not load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stars = Math.round(profile.rating);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Navigation header */}
      <View style={styles.navHeader}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.bellButton}>
          <BellIcon />
        </TouchableOpacity>
      </View>

      {/* Page title */}
      <Text style={styles.pageTitle}>Profile</Text>

      {/* Profile card */}
      <View style={styles.profileCard}>
        {/* Name + company + rating */}
        <View style={styles.nameSection}>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileCompany}>{profile.company}</Text>
          <View style={styles.ratingRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon key={i} />
            ))}
            <Text style={styles.ratingText}>{profile.rating.toFixed(2)}</Text>
          </View>
        </View>

        {/* Stats + avatar row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total{"\n"}earnings</Text>
            <Text style={styles.statValue}>
              ${profile.total_earnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.avatarContainer}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {profile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={() => setEditingProfile(!editingProfile)}
            >
              <EditIcon />
            </TouchableOpacity>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Jobs{"\n"}completed</Text>
            <Text style={styles.statValue}>{profile.jobs_completed}</Text>
          </View>
        </View>
      </View>

      {/* Editable profile fields (toggled by edit button) */}
      {editingProfile && (
        <View style={styles.editSection}>
          <Text style={styles.editSectionTitle}>Edit Profile</Text>
          <EditableField
            label="Name"
            value={profile.name}
            onSave={(v) => handleUpdate({ name: v })}
          />
          <EditableField
            label="Company"
            value={profile.company}
            onSave={(v) => handleUpdate({ company: v })}
          />
          <EditableField
            label="Total earnings"
            value={String(profile.total_earnings)}
            onSave={(v) => handleUpdate({ total_earnings: parseFloat(v) || 0 })}
            keyboardType="decimal-pad"
          />
          <EditableField
            label="Jobs completed"
            value={String(profile.jobs_completed)}
            onSave={(v) => handleUpdate({ jobs_completed: parseInt(v, 10) || 0 })}
            keyboardType="numeric"
          />
        </View>
      )}

      {/* Navigation cards grid */}
      <View style={cardStyles.grid}>
        <View style={cardStyles.row}>
          <View style={cardStyles.card}>
            <PersonalInfoIcon />
            <Text style={cardStyles.cardLabel}>Personal info</Text>
          </View>
          <View style={cardStyles.card}>
            <AvailabilityIcon />
            <Text style={cardStyles.cardLabel}>Availability</Text>
          </View>
        </View>
        <View style={cardStyles.row}>
          <TouchableOpacity style={cardStyles.card} onPress={() => navigation.navigate("Earnings")}>
            <PaymentsIcon />
            <Text style={cardStyles.cardLabel}>Payments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cardStyles.card} onPress={() => navigation.navigate("Team")}>
            <MyTeamIcon />
            <Text style={cardStyles.cardLabel}>My team</Text>
          </TouchableOpacity>
        </View>
        <View style={cardStyles.fullRow}>
          <View style={cardStyles.cardFull}>
            <SkillsIcon />
            <Text style={cardStyles.cardLabel}>Skills & certifications</Text>
          </View>
        </View>
      </View>

      {/* Toggle switches */}
      <View style={styles.toggleSection}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Allow push notifications</Text>
          <Switch
            value={!!profile.push_notifications}
            onValueChange={(v) =>
              handleUpdate({ push_notifications: v ? 1 : 0 })
            }
            trackColor={{ false: "#d1d5dc", true: "#072929" }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Log in using Face ID</Text>
          <Switch
            value={!!profile.face_id}
            onValueChange={(v) => handleUpdate({ face_id: v ? 1 : 0 })}
            trackColor={{ false: "#d1d5dc", true: "#072929" }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Action items */}
      <View style={styles.actionsSection}>
        <MenuItem icon={<SecurityIcon />} label="Login & security" onPress={() => navigation.navigate("LoginSecurity")} />
        <MenuItem icon={<FeedbackIcon />} label="Give us feedback" />
        <MenuItem icon={<FeedbackIcon />} label="Request a feature" />
        <MenuItem icon={<DocumentIcon />} label="View FAQ's" />
        <MenuItem icon={<DocumentIcon />} label="Terms of service" />
        <MenuItem icon={<DocumentIcon />} label="Privacy policy" />
        <MenuItem icon={<DocumentIcon />} label="Refund policy" />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Logout */}
      <TouchableOpacity style={styles.logoutRow}>
        <LogoutIcon />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={styles.versionText}>Version 1.1.4</Text>
    </ScrollView>
  );
}

// --- MenuItem sub-component ---

function MenuItem({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        {icon}
        <Text style={styles.menuItemLabel}>{label}</Text>
      </View>
      <ChevronRight />
    </TouchableOpacity>
  );
}

// --- Styles ---

const colors = {
  bgScreen: "#f8fafc",
  bgElevated: "#ffffff",
  borderBase: "#e5e7eb",
  textHeading: "#101828",
  textBody: "#4a5565",
  textSubtle: "#6a7282",
  brandStrong: "#072929",
  bgPrimary: "#f3f4f6",
  teal: "#0d9488",
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgScreen,
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
  errorText: {
    fontSize: 16,
    color: colors.textBody,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.brandStrong,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // Nav header
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 8,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgPrimary,
    alignItems: "center",
    justifyContent: "center",
  },

  // Page title
  pageTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.textHeading,
    letterSpacing: -0.75,
    lineHeight: 34,
    marginBottom: 20,
  },

  // Profile card
  profileCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderBase,
    padding: 20,
    gap: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 3,
    marginBottom: 12,
  },
  nameSection: {
    alignItems: "center",
    gap: 4,
  },
  profileName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textHeading,
    lineHeight: 16,
  },
  profileCompany: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSubtle,
    lineHeight: 16,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textBody,
    lineHeight: 16,
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    width: "100%",
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSubtle,
    textAlign: "center",
    lineHeight: 16,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textHeading,
    lineHeight: 16,
  },
  avatarContainer: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: "#d1d5dc",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.bgElevated,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 12,
  },

  // Edit section
  editSection: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderBase,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  editSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textHeading,
    marginBottom: 4,
  },

  // Toggles
  toggleSection: {
    marginTop: 12,
    gap: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderBase,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textHeading,
    flex: 1,
  },

  // Actions
  actionsSection: {
    marginTop: 16,
    gap: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 8,
    paddingVertical: 4,
    borderRadius: 12,
    height: 40,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textHeading,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginTop: 16,
  },

  // Logout
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    marginTop: 16,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textHeading,
  },

  // Version
  versionText: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSubtle,
    marginTop: 16,
  },
});

// --- Card grid styles ---
const cardStyles = StyleSheet.create({
  grid: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  fullRow: {
    flexDirection: "row",
  },
  card: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderBase,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 3,
  },
  cardFull: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderBase,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 40,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textHeading,
    textAlign: "center",
    lineHeight: 16,
  },
});

// --- Icon styles ---
const iconStyles = StyleSheet.create({
  bellOuter: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bellText: {
    fontSize: 16,
  },
  editBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: {
    fontSize: 18,
    width: 20,
    textAlign: "center",
  },
});

// --- Editable field styles ---
const editStyles = StyleSheet.create({
  row: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderBase,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSubtle,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textHeading,
  },
  editHint: {
    fontSize: 11,
    color: colors.teal,
    marginTop: 2,
  },
  input: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textHeading,
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
});
