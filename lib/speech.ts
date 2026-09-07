import * as Speech from "expo-speech";
import { LANGUAGE_OPTIONS, type LanguageCode } from "@/lib/app-state";

const localeFor = (language: LanguageCode) => LANGUAGE_OPTIONS.find((item) => item.code === language)?.locale ?? "en-US";

export const spoken = {
  en: {
    ready: "Safe-Step is ready. Keep your cane or guide support with you.",
    cameraReady: "Camera guidance is ready. Point the phone forward and move slowly.",
    clear: "Clear ahead. Continue carefully.",
    obstacleRight: "Caution. Possible obstacle slightly to your right. Pause and re-check.",
    obstacleLeft: "Caution. Possible obstacle slightly to your left. Pause and re-check.",
    sharing: "Your live location is being shared with your trusted guardian for one hour.",
    stopped: "Location sharing stopped.",
    noLocation: "Location is not available. Please stop and check your location permission.",
  },
  es: {
    ready: "Safe-Step está listo. Mantén contigo tu bastón o apoyo de guía.",
    cameraReady: "La guía de cámara está lista. Apunta el teléfono hacia delante y muévete despacio.",
    clear: "Camino despejado. Continúa con cuidado.",
    obstacleRight: "Precaución. Posible obstáculo a tu derecha. Detente y vuelve a comprobar.",
    obstacleLeft: "Precaución. Posible obstáculo a tu izquierda. Detente y vuelve a comprobar.",
    sharing: "Tu ubicación se comparte con tu persona de confianza durante una hora.",
    stopped: "La ubicación compartida se detuvo.",
    noLocation: "La ubicación no está disponible. Detente y revisa el permiso de ubicación.",
  },
  hi: {
    ready: "सेफ-स्टेप तैयार है। अपनी छड़ी या मार्गदर्शक सहायता साथ रखें।",
    cameraReady: "कैमरा मार्गदर्शन तैयार है। फोन को सामने रखें और धीरे चलें।",
    clear: "आगे रास्ता साफ है। सावधानी से आगे बढ़ें।",
    obstacleRight: "सावधान। दाईं ओर संभावित रुकावट है। रुककर फिर जांचें।",
    obstacleLeft: "सावधान। बाईं ओर संभावित रुकावट है। रुककर फिर जांचें।",
    sharing: "आपका लाइव स्थान एक घंटे के लिए आपके विश्वसनीय संरक्षक के साथ साझा किया जा रहा है।",
    stopped: "स्थान साझा करना बंद हो गया है।",
    noLocation: "स्थान उपलब्ध नहीं है। रुकें और स्थान अनुमति जांचें।",
  },
  ur: {
    ready: "سیف اسٹیپ تیار ہے۔ اپنی چھڑی یا رہنمائی کی مدد ساتھ رکھیں۔",
    cameraReady: "کیمرہ رہنمائی تیار ہے۔ فون سامنے رکھیں اور آہستہ چلیں۔",
    clear: "آگے راستہ صاف ہے۔ احتیاط سے چلیں۔",
    obstacleRight: "احتیاط۔ دائیں طرف ممکنہ رکاوٹ ہے۔ رک کر دوبارہ دیکھیں۔",
    obstacleLeft: "احتیاط۔ بائیں طرف ممکنہ رکاوٹ ہے۔ رک کر دوبارہ دیکھیں۔",
    sharing: "آپ کا لائیو مقام ایک گھنٹے کے لیے قابل اعتماد سرپرست کے ساتھ شیئر کیا جا رہا ہے۔",
    stopped: "مقام شیئر کرنا بند ہو گیا ہے۔",
    noLocation: "مقام دستیاب نہیں۔ رکیں اور مقام کی اجازت چیک کریں۔",
  },
} satisfies Record<LanguageCode, Record<string, string>>;

export function speak(text: string, language: LanguageCode, enabled = true) {
  if (!enabled) return;
  void Speech.stop();
  void Speech.speak(text, { language: localeFor(language), rate: 0.88, pitch: 1 });
}

export function speakCue(key: keyof typeof spoken.en, language: LanguageCode, enabled = true) {
  speak(spoken[language][key], language, enabled);
}
