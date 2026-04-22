import { Text } from "react-native";

const ICON_MAP: Record<string, string> = {
  "chevron-back": "\u2039",
  "chevron-forward": "\u203A",
  checkmark: "\u2713",
  close: "\u2715",
};

type Props = {
  name: string;
  size?: number;
  color?: string;
};

export function Ionicons({ name, size = 20, color = "#000" }: Props) {
  return (
    <Text
      style={{
        fontSize: size,
        color,
        lineHeight: size + 2,
        textAlign: "center",
        fontWeight: "700",
      }}
    >
      {ICON_MAP[name] || "?"}
    </Text>
  );
}
