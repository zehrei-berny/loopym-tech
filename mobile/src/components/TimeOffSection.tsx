import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { api, AvailabilityResponse, TimeOff } from "../api";
import { Ionicons } from "../icons";

const BRAND = "#072929";
const BG_PRIMARY = "#f3f4f6";
const BG_SECONDARY = "#ffffff";
const BORDER_BASE = "#e5e7eb";
const TEXT_HEADING = "#101828";
const TEXT_BODY = "#4a5565";
const TEXT_SUBTLE = "#6a7282";
const TEXT_DISABLED = "#9ea5b3";

type Props = {
  timeOffs: TimeOff[];
  onDataUpdate: (data: AvailabilityResponse) => void;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(d: Date): string {
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function TimeOffSection({ timeOffs, onDataUpdate }: Props) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(0); // January
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleDaySelect = (day: number) => {
    const selected = new Date(viewYear, viewMonth, day);
    if (!startDate || (startDate && endDate)) {
      setStartDate(selected);
      setEndDate(null);
    } else {
      if (selected < startDate) {
        setEndDate(startDate);
        setStartDate(selected);
      } else {
        setEndDate(selected);
      }
    }
  };

  const isInRange = (day: number): boolean => {
    if (!startDate || !endDate) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d >= startDate && d <= endDate;
  };

  const isStart = (day: number): boolean => {
    if (!startDate) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d.getTime() === startDate.getTime();
  };

  const isEnd = (day: number): boolean => {
    if (!endDate) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d.getTime() === endDate.getTime();
  };

  const handleSubmitTimeOff = async () => {
    if (!startDate) return;
    const end = endDate || startDate;
    const days = daysBetween(startDate, end);
    const result = await api.createTimeOff(
      formatDate(startDate),
      formatDate(end),
      days
    );
    onDataUpdate(result);
    setShowCalendar(false);
    setStartDate(null);
    setEndDate(null);
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleCancelTimeOff = async (id: string) => {
    const result = await api.cancelTimeOff(id);
    onDataUpdate(result);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  // Build calendar grid
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const selectionLabel =
    startDate && endDate
      ? `${formatDate(startDate)} - ${formatDate(endDate)} - ${daysBetween(startDate, endDate)} days`
      : startDate
        ? formatDate(startDate)
        : "Select dates";

  return (
    <View style={styles.wrapper}>
      {/* Time off button / card */}
      <View style={styles.timeOffCard}>
        <Pressable
          style={styles.timeOffButton}
          onPress={() => setShowCalendar(!showCalendar)}
        >
          <Text style={styles.timeOffButtonText}>Time off</Text>
        </Pressable>

        {/* Existing time off entries */}
        {timeOffs.map((to) => (
          <View key={to.id} style={styles.existingTimeOff}>
            <View style={styles.existingTimeOffInfo}>
              <Text style={styles.dateLabel}>Date(s)</Text>
              <Text style={styles.dateValue}>
                {to.startDate} - {to.endDate} - {to.days} days
              </Text>
            </View>
            <View style={styles.existingTimeOffActions}>
              <Pressable
                style={styles.editButton}
                onPress={() => setShowCalendar(true)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
              <Pressable
                style={styles.cancelButton}
                onPress={() => handleCancelTimeOff(to.id)}
              >
                <Text style={styles.cancelButtonText}>Cancel time off</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {/* Calendar dropdown */}
        {showCalendar && (
          <View style={styles.calendar}>
            {/* Selection display */}
            <View style={styles.selectionSection}>
              <Text style={styles.dateLabel}>Date(s)</Text>
              <Text style={styles.dateValue}>{selectionLabel}</Text>
            </View>

            {/* Month/Year controls */}
            <View style={styles.monthControls}>
              <Pressable
                style={styles.monthButton}
                onPress={() => {
                  if (viewMonth === 0) {
                    setViewMonth(11);
                    setViewYear(viewYear - 1);
                  } else {
                    setViewMonth(viewMonth - 1);
                  }
                }}
              >
                <Ionicons name="chevron-back" size={16} color={TEXT_HEADING} />
              </Pressable>
              <Text style={styles.monthLabel}>{viewYear}</Text>
              <Pressable
                style={styles.monthButton}
                onPress={() => {
                  if (viewMonth === 11) {
                    setViewMonth(0);
                    setViewYear(viewYear + 1);
                  } else {
                    setViewMonth(viewMonth + 1);
                  }
                }}
              >
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={TEXT_HEADING}
                />
              </Pressable>
            </View>

            {/* Day of week headers */}
            <View style={styles.dayHeaders}>
              {DAY_LABELS.map((d) => (
                <Text key={d} style={styles.dayHeader}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Month label */}
            <Text style={styles.calendarMonthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>

            {/* Calendar grid */}
            {weeks.map((week, wi) => (
              <View key={wi} style={styles.calendarWeek}>
                {week.map((day, di) => {
                  if (day === null) {
                    return <View key={di} style={styles.calendarCell} />;
                  }
                  const inRange = isInRange(day);
                  const start = isStart(day);
                  const end = isEnd(day);
                  const isSelected = start || end;

                  return (
                    <Pressable
                      key={di}
                      style={[
                        styles.calendarCell,
                        inRange && !isSelected && styles.calendarCellInRange,
                        start && styles.calendarCellStart,
                        end && styles.calendarCellEnd,
                      ]}
                      onPress={() => handleDaySelect(day)}
                    >
                      <Text
                        style={[
                          styles.calendarDay,
                          inRange && !isSelected && styles.calendarDayInRange,
                          isSelected && styles.calendarDaySelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            {/* Action buttons */}
            <View style={styles.calendarActions}>
              <Pressable style={styles.clearButton} onPress={handleClear}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.submitButton,
                  !startDate && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitTimeOff}
                disabled={!startDate}
              >
                <Text style={styles.submitButtonText}>Submit time off</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 0,
  },
  timeOffCard: {
    backgroundColor: BG_SECONDARY,
    borderWidth: 1,
    borderColor: BORDER_BASE,
    borderRadius: 16,
    padding: 12,
    gap: 16,
  },
  timeOffButton: {
    backgroundColor: BG_PRIMARY,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  timeOffButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_HEADING,
    lineHeight: 24,
  },
  existingTimeOff: {
    gap: 16,
  },
  existingTimeOffInfo: {
    gap: 8,
  },
  existingTimeOffActions: {
    flexDirection: "row",
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_HEADING,
    lineHeight: 16,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "400",
    color: TEXT_HEADING,
    lineHeight: 22,
  },
  editButton: {
    flex: 1,
    backgroundColor: BG_PRIMARY,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: TEXT_HEADING,
    lineHeight: 22,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: BRAND,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
    lineHeight: 22,
  },

  // Calendar
  calendar: {
    backgroundColor: BG_SECONDARY,
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  selectionSection: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER_BASE,
    paddingBottom: 12,
    gap: 8,
  },
  monthControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthButton: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: BORDER_BASE,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: TEXT_HEADING,
    lineHeight: 22,
    textAlign: "center",
  },
  dayHeaders: {
    flexDirection: "row",
  },
  dayHeader: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    color: TEXT_BODY,
    lineHeight: 16,
    textAlign: "center",
  },
  calendarMonthLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: TEXT_HEADING,
    lineHeight: 22,
  },
  calendarWeek: {
    flexDirection: "row",
  },
  calendarCell: {
    flex: 1,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  calendarCellInRange: {
    backgroundColor: BG_PRIMARY,
    borderRadius: 0,
  },
  calendarCellStart: {
    backgroundColor: BRAND,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  calendarCellEnd: {
    backgroundColor: BRAND,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  calendarDay: {
    fontSize: 12,
    fontWeight: "500",
    color: TEXT_BODY,
    lineHeight: 16,
    textAlign: "center",
  },
  calendarDayInRange: {
    color: TEXT_HEADING,
  },
  calendarDaySelected: {
    color: "#fff",
  },
  calendarActions: {
    flexDirection: "row",
    gap: 12,
  },
  clearButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5dc",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: TEXT_HEADING,
    lineHeight: 22,
  },
  submitButton: {
    flex: 1,
    backgroundColor: BRAND,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
    lineHeight: 22,
  },
});
