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
import { api } from "./api";
import type { PaymentHistoryData } from "./api";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type Props = {
  onBack: () => void;
};

export default function PaymentHistoryScreen({ onBack }: Props) {
  const [data, setData] = useState<PaymentHistoryData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const result = await api.getPaymentHistory(selectedYear, selectedMonth);
      setData(result);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const formatCurrency = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${MONTH_NAMES[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return colors.textBody;
      case "cleared":
        return colors.textSubtle;
      default:
        return colors.textSubtle;
    }
  };

  const capitalizeFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (loading && !data) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={colors.brandStrong} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Navigation header */}
        <View style={styles.navHeader}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backArrow}>{"←"}</Text>
          </TouchableOpacity>
        </View>

        {/* Page title */}
        <Text style={styles.pageTitle}>Payment history</Text>

        {/* Year + month filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
        >
          <View style={styles.filtersRow}>
            {/* Year chip */}
            <TouchableOpacity
              style={styles.yearChip}
              onPress={() =>
                setSelectedYear((y) => (y === 2026 ? 2025 : 2026))
              }
            >
              <Text style={styles.yearChipText}>{selectedYear}</Text>
              <Text style={styles.yearChipArrow}>{"▾"}</Text>
            </TouchableOpacity>

            {/* Month chips */}
            {MONTH_NAMES.map((name, i) => {
              const month = i + 1;
              const isSelected = month === selectedMonth;
              return (
                <TouchableOpacity
                  key={month}
                  style={[styles.monthChip, isSelected && styles.monthChipSelected]}
                  onPress={() => setSelectedMonth(month)}
                >
                  <Text
                    style={[
                      styles.monthChipText,
                      isSelected && styles.monthChipTextSelected,
                    ]}
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Payment list */}
        {data && data.dates.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No payments for this period</Text>
          </View>
        )}

        {data?.dates.map((group) => (
          <View key={group.date} style={styles.dateGroup}>
            {/* Date header */}
            <View style={styles.dateHeader}>
              <Text style={styles.dateHeaderText}>
                {formatDateLabel(group.date)}
              </Text>
            </View>

            {/* Payment rows */}
            {group.payments.map((payment) => (
              <View key={payment.id} style={styles.paymentRow}>
                {/* Icon */}
                <View style={styles.paymentIcon}>
                  <Text style={styles.paymentIconText}>{"📄"}</Text>
                </View>

                {/* Details */}
                <View style={styles.paymentDetails}>
                  <View style={styles.paymentNameRow}>
                    <Text style={styles.paymentName}>{payment.payer_name}</Text>
                    <Text style={styles.paymentAmount}>
                      {formatCurrency(payment.amount)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.paymentStatus,
                      { color: getStatusColor(payment.status) },
                    ]}
                  >
                    {capitalizeFirst(payment.status)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const colors = {
  bgScreen: "#fcfcfd",
  bgSecondary: "#ffffff",
  bgPrimary: "#f3f4f6",
  borderBase: "#e5e7eb",
  borderMedium: "#d1d5dc",
  borderStronger: "#1e2939",
  textHeading: "#101828",
  textBody: "#4a5565",
  textSubtle: "#6a7282",
  brandStrong: "#1e2939",
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
    marginBottom: 16,
    letterSpacing: -0.75,
  },
  // Filters
  filtersScroll: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
  },
  yearChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bgSecondary,
  },
  yearChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textHeading,
    lineHeight: 22,
    letterSpacing: 0.175,
  },
  yearChipArrow: {
    fontSize: 12,
    color: colors.textHeading,
  },
  monthChip: {
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bgSecondary,
  },
  monthChipSelected: {
    borderWidth: 2,
    borderColor: colors.borderStronger,
    backgroundColor: colors.bgScreen,
  },
  monthChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textHeading,
    lineHeight: 22,
    letterSpacing: 0.175,
    textAlign: "center",
  },
  monthChipTextSelected: {
    color: colors.textHeading,
  },
  // Payment list
  dateGroup: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  dateHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderBase,
    paddingBottom: 16,
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textHeading,
    letterSpacing: 0.14,
  },
  paymentRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderBase,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentIconText: {
    fontSize: 16,
  },
  paymentDetails: {
    flex: 1,
    gap: 0,
  },
  paymentNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textHeading,
    lineHeight: 24,
    letterSpacing: 0.08,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textHeading,
    lineHeight: 24,
    letterSpacing: 0.08,
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSubtle,
    lineHeight: 16,
  },
  // Empty state
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSubtle,
  },
});
