import AsyncStorage from "@react-native-async-storage/async-storage";
import { FieldReport } from "../types/report";

const STORAGE_KEY = "@ai_field_assistant_reports";

// Initial sample report translated to Vietnamese as specified in prompt section 12
const SAMPLE_REPORT: FieldReport = {
  id: "sample-report-001",
  imageUri: undefined,
  category: "Hư hỏng thiết bị",
  location: "Khu vực Lễ tân",
  priority: "High",
  issue: "Máy điều hòa không hoạt động",
  suggestedAction: "Gửi nhân viên bảo trì đến kiểm tra và khắc phục",
  summary: "Máy điều hòa tại khu vực lễ tân không hoạt động khiến khách hàng cảm thấy khó chịu.",
  createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
};

export const storageService = {
  /**
   * Retrieve all saved reports, sorted by createdAt descending.
   * Auto-seeds with sample report on first launch if storage is empty.
   */
  async getReports(): Promise<FieldReport[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue !== null) {
        const reports: FieldReport[] = JSON.parse(jsonValue);
        return reports.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else {
        // Initial seed
        const initialReports = [SAMPLE_REPORT];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialReports));
        return initialReports;
      }
    } catch (error) {
      console.error("Lỗi khi tải báo cáo từ AsyncStorage:", error);
      return [SAMPLE_REPORT];
    }
  },

  /**
   * Get a single report by ID
   */
  async getReportById(id: string): Promise<FieldReport | null> {
    const reports = await this.getReports();
    return reports.find((r) => r.id === id) || null;
  },

  /**
   * Save a new report to local storage
   */
  async saveReport(
    reportData: Omit<FieldReport, "id" | "createdAt"> & { id?: string; createdAt?: string }
  ): Promise<FieldReport> {
    try {
      const reports = await this.getReports();
      const newReport: FieldReport = {
        ...reportData,
        id: reportData.id || `report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: reportData.createdAt || new Date().toISOString(),
      };

      // Check if report with same ID exists (update case)
      const existingIndex = reports.findIndex((r) => r.id === newReport.id);
      let updatedReports: FieldReport[];

      if (existingIndex >= 0) {
        updatedReports = [...reports];
        updatedReports[existingIndex] = newReport;
      } else {
        updatedReports = [newReport, ...reports];
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReports));
      return newReport;
    } catch (error) {
      console.error("Lỗi khi lưu báo cáo vào AsyncStorage:", error);
      throw new Error("Không thể lưu báo cáo vào bộ nhớ thiết bị.");
    }
  },

  /**
   * Update an existing report
   */
  async updateReport(updatedReport: FieldReport): Promise<FieldReport> {
    try {
      const reports = await this.getReports();
      const index = reports.findIndex((r) => r.id === updatedReport.id);
      if (index === -1) {
        throw new Error("Không tìm thấy báo cáo");
      }
      reports[index] = updatedReport;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
      return updatedReport;
    } catch (error) {
      console.error("Lỗi khi cập nhật báo cáo trong AsyncStorage:", error);
      throw error;
    }
  },

  /**
   * Delete a report by ID
   */
  async deleteReport(id: string): Promise<void> {
    try {
      const reports = await this.getReports();
      const filtered = reports.filter((r) => r.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Lỗi khi xóa báo cáo từ AsyncStorage:", error);
      throw new Error("Không thể xóa báo cáo.");
    }
  },

  /**
   * Clear all reports (for testing / reset)
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Lỗi khi xóa bộ nhớ AsyncStorage:", error);
    }
  },
};
