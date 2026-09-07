import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { LANGUAGE_OPTIONS, loadSettings, saveSettings, type AppSettings, type LanguageCode } from "@/lib/app-state";
import { readPermissionState, requestPermission, type PermissionKey, type PermissionState } from "@/lib/permissions";
import { speakCue } from "@/lib/speech";

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [permissions, setPermissions] = useState<PermissionState | null>(null);
  const router = useRouter();

  useEffect(() => {
    void Promise.all([loadSettings(), readPermissionState()]).then(([saved, currentPermissions]) => {
      setSettings(saved);
      setPermissions(currentPermissions);
    });
  }, []);

  if (!settings || !permissions) {
    return <ScreenContainer className="px-5 pt-4"><Text style={styles.intro}>Loading your preferences…</Text></ScreenContainer>;
  }

  const update = async (patch: Partial<AppSettings>) => {
    const next = await saveSettings(patch);
    setSettings(next);
    if (next.hapticsEnabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const changeLanguage = async (language: LanguageCode) => {
    await update({ language });
    speakCue("ready", language, settings.speechEnabled);
  };

  const refreshPermission = async (key: PermissionKey) => {
    const result = await requestPermission(key);
    setPermissions((previous) => previous ? { ...previous, [key]: result } : previous);
  };

  return (
    <ScreenContainer className="px-5 pt-4">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>CONTROL YOUR CUES</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.intro}>A sighted helper can configure these choices once. The user can later change them with TalkBack, touch, or voice.</Text>

        <Text style={styles.sectionTitle}>Spoken language</Text>
        <View style={styles.languageGroup} accessibilityRole="radiogroup">
          {LANGUAGE_OPTIONS.map((option) => {
            const selected = settings.language === option.code;
            return <Pressable key={option.code} onPress={() => void changeLanguage(option.code)} style={[styles.languageRow, selected && styles.languageSelected]} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={option.label}><Text style={[styles.languageLabel, selected && styles.languageLabelSelected]}>{option.label}</Text>{selected && <Text style={styles.check}>Selected</Text>}</Pressable>;
          })}
        </View>

        <Text style={styles.sectionTitle}>Guidance behavior</Text>
        <View style={styles.group}>
          <SettingRow title="Spoken guidance" body="Read Safe-Step and camera answers aloud." value={settings.speechEnabled} onChange={(value) => void update({ speechEnabled: value })} />
          <SettingRow title="Haptic reinforcement" body="Use a light pulse for important state changes." value={settings.hapticsEnabled} onChange={(value) => void update({ hapticsEnabled: value })} />
          <SettingRow title="Concise Safe-Step" body="Keep walking cues short, calm, and easy to parse." value={settings.conciseGuidance} onChange={(value) => void update({ conciseGuidance: value })} last />
        </View>

        <Text style={styles.sectionTitle}>Android permissions</Text>
        <View style={styles.permissionGroup}>
          <PermissionRow label="Location" body="Live position and one-hour guardian sharing." status={permissions.location} onPress={() => void refreshPermission("location")} />
          <PermissionRow label="Camera" body="On-demand scene and product questions." status={permissions.camera} onPress={() => void refreshPermission("camera")} />
          <PermissionRow label="Notifications" body="Safety status and sharing reminders." status={permissions.notifications} onPress={() => void refreshPermission("notifications")} last />
        </View>

        <Pressable onPress={() => router.push("/privacy")} style={styles.privacyButton} accessibilityRole="button" accessibilityLabel="Open Visual Guide AI privacy policy"><Text style={styles.privacyButtonText}>Read privacy policy</Text></Pressable>
        <View style={styles.note}><Text style={styles.noteTitle}>Safe-Step boundary</Text><Text style={styles.noteBody}>Vision Guide AI describes possible cues. It cannot guarantee a clear or safe path. Keep using your normal mobility support and verify before every step.</Text></View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SettingRow({ title, body, value, onChange, last }: { title: string; body: string; value: boolean; onChange: (value: boolean) => void; last?: boolean }) {
  return <View style={[styles.row, last && styles.lastRow]}><View style={styles.copy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowBody}>{body}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ false: "#233A52", true: "#2479A8" }} thumbColor={value ? "#4CC9FF" : "#AAB8C8"} accessibilityLabel={title} /> </View>;
}

function PermissionRow({ label, body, status, onPress, last }: { label: string; body: string; status: PermissionState[PermissionKey]; onPress: () => void; last?: boolean }) {
  const labelForStatus = status === "granted" ? "Allowed" : status === "unavailable" ? "Unavailable" : status === "denied" ? "Blocked" : "Not set";
  return <View style={[styles.permissionRow, last && styles.lastRow]}><View style={styles.copy}><Text style={styles.rowTitle}>{label}</Text><Text style={styles.rowBody}>{body}</Text></View><Pressable onPress={onPress} style={[styles.permissionButton, status === "granted" && styles.permissionAllowed]} accessibilityRole="button" accessibilityLabel={`Review ${label} permission`}><Text style={[styles.permissionButtonText, status === "granted" && styles.permissionAllowedText]}>{labelForStatus}</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  kicker: { color: "#4CC9FF", fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: "#F5F8FC", fontSize: 30, fontWeight: "900", marginTop: 4 },
  intro: { color: "#B5C4D2", fontSize: 15, lineHeight: 22, marginTop: 12, marginBottom: 8 },
  sectionTitle: { color: "#F5F8FC", fontSize: 17, fontWeight: "900", marginTop: 22, marginBottom: 10 },
  languageGroup: { gap: 8 },
  languageRow: { minHeight: 49, borderRadius: 15, borderWidth: 1, borderColor: "#2B455B", backgroundColor: "#102238", paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  languageSelected: { backgroundColor: "#F6C453", borderColor: "#F6C453" },
  languageLabel: { color: "#F5F8FC", fontSize: 15, fontWeight: "800" },
  languageLabelSelected: { color: "#071321" },
  check: { color: "#071321", fontSize: 12, fontWeight: "900" },
  group: { backgroundColor: "#102238", borderRadius: 21, paddingHorizontal: 16, borderWidth: 1, borderColor: "#2B455B" },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: "#2B455B" },
  lastRow: { borderBottomWidth: 0 },
  copy: { flex: 1, gap: 4 },
  rowTitle: { color: "#F5F8FC", fontSize: 16, fontWeight: "800" },
  rowBody: { color: "#8EA4B8", fontSize: 13, lineHeight: 18 },
  permissionGroup: { backgroundColor: "#102238", borderRadius: 21, paddingHorizontal: 16, borderWidth: 1, borderColor: "#2B455B" },
  permissionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#2B455B" },
  permissionButton: { minWidth: 70, minHeight: 35, borderRadius: 11, borderWidth: 1, borderColor: "#F6C453", alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  permissionAllowed: { backgroundColor: "#173134", borderColor: "#77E3B2" },
  permissionButtonText: { color: "#F6C453", fontSize: 11, fontWeight: "900" },
  permissionAllowedText: { color: "#77E3B2" },
  privacyButton: { minHeight: 50, marginTop: 20, borderRadius: 15, borderWidth: 1, borderColor: "#4CC9FF", alignItems: "center", justifyContent: "center" },
  privacyButtonText: { color: "#4CC9FF", fontSize: 14, fontWeight: "900" },
  note: { marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: "#29291F", borderWidth: 1, borderColor: "#66592B" },
  noteTitle: { color: "#F6C453", fontSize: 14, fontWeight: "900" },
  noteBody: { color: "#E1D6AE", fontSize: 13, lineHeight: 19, marginTop: 5 },
});
