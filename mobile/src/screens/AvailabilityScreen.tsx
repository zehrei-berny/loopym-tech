import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, AvailabilityResponse, DaySlot } from "../api";
import { TimeOffSection } from "../components/TimeOffSection";
import { Ionicons } from "../icons";

const BRAND = "#072929";
const BRAND_TRACK = "#072929";
const TRACK_OFF = "#d1d5dc";
const BG_SCREEN = "#fcfcfd";
const BG_PRIMARY = "#f3f4f6";
const BG_SECONDARY = "#ffffff";
const BORDER_BASE = "#e5e7eb";
const BORDER_STRONG = "#9ea5b3";
const TEXT_HEADING = "#101828";
const TEXT_SUBTLE = "#6a7282";

type Props = {
  onBack?: () => void;
};

export default function AvailabilityScreen({ onBack }: Props) {
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const result = await api.getAvailability();
      setData(result);
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleDay = async (slot: DaySlot) => {
    const result = await api.updateDay(slot.day, { enabled: !slot.enabled });
    setData(result);
  };

  const handleDayPress = (slot: DaySlot) => {
    if (expandedDay === slot.day) {
      setExpandedDay(null);
    } else {
      setExpandedDay(slot.day);
      setEditStartTime(slot.startTime);
      setEditEndTime(slot.endTime);
    }
  };

  const handleSaveTime = async (day: string) => {
    const result = await api.updateDay(day, {
      startTime: editStartTime,
      endTime: editEndTime,
      enabled: true,
    });
    setData(result);
    setExpandedDay(null);
  };

  const handleApplyToAll = async (field: "startTime" | "endTime") => {
    if (!data) return;
    const value = field === "startTime" ? editStartTime : editEndTime;
    const updatedSlots = data.slots.map((s) => ({
      ...s,
      [field]: s.enabled ? value : s[field],
    }));
    const result = await api.updateAvailability(updatedSlots);
    setData(result);
  };

  const cycleTime = (current: string, direction: 1 | -1): string => {
    const timeOptions = [
      "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM",
      "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM",
      "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
      "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
      "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
      "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
      "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
      "8:00 PM", "8:30 PM", "9:00 PM",
    ];
    const idx = timeOptions.indexOf(current);
    if (idx === -1) return current;
    const next = idx + direction;
    if (next < 0 || next >= timeOptions.length) return current;
    return timeOptions[next];
  };

  const handleDataUpdate = (result: AvailabilityResponse) => {
    setData(result);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND} />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load availability</Text>
        <Pressable style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation header */}
        <View style={styles.navHeader}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={20} color={TEXT_HEADING} />
          </Pressable>
        </View>

        {/* Page title */}
        <Text style={styles.pageTitle}>Availability</Text>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>{data.summary}</Text>
          {data.timeOffs.length > 0 && (
            <>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryTimeOff}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryTimeOffLabel}>Time off</Text>
                  <Text style={styles.summaryTimeOffDates}>
                    {data.timeOffs[0].startDate} - {data.timeOffs[0].endDate} -{" "}
                    {data.timeOffs[0].days} days
                  </Text>
                </View>
                <Pressable
                  style={styles.editPill}
                  onPress={() => {
                    /* scroll to time off */
                  }}
                >
                  <Text style={styles.editPillText}>Edit</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        {/* Section title */}
        <Text style={styles.sectionTitle}>Edit your weekly availability</Text>

        {/* Day cards */}
        {data.slots.map((slot) => (
          <View key={slot.day} style={styles.dayCard}>
            <Pressable
              style={styles.dayRow}
              onPress={() => slot.enabled && handleDayPress(slot)}
            >
              <View style={styles.dayInfo}>
                <Text style={styles.dayName}>{slot.day}</Text>
                <Text style={styles.dayTime}>
                  {slot.enabled
                    ? `${slot.startTime} - ${slot.endTime}`
                    : "--"}
                </Text>
              </View>
              <Switch
                value={slot.enabled}
                onValueChange={() => handleToggleDay(slot)}
                trackColor={{ false: TRACK_OFF, true: BRAND_TRACK }}
                thumbColor="#fff"
                ios_backgroundColor={TRACK_OFF}
              />
            </Pressable>

            {/* Expanded edit view */}
            {expandedDay === slot.day && slot.enabled && (
              <View style={styles.editSection}>
                {/* Start time */}
                <View style={styles.timeRow}>
                  <View style={styles.timeInfo}>
                    <Text style={styles.timeLabel}>Start time</Text>
                    <View style={styles.timeValueRow}>
                      <Pressable
                        onPress={() =>
                          setEditStartTime(cycleTime(editStartTime, -1))
                        }
                      >
                        <Ionicons
                          name="chevron-back"
                          size={16}
                          color={TEXT_HEADING}
                        />
                      </Pressable>
                      <Text style={styles.timeValue}>{editStartTime}</Text>
                      <Pressable
                        onPress={() =>
                          setEditStartTime(cycleTime(editStartTime, 1))
                        }
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={TEXT_HEADING}
                        />
                      </Pressable>
                    </View>
                  </View>
                  <Pressable
                    style={styles.applyAllRow}
                    onPress={() => handleApplyToAll("startTime")}
                  >
                    <Text style={styles.applyAllText}>Apply to all days</Text>
                    <View style={styles.radioChecked}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  </Pressable>
                </View>

                {/* Divider */}
                <View style={styles.timeDivider} />

                {/* End time */}
                <View style={styles.timeRow}>
                  <View style={styles.timeInfo}>
                    <Text style={styles.timeLabel}>End time</Text>
                    <View style={styles.timeValueRow}>
                      <Pressable
                        onPress={() =>
                          setEditEndTime(cycleTime(editEndTime, -1))
                        }
                      >
                        <Ionicons
                          name="chevron-back"
                          size={16}
                          color={TEXT_HEADING}
                        />
                      </Pressable>
                      <Text style={styles.timeValue}>{editEndTime}</Text>
                      <Pressable
                        onPress={() =>
                          setEditEndTime(cycleTime(editEndTime, 1))
                        }
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={TEXT_HEADING}
                        />
                      </Pressable>
                    </View>
                  </View>
                  <Pressable
                    style={styles.applyAllRow}
                    onPress={() => handleApplyToAll("endTime")}
                  >
                    <Text style={styles.applyAllText}>Apply to all days</Text>
                    <View style={styles.radioChecked}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  </Pressable>
                </View>

                {/* Save button */}
                <Pressable
                  style={styles.saveButton}
                  onPress={() => handleSaveTime(slot.day)}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}

        {/* Time off section */}
        <TimeOffSection
          timeOffs={data.timeOffs}
          onDataUpdate={handleDataUpdate}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_SCREEN,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: BG_SCREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    color: TEXT_HEADING,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: BRAND,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // Nav
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: BG_PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },

  // Title
  pageTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: TEXT_HEADING,
    lineHeight: 34,
    letterSpacing: -0.75,
    marginTop: 16,
    marginBottom: 16,
  },

  // Summary card
  summaryCard: {
    backgroundColor: BG_SECONDARY,
    borderWidth: 1,
    borderColor: BORDER_STRONG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: "400",
    color: TEXT_HEADING,
    lineHeight: 22,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  summaryTimeOff: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  summaryTimeOffLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_HEADING,
    lineHeight: 16,
    marginBottom: 8,
  },
  summaryTimeOffDates: {
    fontSize: 14,
    fontWeight: "400",
    color: TEXT_HEADING,
    lineHeight: 22,
  },
  editPill: {
    backgroundColor: BG_PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  editPillText: {
    fontSize: 14,
    fontWeight: "500",
    color: TEXT_HEADING,
  },

  // Section title
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_HEADING,
    lineHeight: 20,
    letterSpacing: -0.16,
    marginBottom: 12,
  },

  // Day cards
  dayCard: {
    backgroundColor: BG_SECONDARY,
    borderWidth: 1,
    borderColor: BORDER_BASE,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  dayRow: {
    backgroundColor: BG_PRIMARY,
    borderRadius: 8,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  dayInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayName: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_HEADING,
    lineHeight: 16,
  },
  dayTime: {
    fontSize: 14,
    fontWeight: "400",
    color: TEXT_SUBTLE,
    lineHeight: 16,
  },

  // Edit section
  editSection: {
    marginTop: 12,
    gap: 16,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  timeInfo: {
    gap: 4,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_HEADING,
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  timeValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "400",
    color: TEXT_HEADING,
    lineHeight: 16,
    minWidth: 80,
    textAlign: "center",
  },
  applyAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  applyAllText: {
    fontSize: 14,
    fontWeight: "500",
    color: TEXT_HEADING,
    lineHeight: 16,
  },
  radioChecked: {
    width: 24,
    height: 24,
    borderRadius: 9999,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
  },
  timeDivider: {
    height: 1,
    backgroundColor: BORDER_BASE,
    marginHorizontal: 16,
  },
  saveButton: {
    backgroundColor: BRAND,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    marginHorizontal: 16,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
