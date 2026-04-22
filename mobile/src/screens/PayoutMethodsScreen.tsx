import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../api";
import type { PayoutMethod } from "../api";

type Props = {
  navigation: any;
};

function BankIcon() {
  return (
    <View style={iconStyles.circle}>
      <Text style={iconStyles.text}>🏦</Text>
    </View>
  );
}

function PayPalIcon() {
  return (
    <View style={iconStyles.circle}>
      <Text style={[iconStyles.text, { color: "#003087" }]}>P</Text>
    </View>
  );
}

function WiseIcon() {
  return (
    <View style={iconStyles.circle}>
      <Text style={[iconStyles.text, { color: "#9fe870" }]}>W</Text>
    </View>
  );
}

function CheckCircle({ active }: { active: boolean }) {
  if (!active) {
    return <View style={checkStyles.empty} />;
  }
  return (
    <View style={checkStyles.filled}>
      <Text style={checkStyles.check}>{"✓"}</Text>
    </View>
  );
}

function getMethodIcon(type: string) {
  switch (type) {
    case "paypal":
      return <PayPalIcon />;
    case "wise":
      return <WiseIcon />;
    default:
      return <BankIcon />;
  }
}

function formatAccountInfo(method: PayoutMethod): string {
  if (method.type === "paypal" || method.type === "wise") {
    return "No fees";
  }
  const acctType = method.account_type.charAt(0).toUpperCase() + method.account_type.slice(1);
  if (method.account_number) {
    return `${acctType} - ${method.account_number.replace(/./g, (c, i, s) => (i < s.length - 4 ? "*" : c))}`;
  }
  return acctType;
}

export default function PayoutMethodsScreen({ navigation }: Props) {
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchMethods = useCallback(async () => {
    try {
      const data = await api.getPayoutMethods();
      setMethods(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchMethods();
    });
    return unsubscribe;
  }, [navigation, fetchMethods]);

  const handleSetDefault = async (id: number) => {
    try {
      const updated = await api.setDefaultPayoutMethod(id);
      setMethods(updated);
    } catch {
      // silently fail
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMethods();
  }, [fetchMethods]);

  // Check for toast param from AddPayoutMethod screen
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      const params = navigation.getState()?.routes?.find(
        (r: any) => r.name === "PayoutMethods"
      )?.params as { added?: boolean } | undefined;
      if (params?.added) {
        setToast("Payout method added");
        navigation.setParams({ added: undefined });
        setTimeout(() => setToast(null), 3000);
      }
    });
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={colors.brandStrong} />
      </View>
    );
  }

  const isEmpty = methods.length === 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.navHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>{"←"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.pageTitle}>Payout methods</Text>

        {isEmpty ? (
          /* Empty state */
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Add a payout method</Text>
            <Text style={styles.emptyDesc}>
              In order to get paid you'll need to add a payout method
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("AddPayoutMethod")}
            >
              <Text style={styles.addButtonText}>Add payout method</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Populated state */
          <View style={styles.methodsSection}>
            <Text style={styles.subtitle}>
              Let us know where you'd like us to send your money.
            </Text>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("AddPayoutMethod")}
            >
              <Text style={styles.addButtonText}>Add payout method</Text>
            </TouchableOpacity>

            <View style={styles.methodsList}>
              {methods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    !!method.is_default && styles.methodCardActive,
                  ]}
                  onPress={() =>
                    navigation.navigate("AccountDetails", { id: method.id })
                  }
                  onLongPress={() => handleSetDefault(method.id)}
                >
                  <View style={styles.methodLeft}>
                    {getMethodIcon(method.type)}
                    <View style={styles.methodInfo}>
                      <Text style={styles.methodLabel}>{method.label}</Text>
                      <Text style={styles.methodName}>
                        {method.account_holder_name}
                      </Text>
                      <Text style={styles.methodDetail}>
                        {formatAccountInfo(method)}
                      </Text>
                    </View>
                  </View>
                  <CheckCircle active={!!method.is_default} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Toast */}
      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastCheck}>{"✓"}</Text>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

const colors = {
  bgScreen: "#fcfcfd",
  bgSecondary: "#ffffff",
  bgPrimary: "#f3f4f6",
  borderBase: "#e5e7eb",
  borderActive: "#1e2939",
  textHeading: "#101828",
  textBody: "#4a5565",
  textSubtle: "#6a7282",
  brandStrong: "#1e2939",
  brandFill: "#1e2939",
  toastBg: "#1e2939",
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
  pageTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.textHeading,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    letterSpacing: -0.75,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textBody,
    lineHeight: 22,
    marginBottom: 16,
  },
  // Empty state
  emptyCard: {
    marginHorizontal: 20,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderBase,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textHeading,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textBody,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 256,
  },
  // Add button
  addButton: {
    backgroundColor: colors.bgPrimary,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textHeading,
    letterSpacing: 0.175,
  },
  // Methods section
  methodsSection: {
    paddingHorizontal: 20,
  },
  methodsList: {
    gap: 12,
    marginTop: 16,
  },
  methodCard: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderBase,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  methodCardActive: {
    borderColor: colors.borderActive,
    borderWidth: 2,
  },
  methodLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  methodInfo: {
    flex: 1,
    gap: 2,
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textHeading,
  },
  methodName: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSubtle,
  },
  methodDetail: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSubtle,
  },
  // Toast
  toast: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: colors.toastBg,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toastCheck: {
    fontSize: 16,
    color: "#4ade80",
  },
  toastText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
});

const iconStyles = StyleSheet.create({
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 18,
  },
});

const checkStyles = StyleSheet.create({
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
    backgroundColor: "#1e2939",
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
  },
});
