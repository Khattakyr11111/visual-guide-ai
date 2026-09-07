import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function PrivacyScreen() {
  return (
    <ScreenContainer className="px-5 pt-4" containerClassName="bg-[#071321]">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>VISUAL GUIDE AI</Text>
        <Text style={styles.title}>Privacy policy</Text>
        <Text style={styles.updated}>Draft for release review · Replace the contact placeholders before publishing</Text>

        <Section title="Who operates this app">Visual Guide AI is operated by [YOUR LEGAL NAME OR COMPANY]. Privacy contact: [YOUR PRIVACY EMAIL].</Section>
        <Section title="What the app accesses">With your permission, the app can access foreground location, camera frames when you request a camera check, Android notifications, and motion/orientation sensors. Speech output is generated on the device through the Android speech engine.</Section>
        <Section title="How location is used">Foreground location is used to show your position, open Android Maps, and update a temporary guardian-sharing session. A guardian share is designed to last for a maximum of one hour and can be stopped earlier by the user. Do not share a session with anyone you do not trust.</Section>
        <Section title="How camera images are used">A camera image is captured only after the user asks for a scene or product answer. The image and question are sent to the Visual Guide AI server-side multimodal service to generate a short response. Do not point the camera at private documents, payment cards, passwords, or people without permission.</Section>
        <Section title="Sharing and retention">The current prototype stores active guardian sessions in server memory and does not promise durable retention. A production deployment must document its actual storage, access controls, deletion behavior, and retention period here before release. Camera images should be deleted after processing unless the published service explicitly explains a different retention period.</Section>
        <Section title="Security">The production service should use encrypted transport, authenticated server infrastructure, access controls, rate limiting, and monitoring. No app can guarantee absolute security; keep the app and Android system updated.</Section>
        <Section title="Deletion and questions">For privacy questions or deletion requests, contact [YOUR PRIVACY EMAIL]. Replace this placeholder with a monitored address and publish this policy at a stable HTTPS URL before submitting the app to Google Play.</Section>
        <View style={styles.notice}><Text style={styles.noticeTitle}>Important safety boundary</Text><Text style={styles.noticeBody}>Visual Guide AI is an awareness aid. It can miss or misunderstand objects and location context. Keep using your normal mobility support and verify every cue before moving.</Text></View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.body}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  kicker: { color: "#4CC9FF", fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: "#F5F8FC", fontSize: 30, fontWeight: "900", marginTop: 4 },
  updated: { color: "#F6C453", fontSize: 12, lineHeight: 18, marginTop: 10 },
  section: { marginTop: 22, gap: 7 },
  sectionTitle: { color: "#F5F8FC", fontSize: 17, fontWeight: "900" },
  body: { color: "#B5C4D2", fontSize: 14, lineHeight: 22 },
  notice: { marginTop: 24, padding: 16, borderRadius: 18, backgroundColor: "#29291F", borderWidth: 1, borderColor: "#66592B" },
  noticeTitle: { color: "#F6C453", fontSize: 14, fontWeight: "900" },
  noticeBody: { color: "#E1D6AE", fontSize: 13, lineHeight: 19, marginTop: 6 },
});
