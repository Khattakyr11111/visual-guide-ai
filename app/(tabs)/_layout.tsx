import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: { paddingTop: 8, paddingBottom: bottomPadding, height: tabBarHeight, backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 0.5 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Awareness", tabBarIcon: ({ color }) => <IconSymbol name="eye.fill" color={color} size={25} /> }} />
      <Tabs.Screen name="history" options={{ title: "Cues", tabBarIcon: ({ color }) => <IconSymbol name="list.bullet" color={color} size={25} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color }) => <IconSymbol name="gearshape.fill" color={color} size={25} /> }} />
      <Tabs.Screen name="safety" options={{ title: "Safety", tabBarIcon: ({ color }) => <IconSymbol name="shield.fill" color={color} size={25} /> }} />
    </Tabs>
  );
}
