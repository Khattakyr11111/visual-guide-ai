import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  LANGUAGE_OPTIONS,
  loadSettings,
  saveSettings,
  type AppSettings,
  type LanguageCode,
} from "@/lib/app-state";
import {
  INITIAL_PERMISSION_STATE,
  readPermissionState,
  requestPermission,
  type PermissionKey,
  type PermissionState,
} from "@/lib/permissions";
import { speakCue } from "@/lib/speech";

const permissionOrder: PermissionKey[] = ["location", "camera", "notifications", "motion"];
const permissionCopy: Record<PermissionKey, { title: string; body: string; icon: "location-on" | "photo-camera" | "notifications-active" | "explore" }> = {
  location: {
    title: "Location",
    body: "Used to show your position and share a temporary live location with a trusted guardian for up to one hour.",
    icon: "location-on",
  },
  camera: {
    title: "Camera",
    body: "Used to notice objects, paths, signs, and products in front of you. Camera frames are only used when you ask for a check.",
    icon: "photo-camera",
  },
  notifications: {
    title: "Safety notifications",
    body: "Used for important sharing and safety status updates. You can keep spoken guidance on even if notifications are off.",
    icon: "notifications-active",
  },
  motion: {
    title: "Motion awareness",
    body: "Uses the phone’s motion and orientation sensors to improve direction changes and detect when you may have stopped. Android does not show a separate permission prompt for this sensor access.",
    icon: "explore",
  },
};

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [permissions, setPermissions] = useState<PermissionState>(INITIAL_PERMISSION_STATE);

  useEffect(() => {
    let mounted = true;
    void Promise.all([loadSettings(), readPermissionState()]).then(([saved, currentPermissions]) => {
      if (!mounted) return;
      setSettings(saved);
      setPermissions(currentPermissions);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!settings) {
    return (
      <View style={styles.loading} accessibilityRole="progressbar" accessibilityLabel="Loading Vision Guide AI setup">
        <ActivityIndicator color="#F6C453" size="large" />
        <Text style={styles.loadingText}>Preparing your guidance setup</Text>
      </View>
    );
  }

  if (settings.completedOnboarding) return <>{children}</>;

  return (
    <OnboardingScreen
      initialSettings={settings}
      permissions={permissions}
      onComplete={async (nextSettings) => {
        await saveSettings({ ...nextSettings, completedOnboarding: true });
        setSettings({ ...nextSettings, completedOnboarding: true });
      }}
      onPermissionChange={(key, value) => setPermissions((previous) => ({ ...previous, [key]: value }))}
    />
  );
}

function OnboardingScreen({
  initialSettings,
  permissions,
  onComplete,
  onPermissionChange,
}: {
  initialSettings: AppSettings;
  permissions: PermissionState;
  onComplete: (settings: AppSettings) => Promise<void>;
  onPermissionChange: (key: PermissionKey, value: PermissionState[PermissionKey]) => void;
}) {
  const [page, setPage] = useState(0);
  const [language, setLanguage] = useState<LanguageCode>(initialSettings.language);
  const [speechEnabled, setSpeechEnabled] = useState(initialSettings.speechEnabled);
  const [helperName, setHelperName] = useState(initialSettings.helperName);
  const [permissionIndex, setPermissionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const currentPermission = permissionOrder[permissionIndex];
  const currentPermissionState = permissions[currentPermission];
  const copy = permissionCopy[currentPermission];
  const selectedLanguageLabel = useMemo(
    () => LANGUAGE_OPTIONS.find((item) => item.code === language)?.label ?? "English",
    [language],
  );

  const goNext = () => setPage((previous) => Math.min(previous + 1, 3));
  const allowCurrent = async () => {
    const result = await requestPermission(currentPermission);
    onPermissionChange(currentPermission, result);
  };
  const nextPermission = () => {
    if (permissionIndex < permissionOrder.length - 1) {
      setPermissionIndex((previous) => previous + 1);
      return;
    }
    goNext();
  };
  const finish = async () => {
    setSaving(true);
    await onComplete({
      ...initialSettings,
      language,
      speechEnabled,
      helperName: helperName.trim(),
      hapticsEnabled: true,
      conciseGuidance: true,
    });
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#071321]" className="px-5">
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.logoMark} accessibilityLabel="Visual Guide AI logo"><Image source={require("@/assets/images/visual-guide-mark.png")} style={styles.logoImage} /></View>
          <Text style={styles.wordmark}>VISUAL GUIDE AI</Text>
          <Text style={styles.stepText} accessibilityLabel={`Setup step ${page + 1} of 4`}>{page + 1}/4</Text>
        </View>

        {page === 0 && (
          <View style={styles.page}>
            <View style={styles.heroIcon}><IconSymbol name="navigation" size={44} color="#071321" /></View>
            <Text style={styles.eyebrow}>WELCOME TO SAFER STEPS</Text>
            <Text style={styles.title}>A second sense for the world around you.</Text>
            <Text style={styles.body}>Vision Guide AI listens to visual cues and turns them into short, calm spoken guidance. A sighted helper can set this up once, then the user can make the important choices by voice, touch, or haptics.</Text>
            <View style={styles.promiseCard} accessible accessibilityLabel="Safety boundary: this app is an awareness aid, not a replacement for a cane, guide dog, or trained guide">
              <IconSymbol name="shield.fill" size={22} color="#F6C453" />
              <Text style={styles.promiseText}>Awareness aid, not a replacement for a cane, guide dog, or trusted human support.</Text>
            </View>
            <Pressable onPress={goNext} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Begin setup" accessibilityHint="Choose language and safety permissions">
              <Text style={styles.primaryText}>Begin setup</Text><IconSymbol name="arrow-forward" size={21} color="#071321" />
            </Pressable>
          </View>
        )}

        {page === 1 && (
          <View style={styles.page}>
            <Text style={styles.eyebrow}>HELPER SETUP</Text>
            <Text style={styles.title}>Choose the voice before handing over the phone.</Text>
            <Text style={styles.body}>The user can change this later in Settings. The app will speak short cues in this language.</Text>
            <Text style={styles.fieldLabel}>Preferred language</Text>
            <View style={styles.languageGrid}>
              {LANGUAGE_OPTIONS.map((option) => {
                const selected = option.code === language;
                return (
                  <Pressable key={option.code} onPress={() => setLanguage(option.code)} style={[styles.languageButton, selected && styles.languageButtonSelected]} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={option.label}>
                    <Text style={[styles.languageText, selected && styles.languageTextSelected]}>{option.label}</Text>
                    {selected && <IconSymbol name="check-circle" size={20} color="#071321" />}
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.fieldLabel}>Helper name (optional)</Text>
            <TextInput value={helperName} onChangeText={setHelperName} placeholder="For example, Sara" placeholderTextColor="#8095AA" style={styles.input} accessibilityLabel="Helper name" />
            <Pressable onPress={() => { setSpeechEnabled((value) => !value); speakCue("ready", language, !speechEnabled); }} style={styles.preferenceRow} accessibilityRole="switch" accessibilityState={{ checked: speechEnabled }} accessibilityLabel="Spoken guidance">
              <View style={styles.preferenceIcon}><IconSymbol name="volume-up" size={20} color="#77E3B2" /></View>
              <View style={styles.preferenceCopy}><Text style={styles.preferenceTitle}>Spoken guidance</Text><Text style={styles.preferenceBody}>{speechEnabled ? `On in ${selectedLanguageLabel}` : "Off"}</Text></View>
              <View style={[styles.toggle, speechEnabled && styles.toggleOn]}><View style={[styles.toggleKnob, speechEnabled && styles.toggleKnobOn]} /></View>
            </Pressable>
            <Pressable onPress={goNext} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Continue to permissions"><Text style={styles.primaryText}>Continue</Text><IconSymbol name="arrow-forward" size={21} color="#071321" /></Pressable>
          </View>
        )}

        {page === 2 && (
          <View style={styles.page}>
            <View style={styles.permissionProgress}><View style={[styles.permissionProgressFill, { width: `${((permissionIndex + 1) / permissionOrder.length) * 100}%` }]} /></View>
            <Text style={styles.eyebrow}>STEP {permissionIndex + 1} OF {permissionOrder.length} · ALLOW ACCESS</Text>
            <View style={styles.permissionIcon}><IconSymbol name={copy.icon} size={34} color="#071321" /></View>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.body}>{copy.body}</Text>
            <View style={styles.statusCard} accessibilityLiveRegion="polite"><View style={[styles.statusDot, currentPermissionState === "granted" && styles.statusGranted]} /><Text style={styles.statusText}>{currentPermissionState === "granted" ? "Access allowed" : currentPermissionState === "unavailable" ? "Not available in this preview" : "Waiting for your choice"}</Text></View>
            <Pressable onPress={allowCurrent} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`Allow ${copy.title}`}><Text style={styles.primaryText}>{currentPermissionState === "granted" ? "Check again" : "Allow access"}</Text><IconSymbol name="arrow-forward" size={21} color="#071321" /></Pressable>
            <Pressable onPress={nextPermission} style={styles.secondaryButton} accessibilityRole="button" accessibilityLabel="Skip this permission"><Text style={styles.secondaryText}>{currentPermissionState === "granted" ? "Next step" : "Not now"}</Text></Pressable>
            <Text style={styles.permissionNote}>You can review these choices later in Android Settings and inside Vision Guide AI Settings.</Text>
          </View>
        )}

        {page === 3 && (
          <View style={styles.page}>
            <View style={styles.heroIcon}><IconSymbol name="check-circle" size={42} color="#071321" /></View>
            <Text style={styles.eyebrow}>READY FOR THE FIRST WALK</Text>
            <Text style={styles.title}>Your Safe-Step setup is complete.</Text>
            <Text style={styles.body}>The home screen will show your live position when available. Start Safe-Step only when you are ready to pause, listen, and verify each cue.</Text>
            <View style={styles.summaryCard}>
              <SummaryRow label="Spoken language" value={selectedLanguageLabel} />
              <SummaryRow label="Location sharing" value="Up to 1 hour" />
              <SummaryRow label="Guidance style" value="Safe-Step confidence" />
              <SummaryRow label="Helper" value={helperName.trim() || "Not named"} />
            </View>
            <Pressable onPress={finish} disabled={saving} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]} accessibilityRole="button" accessibilityLabel="Finish setup and open Safe-Step"><Text style={styles.primaryText}>{saving ? "Saving setup…" : "Open Safe-Step"}</Text><IconSymbol name="arrow-forward" size={21} color="#071321" /></Pressable>
            <Text style={styles.permissionNote}>For safety, keep using your normal mobility support and stop if the phone distracts you.</Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#071321", alignItems: "center", justifyContent: "center", gap: 16 },
  loadingText: { color: "#F4F7FB", fontSize: 16, fontWeight: "700" },
  container: { flex: 1, paddingTop: 8 },
  topBar: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  logoMark: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#F5F8FC", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoImage: { width: 40, height: 40, resizeMode: "contain" },
  wordmark: { flex: 1, color: "#F6C453", fontSize: 12, letterSpacing: 1.4, fontWeight: "900" },
  stepText: { color: "#8EA4B8", fontSize: 13, fontWeight: "800" },
  page: { flex: 1, justifyContent: "center", gap: 16, paddingVertical: 8 },
  heroIcon: { width: 78, height: 78, borderRadius: 28, backgroundColor: "#F6C453", alignItems: "center", justifyContent: "center", marginBottom: 5 },
  eyebrow: { color: "#77E3B2", fontSize: 11, letterSpacing: 1.7, fontWeight: "900" },
  title: { color: "#F4F7FB", fontSize: 33, lineHeight: 39, fontWeight: "900", maxWidth: 390 },
  body: { color: "#B5C4D2", fontSize: 16, lineHeight: 24 },
  promiseCard: { flexDirection: "row", gap: 11, alignItems: "center", backgroundColor: "#25271E", borderWidth: 1, borderColor: "#66592B", borderRadius: 18, padding: 15 },
  promiseText: { flex: 1, color: "#F6D88A", fontSize: 14, lineHeight: 20, fontWeight: "700" },
  primaryButton: { minHeight: 62, borderRadius: 20, backgroundColor: "#F6C453", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 18, marginTop: 8 },
  primaryText: { color: "#071321", fontSize: 17, fontWeight: "900" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  fieldLabel: { color: "#F4F7FB", fontSize: 14, fontWeight: "800", marginTop: 3 },
  languageGrid: { gap: 9 },
  languageButton: { minHeight: 52, borderRadius: 15, borderWidth: 1, borderColor: "#2B455B", backgroundColor: "#102238", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  languageButtonSelected: { backgroundColor: "#F6C453", borderColor: "#F6C453" },
  languageText: { color: "#F4F7FB", fontSize: 16, fontWeight: "800" },
  languageTextSelected: { color: "#071321" },
  input: { minHeight: 52, borderRadius: 15, borderWidth: 1, borderColor: "#2B455B", backgroundColor: "#102238", color: "#F4F7FB", paddingHorizontal: 15, fontSize: 16 },
  preferenceRow: { minHeight: 64, borderRadius: 17, borderWidth: 1, borderColor: "#2B455B", backgroundColor: "#102238", flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  preferenceIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#1B3B3C", alignItems: "center", justifyContent: "center" },
  preferenceCopy: { flex: 1, gap: 3 },
  preferenceTitle: { color: "#F4F7FB", fontSize: 15, fontWeight: "800" },
  preferenceBody: { color: "#8EA4B8", fontSize: 12 },
  toggle: { width: 45, height: 27, borderRadius: 18, backgroundColor: "#344A5F", padding: 3, justifyContent: "center" },
  toggleOn: { backgroundColor: "#77E3B2" },
  toggleKnob: { width: 21, height: 21, borderRadius: 11, backgroundColor: "#B5C4D2" },
  toggleKnobOn: { alignSelf: "flex-end", backgroundColor: "#071321" },
  permissionProgress: { height: 6, backgroundColor: "#20384E", borderRadius: 4, overflow: "hidden", marginBottom: 4 },
  permissionProgressFill: { height: "100%", backgroundColor: "#77E3B2", borderRadius: 4 },
  permissionIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: "#F6C453", alignItems: "center", justifyContent: "center", marginTop: 7 },
  statusCard: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#2B455B", backgroundColor: "#102238", borderRadius: 17, padding: 15 },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#F6C453" },
  statusGranted: { backgroundColor: "#77E3B2" },
  statusText: { color: "#F4F7FB", fontSize: 15, fontWeight: "800" },
  secondaryButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, borderWidth: 1, borderColor: "#2B455B" },
  secondaryText: { color: "#B5C4D2", fontSize: 15, fontWeight: "800" },
  permissionNote: { color: "#8095AA", fontSize: 12, lineHeight: 18, textAlign: "center" },
  summaryCard: { backgroundColor: "#102238", borderRadius: 19, borderWidth: 1, borderColor: "#2B455B", paddingHorizontal: 16 },
  summaryRow: { minHeight: 50, borderBottomWidth: 1, borderBottomColor: "#20384E", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  summaryLabel: { color: "#8EA4B8", fontSize: 14 },
  summaryValue: { color: "#F4F7FB", fontSize: 14, fontWeight: "800", flexShrink: 1, textAlign: "right" },
  disabled: { opacity: 0.55 },
});
