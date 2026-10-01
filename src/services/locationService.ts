import * as Location from "expo-location";
import { LocationData } from "../types/report";

export type LocationResult =
  | { success: true; location: LocationData }
  | { success: false; error: "PERMISSION_DENIED" | "UNAVAILABLE" | "ERROR"; message: string };

export const locationService = {
  /**
   * Request location permission and get current device GPS coordinates
   */
  async getCurrentLocation(): Promise<LocationResult> {
    try {
      // 1. Request foreground permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== "granted") {
        return {
          success: false,
          error: "PERMISSION_DENIED",
          message:
            "Không thể lấy vị trí hiện tại.\n\nBạn vẫn có thể tạo báo cáo bằng cách nhập vị trí thủ công.",
        };
      }

      // 2. Fetch current GPS position with reasonable accuracy and timeout
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6)),
        accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : undefined,
        timestamp: new Date(position.timestamp).toISOString(),
      };

      return {
        success: true,
        location: locationData,
      };
    } catch (error) {
      console.warn("Lỗi khi lấy vị trí GPS:", error);
      return {
        success: false,
        error: "UNAVAILABLE",
        message:
          "Dịch vụ GPS hiện không khả dụng trên thiết bị này. Bạn vẫn có thể nhập vị trí thủ công.",
      };
    }
  },
};
