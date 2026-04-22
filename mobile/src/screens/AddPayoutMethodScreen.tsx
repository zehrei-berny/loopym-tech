import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../api";

type Props = {
  navigation: any;
};

type MethodOption = {
  key: string;
  label: string;
  subtitle: string;
  fees: string;
  icon: string;
};

const METHOD_OPTIONS: MethodOption[] = [
  {
    key: "bank",
    label: "Bank account in AUSD",
    subtitle: "3-5 business days",
    fees: "No fees",
    icon: "🏦",
  },
  {
    key: "paypal",
    label: "PayPal in AUSD",
    subtitle: "3-5 business days",
    fees: "No fees",
    icon: "P",
  },
  {
    key: "wise",
    label: "Wise.com",
    subtitle: "3-5 business days",
    fees: "No fees",
    icon: "W",
  },
];

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

export default function AddPayoutMethodScreen({ navigation }: Props) {
  const [step, setStep] = useState<"select" | "form">("select");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [holderName, setHolderName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState<"savings" | "checking">(
    "savings"
  );
  const [submitting, setSubmitting] = useState(false);

  const selectedOption = METHOD_OPTIONS.find((o) => o.key === selectedType);

  const handleConfirmSelection = () => {
    if (!selectedType) return;
    if (selectedType === "bank") {
      setStep("form");
    } else {
      // For PayPal/Wise, just add directly with minimal info
      handleSubmit(selectedType);
    }
  };

  const handleSubmit = async (type?: string) => {
    const methodType = type || selectedType || "bank";
    const option = METHOD_OPTIONS.find((o) => o.key === methodType);

    if (methodType === "bank" && (!holderName || !routingNumber || !accountNumber)) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      await api.addPayoutMethod({
        type: methodType,
        label: option?.label || "Bank account in AUSD",
        currency: "AUSD",
        account_holder_name: holderName || "Account Holder",
        routing_number: routingNumber,
        account_number: accountNumber,
        account_type: accountType,
      });
      navigation.navigate("PayoutMethods", { added: true });
    } catch {
      Alert.alert("Error", "Failed to add payout method");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "form") {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.navHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep("select")}
            >
              <Text style={styles.backArrow}>{"←"}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.pageTitle}>Add payout method</Text>
          <Text style={styles.formSubtitle}>
            {selectedOption?.label || "Bank account in AUSD"}
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full name of account holder</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name of account holder"
                placeholderTextColor="#9ca3af"
                value={holderName}
                onChangeText={setHolderName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>BSB</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter routing number"
                placeholderTextColor="#9ca3af"
                value={routingNumber}
                onChangeText={setRoutingNumber}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Account number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account number"
                placeholderTextColor="#9ca3af"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Account type</Text>
              <TouchableOpacity
                style={styles.radioRow}
                onPress={() => setAccountType("savings")}
              >
                <RadioCircle active={accountType === "savings"} />
                <Text style={styles.radioLabel}>Savings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioRow}
                onPress={() => setAccountType("checking")}
              >
                <RadioCircle active={accountType === "checking"} />
                <Text style={styles.radioLabel}>Checking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Confirm button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!holderName || !routingNumber || !accountNumber) &&
                styles.confirmButtonDisabled,
            ]}
            onPress={() => handleSubmit()}
            disabled={
              submitting || !holderName || !routingNumber || !accountNumber
            }
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                style={[
                  styles.confirmButtonText,
                  (!holderName || !routingNumber || !accountNumber) &&
                    styles.confirmButtonTextDisabled,
                ]}
              >
                Confirm
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Selection step
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
        </View>

        <Text style={styles.pageTitle}>Add payout method</Text>
        <Text style={styles.selectSubtitle}>
          Let us know where you'd like us to send your money.
        </Text>

        {/* Options */}
        <View style={styles.optionsList}>
          {METHOD_OPTIONS.map((option) => {
            const isSelected = selectedType === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedType(option.key)}
              >
                <View style={styles.optionLeft}>
                  <View style={iconStyles.circle}>
                    <Text
                      style={[
                        iconStyles.text,
                        option.key === "paypal" && { color: "#003087" },
                        option.key === "wise" && {
                          color: "#9fe870",
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {option.icon}
                    </Text>
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Text style={styles.optionSubtitle}>
                      {option.subtitle}
                    </Text>
                    <Text style={styles.optionFees}>{option.fees}</Text>
                  </View>
                </View>
                <CheckCircle active={isSelected} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Confirm button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selectedType && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmSelection}
          disabled={!selectedType || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text
              style={[
                styles.confirmButtonText,
                !selectedType && styles.confirmButtonTextDisabled,
              ]}
            >
              Confirm
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  textDisabled: "#9ca3af",
  brandStrong: "#1e2939",
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgScreen,
  },
  scrollContent: {
    paddingBottom: 100,
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
    marginBottom: 8,
    letterSpacing: -0.75,
  },
  selectSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textBody,
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  formSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textHeading,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  // Options list
  optionsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  optionCard: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderBase,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionCardSelected: {
    borderColor: colors.borderActive,
    borderWidth: 2,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  optionInfo: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textHeading,
  },
  optionSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSubtle,
  },
  optionFees: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSubtle,
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
  input: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderBase,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgScreen,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: colors.borderBase,
  },
  confirmButton: {
    backgroundColor: colors.brandStrong,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: colors.bgPrimary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.2,
  },
  confirmButtonTextDisabled: {
    color: colors.textDisabled,
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
