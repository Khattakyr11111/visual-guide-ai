import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Linking, Platform, Pressable, ScrollView, Share as NativeShare, StyleSheet, Text, TextInput, View } from "react-native";
import Constants from "expo-constants";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { DeviceMotion } from "expo-sensors";
import { useKeepAwake } from "expo-keep-awake";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { loadSettings, type AppSettings } from "@/lib/app-state";
import { speak, speakCue } from "@/lib/speech";
import { trpc } from "@/lib/trpc";

type CueLevel = "ready" | "clear" | "notice" | "caution" | "urgent";
type Cue = { level: CueLevel; title: string; message: string; confidence: string; color: string };

const cueForText = (text: string): Cue => {
  const lower = text.toLowerCase();
  if (lower.includes("clear") || lower.includes("nothing important")) {
    return { level: "clear", title: "Clear check", message: "No important obstacle cue detected", confidence: "Image check · verify with your mobility support", color: "#77E3B2" };
  }
  if (lower.includes("urgent") || lower.includes("danger") || lower.includes("stop")) {
    return { level: "urgent", title: "Pause now", message: "Possible urgent cue in the scene", confidence: "Low certainty · pause and re-check", color: "#FF7777" };
  }
  return { level: "caution", title: "Re-check", message: "Possible object or change ahead", confidence: "Image check · move only after verifying", color: "#F6C453" };
};

function formatCoordinate(value: number | undefined) {
  return typeof value === "number" ? value.toFixed(5) : "Waiting";
}

