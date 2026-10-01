import { AIReportResult, PriorityLevel } from "../types/report";

/**
 * Sanitizes markdown code blocks from raw AI string response
 */
export function sanitizeJsonResponse(rawText: string): string {
  if (!rawText) return "";
  return rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

/**
 * Validates and normalizes raw JSON or parsed object into strict AIReportResult
 */
export function validateAndNormalizeAIResult(
  rawData: unknown,
  inputLocation?: string,
  inputDescription?: string,
  hasImage?: boolean
): AIReportResult {
  let parsed: Record<string, any> = {};

  if (typeof rawData === "string") {
    const cleaned = sanitizeJsonResponse(rawData);
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      throw new Error("AI trả về dữ liệu không hợp lệ.");
    }
  } else if (typeof rawData === "object" && rawData !== null) {
    parsed = rawData as Record<string, any>;
  } else {
    throw new Error("AI trả về dữ liệu không hợp lệ.");
  }

  // Priority validation
  let priority: PriorityLevel = "Medium";
  if (
    parsed.priority === "High" ||
    parsed.priority === "Medium" ||
    parsed.priority === "Low"
  ) {
    priority = parsed.priority;
  } else if (typeof parsed.priority === "string") {
    const lowerP = parsed.priority.toLowerCase();
    if (lowerP.includes("high") || lowerP.includes("cao")) priority = "High";
    else if (lowerP.includes("low") || lowerP.includes("thấp")) priority = "Low";
  }

  // Confidence score clamping [0.0 - 1.0]
  let confidence = 0.85;
  if (typeof parsed.confidence === "number" && !isNaN(parsed.confidence)) {
    confidence = Math.min(1.0, Math.max(0.0, parsed.confidence));
  }

  // Missing Information Array
  const missingInformationSet = new Set<string>();
  if (Array.isArray(parsed.missingInformation)) {
    parsed.missingInformation.forEach((item) => {
      if (typeof item === "string" && item.trim().length > 0) {
        missingInformationSet.add(item.trim());
      }
    });
  }

  // Anti-Hallucination & Location check
  let location = typeof parsed.location === "string" && parsed.location.trim()
    ? parsed.location.trim()
    : "";

  // If user provided location explicitly, use it
  if (inputLocation && inputLocation.trim()) {
    location = inputLocation.trim();
  }

  // If location is unknown, empty or generic default without user hint, flag missing info
  const isUnknownLocation =
    !location ||
    location.toLowerCase() === "unknown" ||
    location.toLowerCase() === "chưa xác định" ||
    location.toLowerCase() === "unspecified";

  if (isUnknownLocation) {
    location = "Chưa xác định";
    missingInformationSet.add("Vị trí hiện trường");
  }

  // Check if description is too short / vague
  const descText = (inputDescription || "").trim();
  if (descText.length > 0 && descText.length < 8 && !hasImage) {
    missingInformationSet.add("Chi tiết mô tả sự cố (Mô tả quá ngắn)");
  }

  const result: AIReportResult = {
    category:
      typeof parsed.category === "string" && parsed.category.trim()
        ? parsed.category.trim()
        : "Hư hỏng thiết bị",
    location: location,
    priority: priority,
    issue:
      typeof parsed.issue === "string" && parsed.issue.trim()
        ? parsed.issue.trim()
        : descText || "Sự cố ghi nhận hiện trường",
    suggestedAction:
      typeof parsed.suggestedAction === "string" && parsed.suggestedAction.trim()
        ? parsed.suggestedAction.trim()
        : "Cử nhân viên kỹ thuật kiểm tra và khắc phục sự cố.",
    summary:
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : `Báo cáo hiện trường tại ${location}. Cần kiểm tra xử lý.`,
    confidence: Number(confidence.toFixed(2)),
    missingInformation: Array.from(missingInformationSet),
  };

  return result;
}
