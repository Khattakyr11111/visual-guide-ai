import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";

function formatCoordinate(value: number | null | undefined) {
  return typeof value === "number" ? value.toFixed(5) : "Waiting";
}

export default function GuardianShareScreen() {
  const params = useLocalSearchParams<{ sessionId: string; token?: string | string[] }>();
  const sessionId = params.sessionId;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const enabled = Boolean(sessionId && token);
  const share = trpc.share.get.useQuery({ sessionId: sessionId ?? "missing", token: token ?? "missing" }, { enabled, refetchInterval: 5000 });
  const remaining = useMemo(() => share.data?.active ? Math.max(0, Math.ceil((share.data.expiresAt - Date.now()) / 60000)) : 0, [share.data]);

  if (!enabled) return <ShareMessage title="Invalid share link" body="This guardian link is missing its temporary access token." />;
  if (share.isLoading) return <View style={styles.loading}><ActivityIndicator size="large" color="#F6C453" /><Text style={styles.loadingText}>Connecting to live location…</Text></View>;
  if (share.error || !share.data?.active) return <ShareMessage title="Sharing is no longer active" body="The one-hour link may have expired or the user may have stopped sharing." />;

  const latitude = share.data.latitude;
  const longitude = share.data.longitude;
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#071321]" className="px-5">
      <View style={styles.content}>
        <View style={styles.brandRow}><View style={styles.logo}><IconSymbol name="eye.fill" size={22} color="#071321" /></View><View><Text style={styles.eyebrow}>VISUAL GUIDE AI</Text><Text style={styles.title}>Trusted guardian view</Text></View></View>
        <View style={styles.activeCard}><View style={styles.activeDot} /><Text style={styles.activeText}>Live sharing active · about {remaining} min left</Text></View>
        <View style={styles.mapPanel}><View style={styles.mapGridOne} /><View style={styles.mapGridTwo} /><View style={styles.mapRoadA} /><View style={styles.mapRoadB} /><View style={styles.mapPin}><IconSymbol name="my-location" size={22} color="#071321" /></View></View>
        <View style={styles.coordinateCard}><Text style={styles.cardLabel}>LATEST POSITION</Text><Text style={styles.coordinate}>{formatCoordinate(latitude)}, {formatCoordinate(longitude)}</Text><Text style={styles.secondary}>Accuracy about {share.data.accuracy ? `${Math.round(share.data.accuracy)} m` : "pending"} · Updates every few seconds while the app is connected.</Text></View>
        <View style={styles.notice}><IconSymbol name="shield.fill" size={20} color="#F6C453" /><Text style={styles.noticeText}>This link is temporary. It is designed for one trusted person and stops after one hour or when the user taps Stop.</Text></View>
      </View>
    </ScreenContainer>
  );
}

function ShareMessage({ title, body }: { title: string; body: string }) {
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#071321]" className="px-5"><View style={styles.message}><View style={styles.logo}><IconSymbol name="shield.fill" size={22} color="#071321" /></View><Text style={styles.title}>{title}</Text><Text style={styles.secondary}>{body}</Text></View></ScreenContainer>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#071321", alignItems: "center", justifyContent: "center", gap: 14 },
  loadingText: { color: "#F5F8FC", fontSize: 16, fontWeight: "800" },
  content: { flex: 1, paddingTop: 14, gap: 16 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#F6C453", alignItems: "center", justifyContent: "center" },
  eyebrow: { color: "#4CC9FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: "#F5F8FC", fontSize: 27, lineHeight: 33, fontWeight: "900", marginTop: 2 },
  activeCard: { flexDirection: "row", alignItems: "center", gap: 9, padding: 15, borderRadius: 17, backgroundColor: "#173134", borderWidth: 1, borderColor: "#2F5E59" },
  activeDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: "#77E3B2" },
  activeText: { color: "#B5D7CF", fontSize: 14, fontWeight: "800" },
  mapPanel: { flex: 1, minHeight: 300, borderRadius: 24, overflow: "hidden", backgroundColor: "#142D37", position: "relative" },
  mapGridOne: { position: "absolute", left: "30%", top: -80, width: 2, height: "140%", backgroundColor: "#31505B", transform: [{ rotate: "24deg" }] },
  mapGridTwo: { position: "absolute", right: "28%", top: -80, width: 2, height: "140%", backgroundColor: "#31505B", transform: [{ rotate: "-32deg" }] },
  mapRoadA: { position: "absolute", left: "-10%", top: "47%", width: "125%", height: 5, backgroundColor: "#4B6E70", transform: [{ rotate: "-17deg" }] },
  mapRoadB: { position: "absolute", left: "-7%", top: "65%", width: "120%", height: 5, backgroundColor: "#4B6E70", transform: [{ rotate: "20deg" }] },
  mapPin: { position: "absolute", left: "47%", top: "44%", width: 44, height: 44, borderRadius: 22, backgroundColor: "#F6C453", alignItems: "center", justifyContent: "center", borderWidth: 5, borderColor: "#F6E6AA" },
  coordinateCard: { backgroundColor: "#102238", borderRadius: 19, padding: 16, borderWidth: 1, borderColor: "#2B455B", gap: 6 },
  cardLabel: { color: "#77E3B2", fontSize: 10, letterSpacing: 1.4, fontWeight: "900" },
  coordinate: { color: "#F5F8FC", fontSize: 24, fontWeight: "900" },
  secondary: { color: "#8EA4B8", fontSize: 13, lineHeight: 19 },
  notice: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 18, backgroundColor: "#29291F", borderWidth: 1, borderColor: "#66592B" },
  noticeText: { flex: 1, color: "#E1D6AE", fontSize: 13, lineHeight: 19 },
  message: { flex: 1, alignItems: "flex-start", justifyContent: "center", gap: 16 },
});