function formatTime(timestamp: number | undefined) {
  if (!timestamp) return "Waiting for a fix";
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AwarenessScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionResponse | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState("");
  const [isSafeStepActive, setIsSafeStepActive] = useState(false);
  const [motionStable, setMotionStable] = useState(true);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [question, setQuestion] = useState("What is in front of me?");
  const [answer, setAnswer] = useState("");
  const [cue, setCue] = useState<Cue>({ level: "ready", title: "Ready for a safe step", message: "Start Safe-Step when you are ready to pause, listen, and verify.", confidence: "Camera and motion checks are on demand", color: "#8EA4B8" });
  const [shareSession, setShareSession] = useState<{ id: string; token: string; expiresAt: number } | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState("");
  const [now, setNow] = useState(Date.now());
  const cameraRef = useRef<CameraView>(null);
  const shareUpdate = trpc.share.update.useMutation();
  const shareStart = trpc.share.start.useMutation();
  const shareStop = trpc.share.stop.useMutation();
  const describeImage = trpc.vision.describe.useMutation();

  useEffect(() => {
    let mounted = true;
    void loadSettings().then((saved) => mounted && setSettings(saved));
    void Location.getForegroundPermissionsAsync().then((permission) => mounted && setLocationPermission(permission));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!locationPermission?.granted) return;
    let mounted = true;
    let subscription: Location.LocationSubscription | undefined;
    void Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then((next) => mounted && setLocation(next))
      .catch(() => mounted && setLocationError("Location fix unavailable. Please pause and check Android Location."));
    void Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 5, timeInterval: 5000 },
      (next) => mounted && setLocation(next),
    ).then((nextSubscription) => {
      if (mounted) subscription = nextSubscription;
      else nextSubscription.remove();
    }).catch(() => mounted && setLocationError("Live location could not start."));
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, [locationPermission?.granted]);

  useEffect(() => {
    if (Platform.OS === "web") {
      setMotionStable(true);
      return;
    }
    DeviceMotion.setUpdateInterval(1000);
    const subscription = DeviceMotion.addListener((data) => {
      const rotation = data.rotationRate;
      if (!rotation) return;
      const movement = Math.abs(rotation.alpha ?? 0) + Math.abs(rotation.beta ?? 0) + Math.abs(rotation.gamma ?? 0);
      setMotionStable(movement < 2.2);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!shareSession || !location) return;
    shareUpdate.mutate({
      sessionId: shareSession.id,
      token: shareSession.token,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    });
  }, [location, shareSession, shareUpdate]);

  useEffect(() => {
    if (!shareSession) return;
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= shareSession.expiresAt) {
        setShareSession(null);
        speakCue("stopped", settings?.language ?? "en", settings?.speechEnabled ?? true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [shareSession, settings]);

  const remainingMinutes = useMemo(() => {
    if (!shareSession) return 0;
    return Math.max(0, Math.ceil((shareSession.expiresAt - now) / 60000));
  }, [shareSession, now]);

  const language = settings?.language ?? "en";
  const speechEnabled = settings?.speechEnabled ?? true;
  const shareBaseUrl = Constants.expoConfig?.extra?.publicShareBaseUrl ?? "https://visualguide.ai";

  const toggleSafeStep = () => {
    const next = !isSafeStepActive;
    setIsSafeStepActive(next);
    if (next) {
      speakCue("ready", language, speechEnabled);
      setCue({ level: "notice", title: "Safe-Step active", message: "Pause, point the camera forward, and check before moving.", confidence: motionStable ? "Motion steady · awaiting a scene check" : "Phone movement detected · pause and hold steady", color: "#4CC9FF" });
    } else {
      speakCue("stopped", language, speechEnabled);
      setCue({ level: "ready", title: "Safe-Step paused", message: "Start again when you are ready to listen and verify.", confidence: "No active guidance session", color: "#8EA4B8" });
    }
    if (settings?.hapticsEnabled !== false) void Haptics.impactAsync(next ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  };

  const openMap = () => {
    if (!location) {
      speakCue("noLocation", language, speechEnabled);
      return;
    }
    const { latitude, longitude } = location.coords;
    void Linking.openURL(`geo:${latitude},${longitude}?q=${latitude},${longitude}`);
  };

  const findNearby = (place: string) => {
    if (!location) {
      speakCue("noLocation", language, speechEnabled);
      return;
    }
    const { latitude, longitude } = location.coords;
    speak(`Searching nearby for ${place}. Review the map result before moving.`, language, speechEnabled);
    void Linking.openURL(`geo:${latitude},${longitude}?q=${encodeURIComponent(place)}`);
  };

  const startSharing = async () => {
    if (!location) {
      setShareError("Wait for a live location fix before sharing.");
      speakCue("noLocation", language, speechEnabled);
      return;
    }
    setShareBusy(true);
    setShareError("");
    try {
      const session = await shareStart.mutateAsync();
      setShareSession(session);
      await shareUpdate.mutateAsync({
        sessionId: session.id,
        token: session.token,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });
      const link = `${shareBaseUrl.replace(/\/$/, "")}/share/${session.id}?token=${session.token}`;
      await NativeShare.share({ title: "Visual Guide AI live location", message: `My live location is available for one hour. Open this link to follow me: ${link}\n\nCurrent position: ${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}` });
      speakCue("sharing", language, speechEnabled);
    } catch {
      setShareError("Sharing could not start. Check your connection and try again.");
    } finally {
      setShareBusy(false);
    }
  };

  const stopSharing = async () => {
    if (!shareSession) return;
    setShareBusy(true);
    try {
      await shareStop.mutateAsync({ sessionId: shareSession.id, token: shareSession.token });
    } finally {
      setShareSession(null);
      setShareBusy(false);
      speakCue("stopped", language, speechEnabled);
    }
  };

  const runCameraCheck = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        setAnswer("Camera access is needed for an image check. You can allow it later in Android Settings.");
        return;
      }
    }
    if (!cameraVisible) {
      setCameraVisible(true);
      speakCue("cameraReady", language, speechEnabled);
      return;
    }
    const picture = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.55, skipProcessing: true });
    if (!picture?.base64) {
      setAnswer("I could not capture the scene. Hold the phone steady and try again.");
      return;
    }
    setAnswer("Checking the scene…");
    try {
      const response = await describeImage.mutateAsync({ imageDataUri: `data:image/jpeg;base64,${picture.base64}`, question, language });
      setAnswer(response.text);
      const nextCue = cueForText(response.text);
      setCue(nextCue);
      speak(response.text, language, speechEnabled);
      if (settings?.hapticsEnabled !== false) {
        await Haptics.notificationAsync(nextCue.level === "urgent" ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      const fallback = "I could not reach the visual assistant. Pause and try again when you have a connection.";
      setAnswer(fallback);
      speak(fallback, language, speechEnabled);
    }
  };

  return (
    <ScreenContainer className="px-5 pt-3" containerClassName="bg-[#071321]">
      {Platform.OS !== "web" && <NativeKeepAwake />}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandImageWrap}><Image source={require("@/assets/images/visual-guide-logo.webp")} style={styles.brandImage} accessibilityLabel="Visual Guide AI logo" /></View>
            <View><Text style={styles.eyebrow}>VISUAL GUIDE AI</Text><Text style={styles.headerTitle}>Safe-Step home</Text></View>
          </View>
          <View style={styles.statusPill}><View style={[styles.statusDot, { backgroundColor: motionStable ? "#77E3B2" : "#F6C453" }]} /><Text style={styles.statusPillText}>{motionStable ? "Steady" : "Pause"}</Text></View>
        </View>

        <View style={[styles.heroCard, isSafeStepActive && styles.heroCardActive]} accessible accessibilityLabel={`${cue.title}. ${cue.message}. ${cue.confidence}`}>
          <View style={styles.heroTop}><View style={[styles.cueDot, { backgroundColor: cue.color }]} /><Text style={styles.heroKicker}>{isSafeStepActive ? "SAFE-STEP ACTIVE" : "READY TO WALK"}</Text><Text style={styles.confidenceBadge}>{cue.level.toUpperCase()}</Text></View>
          <Text style={styles.heroTitle}>{cue.title}</Text>
          <Text style={styles.heroMessage}>{cue.message}</Text>
          <View style={styles.heroDivider} />
          <Text style={styles.heroConfidence}>{cue.confidence}</Text>
        </View>

        <Pressable onPress={toggleSafeStep} style={({ pressed }) => [styles.primaryButton, isSafeStepActive && styles.stopButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={isSafeStepActive ? "Pause Safe-Step" : "Start Safe-Step"} accessibilityHint="Starts or pauses spoken safety guidance">
          <IconSymbol name={isSafeStepActive ? "pause-circle" : "play.fill"} size={23} color={isSafeStepActive ? "#F6C453" : "#071321"} />
          <Text style={[styles.primaryText, isSafeStepActive && styles.stopText]}>{isSafeStepActive ? "Pause Safe-Step" : "Start Safe-Step"}</Text>
        </Pressable>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Live position</Text><Text style={styles.sectionMeta}>{formatTime(location?.timestamp)}</Text></View>
        <View style={styles.locationCard} accessibilityLiveRegion="polite">
          <View style={styles.mapPanel}><View style={styles.mapGridOne} /><View style={styles.mapGridTwo} /><View style={styles.mapRoadA} /><View style={styles.mapRoadB} /><View style={styles.mapPin}><IconSymbol name="my-location" size={19} color="#071321" /></View></View>
          <View style={styles.locationDetails}><Text style={styles.locationTitle}>{location ? "You are here" : "Waiting for location"}</Text><Text style={styles.locationBody}>{location ? `${formatCoordinate(location.coords.latitude)}, ${formatCoordinate(location.coords.longitude)}` : locationError || "Allow Location to show your live position."}</Text><Text style={styles.locationAccuracy}>{location?.coords.accuracy ? `Accuracy about ${Math.round(location.coords.accuracy)} m` : "Location accuracy pending"}</Text></View>
          <Pressable onPress={openMap} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Open current location in Android maps"><IconSymbol name="map" size={20} color="#4CC9FF" /></Pressable>
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Trusted guardian</Text><Text style={styles.sectionMeta}>1 hour maximum</Text></View>
        <View style={styles.shareCard}>
          <View style={styles.shareIcon}><IconSymbol name="share" size={22} color="#071321" /></View>
          <View style={styles.shareCopy}><Text style={styles.shareTitle}>{shareSession ? `Sharing live · ${remainingMinutes} min left` : "Share your live position"}</Text><Text style={styles.shareBody}>{shareSession ? "Your guardian can follow the latest location until the timer ends." : "Create a temporary link for one trusted person. Sharing stops automatically after one hour."}</Text></View>
          <Pressable onPress={shareSession ? stopSharing : startSharing} disabled={shareBusy} style={({ pressed }) => [styles.shareButton, shareSession && styles.shareStopButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={shareSession ? "Stop live location sharing" : "Share live location for one hour"}><Text style={[styles.shareButtonText, shareSession && styles.shareStopText]}>{shareBusy ? "…" : shareSession ? "Stop" : "Share"}</Text></Pressable>
        </View>
        {!!shareError && <Text style={styles.errorText}>{shareError}</Text>}

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Find nearby</Text><Text style={styles.sectionMeta}>Open Android Maps</Text></View>
        <View style={styles.nearbyGrid}>
          {[['tree', 'Nature'], ['beach', 'Beach'], ['bench', 'Bench'], ['shopping mall', 'Market']].map(([place, label]) => <Pressable key={place} onPress={() => findNearby(place)} style={({ pressed }) => [styles.nearbyButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`Find a nearby ${label}`}><IconSymbol name="place" size={19} color="#77E3B2" /><Text style={styles.nearbyText}>{label}</Text></Pressable>)}
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Camera guide</Text><Text style={styles.sectionMeta}>Ask what you see</Text></View>
        <View style={styles.cameraCard}>
          {cameraVisible ? <View style={styles.cameraPreview}><CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" /><View style={styles.cameraOverlay}><Text style={styles.cameraHint}>Point forward. Hold steady.</Text></View></View> : <View style={styles.cameraEmpty}><IconSymbol name="photo-camera" size={28} color="#4CC9FF" /><Text style={styles.cameraEmptyTitle}>Scene and product questions</Text><Text style={styles.cameraEmptyBody}>Ask about an object, product label, sign, doorway, or what may need a pause-and-recheck.</Text></View>}
          <TextInput value={question} onChangeText={setQuestion} style={styles.questionInput} placeholder="What should I know about this?" placeholderTextColor="#8095AA" accessibilityLabel="Camera question" />
          <View style={styles.cameraActions}><Pressable onPress={runCameraCheck} disabled={describeImage.isPending} style={({ pressed }) => [styles.cameraButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={cameraVisible ? "Capture and ask the visual assistant" : "Open camera guidance"}><IconSymbol name="camera-alt" size={20} color="#071321" /><Text style={styles.cameraButtonText}>{describeImage.isPending ? "Listening…" : cameraVisible ? "Capture & answer" : "Open camera"}</Text></Pressable>{cameraVisible && <Pressable onPress={() => setCameraVisible(false)} style={styles.closeCameraButton} accessibilityRole="button" accessibilityLabel="Close camera preview"><Text style={styles.closeCameraText}>Close</Text></Pressable>}</View>
          {!!answer && <View style={styles.answerBox}><Text style={styles.answerLabel}>SPOKEN ANSWER</Text><Text style={styles.answerText}>{answer}</Text></View>}
        </View>

        <View style={styles.quickGrid}><View style={styles.quickCard}><IconSymbol name="volume-up" size={22} color="#4CC9FF" /><Text style={styles.quickTitle}>Voice</Text><Text style={styles.quickBody}>{settings ? `${settings.language.toUpperCase()} · ${speechEnabled ? "On" : "Off"}` : "Loading"}</Text></View><View style={styles.quickCard}><IconSymbol name="explore" size={22} color="#77E3B2" /><Text style={styles.quickTitle}>Motion</Text><Text style={styles.quickBody}>{motionStable ? "Phone steady" : "Pause and steady"}</Text></View></View>

        <View style={styles.boundaryCard}><View style={styles.boundaryIcon}><IconSymbol name="shield.fill" size={20} color="#F6C453" /></View><View style={styles.boundaryCopy}><Text style={styles.boundaryTitle}>A second sense, not a promise</Text><Text style={styles.boundaryBody}>Cues can be late or wrong. Keep using your cane, guide dog, or trusted support. Verify before every step.</Text></View></View>
      </ScrollView>
    </ScreenContainer>
  );
}

function NativeKeepAwake() {
  useKeepAwake();
  return null;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 34, gap: 15 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandImageWrap: { width: 46, height: 46, borderRadius: 15, backgroundColor: "#F5F8FC", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  brandImage: { width: 43, height: 43, resizeMode: "contain" },
  eyebrow: { color: "#4CC9FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  headerTitle: { color: "#F5F8FC", fontSize: 19, fontWeight: "800", marginTop: 2 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 18, backgroundColor: "#102238" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusPillText: { color: "#B5C4D2", fontSize: 11, fontWeight: "800" },
  heroCard: { backgroundColor: "#102238", borderRadius: 25, padding: 21, borderWidth: 1, borderColor: "#2B455B", minHeight: 216 },
  heroCardActive: { borderColor: "#4CC9FF" },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  cueDot: { width: 10, height: 10, borderRadius: 5 },
  heroKicker: { color: "#B5C4D2", fontSize: 11, letterSpacing: 1.4, fontWeight: "900", flex: 1 },
  confidenceBadge: { color: "#8095AA", fontSize: 10, fontWeight: "900" },
  heroTitle: { color: "#F5F8FC", fontSize: 29, lineHeight: 35, fontWeight: "900", marginTop: 20 },
  heroMessage: { color: "#B5C4D2", fontSize: 15, lineHeight: 22, marginTop: 9 },
  heroDivider: { height: 1, backgroundColor: "#2B455B", marginVertical: 16 },
  heroConfidence: { color: "#77E3B2", fontSize: 12, lineHeight: 18, fontWeight: "800" },
  primaryButton: { minHeight: 62, borderRadius: 20, backgroundColor: "#F6C453", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  stopButton: { backgroundColor: "#102238", borderWidth: 1, borderColor: "#F6C453" },
  primaryText: { color: "#071321", fontSize: 17, fontWeight: "900" },
  stopText: { color: "#F6C453" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 3 },
  sectionTitle: { color: "#F5F8FC", fontSize: 17, fontWeight: "900" },
  sectionMeta: { color: "#8095AA", fontSize: 11, fontWeight: "800" },
  locationCard: { backgroundColor: "#102238", borderRadius: 20, padding: 12, borderWidth: 1, borderColor: "#2B455B", flexDirection: "row", gap: 12, alignItems: "center" },
  mapPanel: { width: 94, height: 90, borderRadius: 15, overflow: "hidden", backgroundColor: "#142D37", position: "relative" },
  mapGridOne: { position: "absolute", left: 18, top: -10, width: 1, height: 120, backgroundColor: "#31505B", transform: [{ rotate: "26deg" }] },
  mapGridTwo: { position: "absolute", right: 24, top: -10, width: 1, height: 120, backgroundColor: "#31505B", transform: [{ rotate: "-34deg" }] },
  mapRoadA: { position: "absolute", left: -10, top: 43, width: 125, height: 2, backgroundColor: "#4B6E70", transform: [{ rotate: "-16deg" }] },
  mapRoadB: { position: "absolute", left: -4, top: 64, width: 118, height: 2, backgroundColor: "#4B6E70", transform: [{ rotate: "24deg" }] },
  mapPin: { position: "absolute", left: 35, top: 32, width: 27, height: 27, borderRadius: 14, backgroundColor: "#F6C453", alignItems: "center", justifyContent: "center" },
  locationDetails: { flex: 1, gap: 3 },
  locationTitle: { color: "#F5F8FC", fontSize: 15, fontWeight: "900" },
  locationBody: { color: "#4CC9FF", fontSize: 13, fontWeight: "800" },
  locationAccuracy: { color: "#8095AA", fontSize: 11 },
  iconButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#183550", alignItems: "center", justifyContent: "center" },
  shareCard: { backgroundColor: "#173134", borderRadius: 20, padding: 14, borderWidth: 1, borderColor: "#2F5E59", flexDirection: "row", alignItems: "center", gap: 11 },
  shareIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#77E3B2", alignItems: "center", justifyContent: "center" },
  shareCopy: { flex: 1, gap: 4 },
  shareTitle: { color: "#F5F8FC", fontSize: 14, fontWeight: "900" },
  shareBody: { color: "#B5D7CF", fontSize: 12, lineHeight: 17 },
  shareButton: { minWidth: 62, minHeight: 42, borderRadius: 13, backgroundColor: "#77E3B2", alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  shareStopButton: { backgroundColor: "#102238", borderWidth: 1, borderColor: "#FF7777" },
  shareButtonText: { color: "#071321", fontSize: 13, fontWeight: "900" },
  shareStopText: { color: "#FF7777" },
  errorText: { color: "#FF9999", fontSize: 12, lineHeight: 18 },
  nearbyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  nearbyButton: { width: "48%", minHeight: 49, borderRadius: 15, backgroundColor: "#102238", borderWidth: 1, borderColor: "#2B455B", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  nearbyText: { color: "#F5F8FC", fontSize: 13, fontWeight: "800" },
  cameraCard: { backgroundColor: "#102238", borderRadius: 20, padding: 13, borderWidth: 1, borderColor: "#2B455B", gap: 11 },
  cameraEmpty: { minHeight: 132, borderRadius: 16, borderWidth: 1, borderColor: "#2B455B", borderStyle: "dashed", alignItems: "center", justifyContent: "center", padding: 16, gap: 6 },
  cameraEmptyTitle: { color: "#F5F8FC", fontSize: 15, fontWeight: "900" },
  cameraEmptyBody: { color: "#8EA4B8", fontSize: 12, lineHeight: 18, textAlign: "center" },
  cameraPreview: { height: 184, borderRadius: 16, overflow: "hidden", backgroundColor: "#040B12", position: "relative" },
  cameraOverlay: { position: "absolute", left: 12, right: 12, bottom: 12, alignItems: "center" },
  cameraHint: { color: "#071321", backgroundColor: "#F6C453", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, fontSize: 12, fontWeight: "900" },
  questionInput: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: "#2B455B", backgroundColor: "#0B1928", color: "#F5F8FC", paddingHorizontal: 13, fontSize: 14 },
  cameraActions: { flexDirection: "row", gap: 9, alignItems: "center" },
  cameraButton: { flex: 1, minHeight: 49, borderRadius: 15, backgroundColor: "#4CC9FF", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  cameraButtonText: { color: "#071321", fontSize: 14, fontWeight: "900" },
  closeCameraButton: { minHeight: 49, paddingHorizontal: 13, borderRadius: 15, borderWidth: 1, borderColor: "#2B455B", alignItems: "center", justifyContent: "center" },
  closeCameraText: { color: "#B5C4D2", fontSize: 13, fontWeight: "800" },
  answerBox: { borderRadius: 15, backgroundColor: "#173134", borderWidth: 1, borderColor: "#2F5E59", padding: 13, gap: 5 },
  answerLabel: { color: "#77E3B2", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  answerText: { color: "#F5F8FC", fontSize: 14, lineHeight: 21 },
  quickGrid: { flexDirection: "row", gap: 11 },
  quickCard: { flex: 1, backgroundColor: "#102238", borderRadius: 17, padding: 14, borderWidth: 1, borderColor: "#2B455B", gap: 6 },
  quickTitle: { color: "#F5F8FC", fontSize: 14, fontWeight: "800" },
  quickBody: { color: "#77E3B2", fontSize: 12, fontWeight: "800" },
  boundaryCard: { flexDirection: "row", gap: 11, padding: 15, borderRadius: 19, backgroundColor: "#29291F", borderWidth: 1, borderColor: "#66592B" },
  boundaryIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#40371E", alignItems: "center", justifyContent: "center" },
  boundaryCopy: { flex: 1, gap: 4 },
  boundaryTitle: { color: "#F6C453", fontSize: 14, fontWeight: "900" },
  boundaryBody: { color: "#E1D6AE", fontSize: 12, lineHeight: 18 },
});
