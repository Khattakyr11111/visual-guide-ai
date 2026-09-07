import { Platform } from "react-native";
import { Camera } from "expo-camera";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

export type PermissionKey = "location" | "camera" | "notifications" | "motion";

export type PermissionState = Record<PermissionKey, "granted" | "denied" | "undetermined" | "unavailable">;

export const INITIAL_PERMISSION_STATE: PermissionState = {
  location: "undetermined",
  camera: "undetermined",
  notifications: "undetermined",
  motion: "granted",
};

export async function requestPermission(key: PermissionKey): Promise<PermissionState[PermissionKey]> {
  if (Platform.OS === "web") {
    return "unavailable";
  }

  try {
    if (key === "location") {
      const result = await Location.requestForegroundPermissionsAsync();
      return result.status === "granted" ? "granted" : "denied";
    }
    if (key === "camera") {
      const result = await Camera.requestCameraPermissionsAsync();
      return result.status === "granted" ? "granted" : "denied";
    }
    if (key === "notifications") {
      const result = await Notifications.requestPermissionsAsync();
      return result.granted ? "granted" : "denied";
    }
    return "granted";
  } catch {
    return "denied";
  }
}

export async function readPermissionState(): Promise<PermissionState> {
  if (Platform.OS === "web") return { ...INITIAL_PERMISSION_STATE, location: "unavailable", camera: "unavailable", notifications: "unavailable" };
  try {
    const [location, camera, notifications] = await Promise.all([
      Location.getForegroundPermissionsAsync(),
      Camera.getCameraPermissionsAsync(),
      Notifications.getPermissionsAsync(),
    ]);
    return {
      location: location.status === "granted" ? "granted" : location.status === "denied" ? "denied" : "undetermined",
      camera: camera.status === "granted" ? "granted" : camera.status === "denied" ? "denied" : "undetermined",
      notifications: notifications.granted ? "granted" : notifications.status === "denied" ? "denied" : "undetermined",
      motion: "granted",
    };
  } catch {
    return INITIAL_PERMISSION_STATE;
  }
}
