import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../api";
import type { PayoutMethod } from "../api";

type Props = {
  navigation: any;
  route: any;
};

function TrashIcon() {
  return <Text style={{ fontSize: 20 }}>🗑</Text>;
}

function RadioCircle({ active }: { active: boolean }) {
  if (!active) {
    return <View style={radioStyles.empty} />;
  }
  return (
    <View style={radioStyles.filled}>
      <View style={radioStyles.inner} />
    </View>
  );
}

export default function AccountDetailsScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const [method, setMethod] = useState<PayoutMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchMethod = useCallback(async () => {
    try {
      const data = await api.getPayoutMethod(id);
      setMethod(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMethod();
  }, [fetchMethod]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deletePayoutMethod(id);
      setShowDeleteModal(false);
      navigation.goBack();
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={colors.brandStrong} />
      </View>
    );
  }

  if (!method) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.errorText}>Payout method not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.navHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>{"←"}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.trashButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <TrashIcon />
          </TouchableOpacity>
        </View>

        <Text style={styles.pageTitle}>Account details</Text>

        {/* Read-only form fields */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full name of account holder</Text>
            <View style={styles.fieldValue}>
              <Text style={styles.fieldValueText}>
                {method.account_holder_name || "—"}
              </Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Routing number</Text>
            <View style={styles.fieldValue}>
              <Text style={styles.fieldValueText}>
                {method.routing_number || "—"}
              </Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Account number</Text>
            <View style={styles.fieldValue}>
              <Text style={styles.fieldValueText}>
                {method.account_number || "—"}
              </Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Account type</Text>
            <View style={styles.radioRow}>
              <RadioCircle active={method.account_type === "savings"} />
              <Text style={styles.radioLabel}>Savings</Text>
            </View>
            <View style={styles.radioRow}>
              <RadioCircle active={method.account_type === "checking"} />
              <Text style={styles.radioLabel}>Checking</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Delete confirmation modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Delete payout method</Text>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                <Text style={modalStyles.closeIcon}>{"✕"}</Text>
              </TouchableOpacity>
            </View>

            <Text style={modalStyles.description}>
              Are you sure you want to delete this payout method? Please make
              sure you have another payout method added, otherwise your payments
              will be delayed.
            </Text>

            <TouchableOpacity
              style={modalStyles.deleteButton}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={modalStyles.deleteButtonText}>
                  Delete payout method
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={modalStyles.cancelButton}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={modalStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const colors = {
  bgScreen: "#fcfcfd",
  bgSecondary: "#ffffff",
  bgPrimary: "#f3f4f6",
  borderBase: "#e5e7eb",
  textHeading: "#101828",
  textBody: "#4a5565",
  textSubtle: "#6a7282",
  brandStrong: "#1e2939",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgScreen,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: colors.bgPrimary,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 18,
    color: colors.textHeading,
  },
  trashButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: colors.bgPrimary,
    justifyContent: "center",
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.textHeading,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    letterSpacing: -0.75,
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
  // Form
  form: {
    paddingHorizontal: 20,
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textHeading,
  },
  fieldValue: {
    backgroundColor: colors.bgPrimary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldValueText: {
    fontSize: 16,
    color: colors.textHeading,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: "400",
    color: colors.textHeading,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textHeading,
  },
  closeIcon: {
    fontSize: 18,
    color: colors.textSubtle,
    padding: 4,
  },
  description: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textBody,
    lineHeight: 22,
  },
  deleteButton: {
    backgroundColor: colors.dangerBg,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textHeading,
    letterSpacing: 0.2,
  },
  cancelButton: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderBase,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textHeading,
    letterSpacing: 0.2,
  },
});

const radioStyles = StyleSheet.create({
  empty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#d1d5dc",
  },
  filled: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#1e2939",
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#1e2939",
  },
});
