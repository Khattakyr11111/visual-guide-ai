import { FlatList, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { alertLevelCopy, demoCues } from "@/lib/awareness";

export default function HistoryScreen() {
  return (
    <ScreenContainer className="px-5 pt-4">
      <View style={styles.header}><View><Text style={styles.kicker}>AWARENESS LOG</Text><Text style={styles.title}>Recent cues</Text></View><View style={styles.countBadge}><Text style={styles.countText}>{demoCues.length}</Text></View></View>
      <Text style={styles.intro}>A short record of what the local awareness layer noticed. These cues are not a map, route, or guarantee.</Text>
      <FlatList data={demoCues} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => {
        const level = alertLevelCopy[item.level];
        return <View style={styles.card}><View style={[styles.icon, { backgroundColor: level.color }]}><IconSymbol name={item.level === "clear" ? "check" : "warning"} size={20} color="#08111F" /></View><View style={styles.copy}><View style={styles.row}><Text style={styles.label}>{item.label}</Text><Text style={styles.time}>{item.timestamp}</Text></View><Text style={styles.message}>{item.message}</Text><Text style={styles.meta}>{item.direction} · {item.confidence}</Text></View></View>;
      }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  kicker: { color: "#37B6FF", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: "#F5F8FC", fontSize: 30, fontWeight: "800", marginTop: 4 },
  countBadge: { width: 42, height: 42, borderRadius: 15, backgroundColor: "#102238", alignItems: "center", justifyContent: "center" },
  countText: { color: "#65E6B0", fontSize: 17, fontWeight: "800" },
  intro: { color: "#AAB8C8", fontSize: 15, lineHeight: 22, marginBottom: 8 },
  list: { gap: 12, paddingVertical: 16 },
  card: { flexDirection: "row", gap: 13, backgroundColor: "#102238", borderRadius: 19, padding: 16, borderWidth: 1, borderColor: "#233A52" },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  label: { color: "#F5F8FC", fontSize: 15, fontWeight: "800" },
  time: { color: "#6F8398", fontSize: 12 },
  message: { color: "#E2EAF2", fontSize: 14, lineHeight: 20 },
  meta: { color: "#AAB8C8", fontSize: 12 },
});
