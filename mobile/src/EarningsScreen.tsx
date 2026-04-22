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
import type { EarningsData, MonthlySummary, DailySummary } from "./api";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Props = {
  navigation: any;
};

export default function EarningsScreen({ navigation }: Props) {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);
  const [daily, setDaily] = useState<DailySummary | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentYear = earnings?.current_year ?? new Date().getFullYear();

  const fetchData = useCallback(async () => {
    try {
      const [e, m] = await Promise.all([
        api.getEarnings(),
        api.getMonthlySummary(),
      ]);
      setEarnings(e);
      setMonthly(m);

      // Default to current month per Figma annotation
      const month = e.current_month;
      setSelectedMonth(month);

      const d = await api.getDailySummary(e.current_year, month);
      setDaily(d);
      if (d.days.length > 0) {
        setSelectedDay(d.days[0].day);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // When selected month changes, fetch new daily data
  const handleSelectMonth = useCallback(
    async (month: number) => {
      if (month === selectedMonth) return;
      setSelectedMonth(month);
      setSelectedDay(null);
      setDaily(null);
      try {
        const d = await api.getDailySummary(currentYear, month);
        setDaily(d);
        if (d.days.length > 0) {
          setSelectedDay(d.days[0].day);
        }
      } catch {
        // silently fail
      }
    },
    [selectedMonth, currentYear]
  );

  const maxMonthlyTotal = monthly
    ? Math.max(...monthly.months.map((m) => m.total), 1)
    : 1;

  const selectedDayData = daily?.days.find((d) => d.day === selectedDay);
  const selectedDayTotal = selectedDayData?.total ?? 0;

  const formatCurrency = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (month: number, day: string, year: number) => {
    const monthName = MONTH_NAMES[month - 1];
    return `${monthName} ${day}, ${year}`;
  };

  // Build list of months that have data, in reverse order (most recent first)
  const monthsWithData = monthly
    ? monthly.months
        .filter((m) => m.total > 0)
        .map((m) => m.month)
        .reverse()
    : [];

  if (loading) {
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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>{"←"}</Text>
          </TouchableOpacity>
        </View>

        {/* Page title */}
        <Text style={styles.pageTitle}>Earnings</Text>

        {/* Payout method card - shown when no payout method exists */}
        {earnings && !earnings.has_payout_method && (
          <View style={styles.payoutCard}>
            <View style={styles.payoutHeader}>
              <Text style={styles.payoutTitle}>Add a payout method</Text>
              <Text style={styles.payoutDesc}>
                In order to get paid you'll need to add a payout method
              </Text>
            </View>
            <TouchableOpacity
              style={styles.payoutButton}
              onPress={() => navigation.navigate("AddPayoutMethod")}
            >
              <Text style={styles.payoutButtonText}>Add payout method</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Earnings card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsAmountSection}>
            <Text style={styles.earningsLabel}>Today's estimated earnings</Text>
            <Text style={styles.earningsAmount}>
              {formatCurrency(earnings?.today_earnings ?? 0)}
            </Text>
          </View>

          {/* Details row */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailAmount}>
                {formatCurrency(earnings?.current_month_earnings ?? 0)}
              </Text>
              <Text style={styles.detailLabel}>This month's earnings</Text>
              <Text style={styles.detailLabel}>
                {MONTH_NAMES[(earnings?.current_month ?? 1) - 1]} 01 -{" "}
                {String(new Date().getDate()).padStart(2, "0")}
              </Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Text style={styles.detailAmount}>
                {formatCurrency(earnings?.last_month_earnings ?? 0)}
              </Text>
              <Text style={styles.detailLabel}>Last month's earnings</Text>
              <Text style={styles.detailLabel}>
                {MONTH_NAMES_FULL[((earnings?.current_month ?? 2) - 2 + 12) % 12]},{" "}
                {earnings?.current_year ?? 2026}
              </Text>
            </View>
          </View>
        </View>

        {/* Monthly earnings */}
        <Text style={styles.sectionTitle}>Monthly earnings</Text>
        {monthly && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.barsScroll}>
            <View style={styles.barsContainer}>
              {monthly.months.map((m) => {
                const isSelected = m.month === selectedMonth;
                const barHeight = m.total > 0
                  ? Math.max(32, (m.total / maxMonthlyTotal) * 80)
                  : 32;
                return (
                  <TouchableOpacity
                    key={m.month}
                    style={styles.barColumn}
                    onPress={() => handleSelectMonth(m.month)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: isSelected
                            ? colors.brandStrong
                            : colors.bgPrimaryMedium,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.barLabel,
                          { color: isSelected ? "#fff" : colors.textBody },
                        ]}
                      >
                        {formatCurrency(m.total)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.monthLabel,
                        {
                          color: isSelected
                            ? colors.textHeading
                            : colors.textDisabled,
                        },
                      ]}
                    >
                      {MONTH_NAMES[m.month - 1]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* Day chips */}
        {daily && daily.days.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            <View style={styles.chipsRow}>
              {daily.days.map((d) => {
                const isSelected = d.day === selectedDay;
                return (
                  <TouchableOpacity
                    key={d.day}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setSelectedDay(d.day)}
                  >
                    <Text
                      style={[styles.chipText, isSelected && styles.chipTextSelected]}
                    >
                      {d.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* Day / month total details */}
        {daily && selectedDay && selectedMonth && (
          <View style={styles.dayDetailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.dayDetailLabel}>
                {formatDate(daily.month, selectedDay, daily.year)}
              </Text>
              <Text style={styles.dayDetailAmount}>{formatCurrency(selectedDayTotal)}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Text style={styles.dayDetailLabel}>
                {MONTH_NAMES[daily.month - 1]} TOTAL
              </Text>
              <Text style={styles.dayDetailAmount}>{formatCurrency(daily.month_total)}</Text>
            </View>
          </View>
        )}

        {/* View payment history button */}
        <TouchableOpacity style={styles.historyButton} onPress={() => navigation.navigate("PaymentHistory")}>
          <Text style={styles.historyButtonText}>View payment history</Text>
        </TouchableOpacity>

        {/* Month filter chips */}
        {monthsWithData.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthChipsScroll}>
            <View style={styles.chipsRow}>
              {monthsWithData.map((m) => {
                const isSelected = m === selectedMonth;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => handleSelectMonth(m)}
                  >
                    <Text
                      style={[styles.chipText, isSelected && styles.chipTextSelected]}
                    >
                      {MONTH_NAMES[m - 1]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

const colors = {
  bgScreen: "#fcfcfd",
  bgSecondary: "#ffffff",
  bgPrimary: "#f3f4f6",
  bgPrimaryMedium: "#e5e7eb",
  bgPrimaryStronger: "#1e2939",
  borderBase: "#e5e7eb",
  borderMedium: "#d1d5dc",
  borderStronger: "#1e2939",
  textHeading: "#101828",
  textBody: "#4a5565",
  textSubtle: "#6a7282",
  textDisabled: "#9ea5b3",
  textLight: "#ffffff",
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
    marginBottom: 20,
    letterSpacing: -0.75,
    lineHeight: 34,
  },
  // Payout method card
  payoutCard: {
    marginHorizontal: 20,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderBase,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  payoutHeader: {
    gap: 8,
    alignItems: "center",
  },
  payoutTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textHeading,
    lineHeight: 24,
    textAlign: "center",
  },
  payoutDesc: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textBody,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 256,
  },
  payoutButton: {
    backgroundColor: colors.bgPrimary,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
  },
  payoutButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textHeading,
    letterSpacing: 0.175,
    lineHeight: 22,
  },
  // Earnings card
  earningsCard: {
    marginHorizontal: 20,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderBase,
    borderRadius: 16,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    gap: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  earningsAmountSection: {
    gap: 8,
    alignItems: "center",
    width: "100%",
  },
  earningsLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textBody,
    lineHeight: 22,
    textAlign: "center",
  },
  earningsAmount: {
    fontSize: 48,
    fontWeight: "700",
    color: colors.textHeading,
    lineHeight: 48,
    letterSpacing: -1.2,
    textAlign: "center",
  },
  // Details row
  detailsRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.borderBase,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    overflow: "hidden",
    width: "100%",
  },
  detailItem: {
    flex: 1,
    gap: 4,
    alignItems: "center",
  },
  detailAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textHeading,
    lineHeight: 24,
    letterSpacing: 0.08,
    textAlign: "center",
    width: "100%",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSubtle,
    lineHeight: 16,
    letterSpacing: 0.12,
    textAlign: "center",
    width: "100%",
  },
  detailDivider: {
    width: 1,
    backgroundColor: colors.bgPrimaryMedium,
    alignSelf: "stretch",
  },
  // Monthly section
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textHeading,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  barsScroll: {
    paddingLeft: 20,
    marginBottom: 16,
  },
  barsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
    height: 120,
    paddingRight: 20,
  },
  barColumn: {
    alignItems: "center",
    gap: 8,
    width: 83,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 4,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    letterSpacing: 0.12,
    textAlign: "center",
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 16,
    letterSpacing: 0.14,
    textAlign: "center",
  },
  // Day chips
  chipsScroll: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bgSecondary,
  },
  chipSelected: {
    borderWidth: 2,
    borderColor: colors.borderStronger,
    backgroundColor: colors.bgScreen,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textHeading,
    lineHeight: 22,
    letterSpacing: 0.175,
    textAlign: "center",
  },
  chipTextSelected: {
    color: colors.textHeading,
  },
  // Day details
  dayDetailsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.borderBase,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  dayDetailLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSubtle,
    lineHeight: 16,
    letterSpacing: 0.12,
    textAlign: "center",
    width: "100%",
  },
  dayDetailAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textHeading,
    lineHeight: 24,
    letterSpacing: 0.08,
    textAlign: "center",
    width: "100%",
  },
  // History button
  historyButton: {
    marginHorizontal: 20,
    backgroundColor: colors.bgPrimary,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textHeading,
    letterSpacing: 0.175,
    lineHeight: 22,
  },
  // Month filter chips
  monthChipsScroll: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
});
