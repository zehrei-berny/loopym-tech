import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  navigation: any;
};

function WalletIcon() {
  return (
    <View style={iconStyles.box}>
      <Text style={iconStyles.emoji}>💳</Text>
    </View>
  );
}

function ReceiptIcon() {
  return (
    <View style={iconStyles.box}>
      <Text style={iconStyles.emoji}>🧾</Text>
    </View>
  );
}

function ChevronRight() {
  return <Text style={{ fontSize: 18, color: "#9ca3af" }}>{"›"}</Text>;
}

export default function PaymentsScreen({ navigation }: Props) {
  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>{"←"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.pageTitle}>Payments</Text>

      {/* Menu items */}
      <View style={styles.menuList}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("PayoutMethods")}
        >
          <View style={styles.menuLeft}>
            <WalletIcon />
            <Text style={styles.menuLabel}>Payout methods</Text>
          </View>
          <ChevronRight />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("PaymentHistory")}
        >
          <View style={styles.menuLeft}>
            <ReceiptIcon />
            <Text style={styles.menuLabel}>Payment history</Text>
          </View>
          <ChevronRight />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const colors = {
  bgScreen: "#fcfcfd",
  bgPrimary: "#f3f4f6",
  textHeading: "#101828",
  textBody: "#4a5565",
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgScreen,
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
    marginBottom: 24,
    letterSpacing: -0.75,
  },
  menuList: {
    paddingHorizontal: 20,
    gap: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textHeading,
  },
});

const iconStyles = StyleSheet.create({
  box: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 20,
  },
});
