import AsyncStorage from "@react-native-async-storage/async-storage";

export type LanguageCode = "en" | "es" | "hi" | "ur";

export type AppSettings = {
  completedOnboarding: boolean;
  language: LanguageCode;
  speechEnabled: boolean;
  hapticsEnabled: boolean;
  conciseGuidance: boolean;
  helperName: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  completedOnboarding: false,
  language: "en",
  speechEnabled: true,
  hapticsEnabled: true,
  conciseGuidance: true,
  helperName: "",
};

export const SETTINGS_KEY = "visualguide.settings.v2";

export const LANGUAGE_OPTIONS: Array<{ code: LanguageCode; label: string; locale: string }> = [
  { code: "en", label: "English", locale: "en-US" },
  { code: "es", label: "Español", locale: "es-ES" },
  { code: "hi", label: "हिन्दी", locale: "hi-IN" },
  { code: "ur", label: "اردو", locale: "ur-PK" },
];

export async function loadSettings(): Promise<AppSettings> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } as AppSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await loadSettings();
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function languageLabel(code: LanguageCode) {
  return LANGUAGE_OPTIONS.find((option) => option.code === code)?.label ?? "English";
}
