export type PriorityLevel = "Low" | "Medium" | "High";

export type AIProvider = "mock" | "gemini";

export type LocationData = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
};

export type AIReportInput = {
  imageUri?: string;
  description?: string;
  location?: string;
  gps?: LocationData;
  provider?: AIProvider;
};

export type AIReportResult = {
  category: string;
  location: string;
  priority: PriorityLevel;
  issue: string;
  suggestedAction: string;
  summary: string;
  confidence: number;
  missingInformation: string[];
};

// Kept backward-compatible with optional confidence, missingInformation, & gps
export type FieldReport = {
  id: string;
  imageUri?: string;
  description?: string;
  category: string;
  location: string;
  priority: PriorityLevel;
  issue: string;
  suggestedAction: string;
  summary: string;
  createdAt: string;
  confidence?: number;
  missingInformation?: string[];
  gps?: LocationData;
};

export type RootStackParamList = {
  Home: undefined;
  CreateReport: undefined;
  ReportResult: {
    analysisResult: AIReportResult;
    imageUri?: string;
    existingReportId?: string;
    gps?: LocationData;
  };
  History: undefined;
  ReportDetail: {
    reportId: string;
  };
};

/**
 * Helper utility to get Vietnamese display label for Priority
 */
export const getPriorityVietnameseLabel = (priority: PriorityLevel): string => {
  switch (priority) {
    case "High":
      return "Cao";
    case "Medium":
      return "Trung bình";
    case "Low":
    default:
      return "Thấp";
  }
};
