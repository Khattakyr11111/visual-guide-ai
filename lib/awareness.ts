export type AlertLevel = "clear" | "notice" | "caution" | "urgent";

export type DetectionCue = {
  id: string;
  label: string;
  direction: string;
  level: AlertLevel;
  confidence: string;
  message: string;
  timestamp: string;
};

export const demoCues: DetectionCue[] = [
  {
    id: "cue-1",
    label: "Person",
    direction: "ahead",
    level: "notice",
    confidence: "High confidence",
    message: "Possible person ahead",
    timestamp: "Just now",
  },
  {
    id: "cue-2",
    label: "Object",
    direction: "to your right",
    level: "caution",
    confidence: "Medium confidence",
    message: "Possible object to your right",
    timestamp: "12 sec ago",
  },
  {
    id: "cue-3",
    label: "Clear area",
    direction: "ahead",
    level: "clear",
    confidence: "Scene check",
    message: "No important obstacle cue",
    timestamp: "28 sec ago",
  },
];

export const alertLevelCopy: Record<AlertLevel, { title: string; color: string }> = {
  clear: { title: "Clear check", color: "#65E6B0" },
  notice: { title: "Notice", color: "#37B6FF" },
  caution: { title: "Caution", color: "#FFC857" },
  urgent: { title: "Urgent cue", color: "#FF6B6B" },
};

export function getDemoCue(index: number): DetectionCue {
  return demoCues[index % demoCues.length];
}
