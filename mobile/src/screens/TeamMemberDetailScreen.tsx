import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api, TeamMember } from "../api";

// ── Colors ──────────────────────────────────────────────────────────

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
  textLight: "#ffffff",
  brandStrong: "#072929",
  success: "#87c068",
};

// ── Main Screen ─────────────────────────────────────────────────────

type Props = {
  navigation: any;
  route: any;
};

export default function TeamMemberDetailScreen({ navigation, route }: Props) {
  const { memberId } = route.params;
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);

  const fetchMember = useCallback(async () => {
    try {
      const data = await api.getTeamMember(memberId);
      setMember(data);
    } catch {
      Alert.alert("Error", "Could not load team member");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  const handleResendInvite = async () => {
    if (!member || resending) return;
    setResending(true);
    try {
      await api.resendInvite(member.id);
      Alert.alert("Success", "Invite resent successfully");
    } catch {
      Alert.alert("Error", "Could not resend invite");
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandStrong} />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Could not load team member</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMember}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isActive = member.status === "active";
  const isPending = member.status === "pending";
  const initial = (member.first_name.charAt(0) + member.last_name.charAt(0)).toUpperCase();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* Navigation header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Large avatar */}
      <View style={styles.avatarLarge}>
        <Text style={styles.avatarLargeText}>{initial}</Text>
      </View>

      {/* Info section */}
      <View style={styles.infoSection}>
        {/* Pending status row */}
        {isPending && (
          <View style={styles.pendingRow}>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendInvite}
              disabled={resending}
            >
              {resending ? (
                <ActivityIndicator size="small" color={colors.textHeading} />
              ) : (
                <Text style={styles.resendButtonText}>Resend invite</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Status + Name block */}
        <View style={styles.nameBlock}>
          {/* Status indicator */}
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, isActive ? styles.dotActive : styles.dotInactive]} />
            <Text style={styles.statusText}>
              {isActive ? "Active" : "Inactive"}
            </Text>
          </View>

          {/* Name + title */}
          <View style={styles.nameTitle}>
            <Text style={styles.memberName}>
              {member.first_name} {member.last_name}
            </Text>
            <Text style={styles.memberRole}>{member.role}</Text>
          </View>

          {/* Booked badge */}
          <View style={styles.bookedBadge}>
            <Text style={styles.bookedBadgeText}>
              {member.booked_percentage}% booked
            </Text>
          </View>
        </View>

        {/* Contact information */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Contact information</Text>
          <View style={styles.contactList}>
            <View style={styles.contactRow}>
              <Text style={styles.contactIcon}>✉</Text>
              <Text style={styles.contactText}>{member.email || "No email"}</Text>
            </View>
            <View style={styles.contactRow}>
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={styles.contactText}>{member.phone || "No phone"}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgScreen,
  },
  scrollContent: {
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
    paddingBottom: 4,
    paddingHorizontal: 20,
    gap: 24,
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
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.textHeading,
    textAlign: "center",
    lineHeight: 24,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },

  // Large avatar
  avatarLarge: {
    marginHorizontal: 20,
    marginTop: 24,
    width: "100%",
    aspectRatio: 1,
    maxWidth: 390,
    borderRadius: 16,
    backgroundColor: colors.bgPrimaryMedium,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  avatarLargeText: {
    fontSize: 80,
    fontWeight: "700",
    color: colors.textBody,
  },

  // Info section
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 20,
  },

  // Pending row
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderBase,
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
  resendButton: {
    backgroundColor: colors.bgPrimary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textHeading,
    lineHeight: 22,
    textAlign: "center",
  },

  // Name block
  nameBlock: {
    gap: 8,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderBase,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.bgElevated,
  },
  dotActive: {
    backgroundColor: colors.success,
  },
  dotInactive: {
    backgroundColor: colors.bgScreen,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textBody,
    lineHeight: 16,
  },
  nameTitle: {
    gap: 2,
  },
  memberName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textHeading,
    lineHeight: 24,
  },
  memberRole: {
    fontSize: 16,
    fontWeight: "400",
    color: colors.textSubtle,
    lineHeight: 24,
    letterSpacing: -0.08,
  },
  bookedBadge: {
    alignSelf: "flex-start",
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

  // Contact section
  contactSection: {
    gap: 16,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textHeading,
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  contactList: {
    gap: 12,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactIcon: {
    fontSize: 14,
    width: 16,
    textAlign: "center",
  },
  contactText: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSubtle,
    lineHeight: 22,
  },
});
