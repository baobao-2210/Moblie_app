import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AIReportResult,
  AIReportInput,
  AIProvider,
  PriorityLevel,
} from "../types/report";
import { validateAndNormalizeAIResult } from "../utils/validation";

const GEMINI_API_KEY_STORAGE_KEY = "@ai_field_assistant_gemini_api_key";
const AI_PROVIDER_STORAGE_KEY = "@ai_field_assistant_ai_provider";

export interface AIServiceConfig {
  apiKey?: string;
  provider?: AIProvider;
  timeoutMs?: number;
}

/**
 * Utility to fetch and convert any image URI (Native file://, blob:, or data:) to Base64
 */
async function imageUriToBase64(uri: string): Promise<{ base64: string; mimeType: string }> {
  if (uri.startsWith("data:")) {
    const parts = uri.split(",");
    const header = parts[0];
    const mimeType = header.split(";")[0].split(":")[1] || "image/jpeg";
    const cleanBase64 = parts[1].replace(/\s/g, "");
    return { base64: cleanBase64, mimeType };
  }

  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const parts = dataUrl.split(",");
      const mimeType = dataUrl.split(";")[0].split(":")[1] || "image/jpeg";
      const cleanBase64 = parts[1].replace(/\s/g, "");
      resolve({ base64: cleanBase64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Storage helpers for Gemini API Key & AI Provider
 */
export async function getSavedApiKey(): Promise<string> {
  const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  if (envKey.trim().length > 0) {
    return envKey.trim();
  }
  try {
    return (await AsyncStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)) || "";
  } catch {
    return "";
  }
}

export async function saveApiKey(key: string): Promise<void> {
  try {
    await AsyncStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key.trim());
  } catch (err) {
    console.error("Lỗi khi lưu Gemini API Key:", err);
  }
}

export async function getSavedProvider(): Promise<AIProvider> {
  try {
    const val = await AsyncStorage.getItem(AI_PROVIDER_STORAGE_KEY);
    return val === "gemini" ? "gemini" : "mock";
  } catch {
    return "mock";
  }
}

export async function saveProvider(provider: AIProvider): Promise<void> {
  try {
    await AsyncStorage.setItem(AI_PROVIDER_STORAGE_KEY, provider);
  } catch (err) {
    console.error("Lỗi khi lưu AI Provider:", err);
  }
}

/**
 * Main AI Analysis Entry Point
 * Accepts imageUri, description, location, and provider.
 */
export async function analyzeReport(
  input: AIReportInput,
  config?: AIServiceConfig
): Promise<AIReportResult> {
  const { imageUri, description, location } = input;
  const hasImage = !!(imageUri && imageUri.trim().length > 0);
  const hasDescription = !!(description && description.trim().length > 0);

  // Check 1: Empty input check
  if (!hasImage && !hasDescription) {
    throw new Error("Vui lòng thêm ảnh hoặc nhập mô tả sự cố.");
  }

  const savedProvider = await getSavedProvider();
  const provider = config?.provider || input.provider || savedProvider;

  if (provider === "gemini") {
    const apiKey = config?.apiKey || (await getSavedApiKey());
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error("Gemini API key chưa được cấu hình.");
    }
    return analyzeWithGemini(input, apiKey, config?.timeoutMs);
  }

  return analyzeWithMock(input);
}

// Backward compatibility alias for existing callers
export async function analyzeFieldReport(
  imageUri?: string,
  description?: string,
  config?: AIServiceConfig
): Promise<AIReportResult> {
  return analyzeReport(
    {
      imageUri,
      description,
      provider: config?.provider,
    },
    config
  );
}

/**
 * Real AI Vision Integration with Google Gemini REST API
 */
async function analyzeWithGemini(
  input: AIReportInput,
  apiKey: string,
  timeoutMs: number = 20000
): Promise<AIReportResult> {
  const { imageUri, description, location } = input;
  const effectiveApiKey = apiKey.trim();

  const models = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
  ];

  const systemPrompt = `You are a strict, professional field inspector AI.
ANALYZE THE INPUT (IMAGE AND/OR TEXT DESCRIPTION, LOCATION, AND GPS COORDINATES).

CRITICAL ANTI-HALLUCINATION RULES:
1. DO NOT fabricate information that is not explicitly provided or clear in the image/text.
2. If location is NOT specified or inferable from input, set location to "Chưa xác định" and add "Vị trí hiện trường" to the missingInformation array.
3. If GPS coordinates are supplied, use them for geographical context. DO NOT invent a specific room, building, or facility name based purely on raw coordinates unless explicitly provided by user text or clearly visible in the image.
4. If input text description is very short or missing key details, list what is missing in the missingInformation array (e.g. "Chi tiết mô tả sự cố").
5. Provide a confidence score from 0.0 to 1.0 based on how certain you are of your analysis.

OUTPUT REQUIREMENTS:
Return ONLY a valid raw JSON object in Vietnamese without markdown code fences using EXACT structure:
{
  "category": "Category string in Vietnamese (e.g. Hư hỏng thiết bị, Sự cố đường ống nước, Nguy cơ điện, Hư hỏng kết cấu, Vệ sinh & An toàn)",
  "location": "Location string in Vietnamese or 'Chưa xác định'",
  "priority": "High" | "Medium" | "Low",
  "issue": "Specific issue title in Vietnamese",
  "suggestedAction": "Specific technical repair action in Vietnamese",
  "summary": "Clear executive summary in Vietnamese",
  "confidence": number between 0.00 and 1.00,
  "missingInformation": ["List of missing information strings if any"]
}`;

  const promptText = `${systemPrompt}
  
User Location Input: "${location || 'Not provided'}"
User Text Description: "${description || 'Not provided'}"
User GPS Coordinates: "${input.gps ? `Latitude: ${input.gps.latitude}, Longitude: ${input.gps.longitude} (Accuracy: ±${input.gps.accuracy || 'N/A'}m)` : 'Not provided'}"`;

  const contentsParts: any[] = [{ text: promptText }];

  if (imageUri) {
    try {
      const { base64, mimeType } = await imageUriToBase64(imageUri);
      if (base64 && base64.length > 0) {
        contentsParts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64,
          },
        });
      }
    } catch (err) {
      console.warn("Không thể chuyển đổi hình ảnh sang Base64:", err);
    }
  }

  let lastErrorType = "network";
  let lastErrorMessage = "";

  for (const modelName of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(effectiveApiKey)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": effectiveApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: contentsParts }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        const detailMsg = errJson?.error?.message || response.statusText;
        lastErrorMessage = detailMsg;
        console.warn(`Model ${modelName} HTTP ${response.status}:`, detailMsg);
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!rawText) {
        continue;
      }

      // Validate & Normalize with validation utility
      return validateAndNormalizeAIResult(
        rawText,
        location,
        description,
        !!imageUri
      );
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        lastErrorType = "timeout";
        lastErrorMessage = "AI phản hồi quá lâu. Vui lòng thử lại.";
        break;
      } else {
        lastErrorType = "network";
        lastErrorMessage = "Không thể kết nối đến AI. Vui lòng kiểm tra Internet và thử lại.";
      }
    }
  }

  if (lastErrorType === "timeout") {
    throw new Error("AI phản hồi quá lâu. Vui lòng thử lại.");
  }

  throw new Error(
    lastErrorMessage || "Không thể kết nối đến AI. Vui lòng kiểm tra Internet và thử lại."
  );
}

/**
 * Smart Mock AI Engine (Vietnamese NLP & Vision Simulation)
 */
async function analyzeWithMock(input: AIReportInput): Promise<AIReportResult> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const { imageUri, description, location: userLoc } = input;
  const text = (description || "").trim();
  const lowerText = text.toLowerCase();
  const hasImage = !!(imageUri && imageUri.trim().length > 0);

  // Determine location
  let location = userLoc && userLoc.trim() ? userLoc.trim() : "";
  if (!location) {
    if (lowerText.includes("lễ tân") || lowerText.includes("reception")) location = "Khu vực Lễ tân";
    else if (lowerText.includes("server") || lowerText.includes("máy chủ")) location = "Phòng Server / Máy chủ";
    else if (lowerText.includes("vệ sinh") || lowerText.includes("toilet") || lowerText.includes("wc")) location = "Nhà vệ sinh Tầng 2";
    else if (lowerText.includes("sảnh")) location = "Sảnh chính tòa nhà";
    else if (lowerText.includes("văn phòng")) location = "Phòng làm việc";
  }

  const missingInfo: string[] = [];
  if (!location) {
    location = "Chưa xác định";
    missingInfo.push("Vị trí hiện trường");
  }

  if (text.length > 0 && text.length < 8 && !hasImage) {
    missingInfo.push("Chi tiết mô tả sự cố (Mô tả quá ngắn)");
  }

  // Calculate Mock Confidence
  let confidence = 0.92;
  if (!hasImage && text.length < 15) confidence = 0.68; // Low confidence trigger for testing
  else if (!hasImage || !text) confidence = 0.82;

  // Case 1: Air Conditioner / HVAC
  if (
    lowerText.includes("máy lạnh") ||
    lowerText.includes("điều hòa") ||
    lowerText.includes("nóng") ||
    lowerText.includes("ac") ||
    lowerText.includes("hvac")
  ) {
    return validateAndNormalizeAIResult(
      {
        category: "Hư hỏng thiết bị",
        location: location,
        priority: "High",
        issue: text || "Máy điều hòa không hoạt động",
        suggestedAction: "Kiểm tra nguồn điện đầu vào, đo áp suất ga nén, vệ sinh lưới lọc và thay thế tụ khởi động hỏng.",
        summary: `Hệ thống máy lạnh tại ${location} không hoạt động hoặc không làm mát, gây không khí nóng bức và ảnh hưởng trực tiếp đến người dùng.`,
        confidence: confidence,
        missingInformation: missingInfo,
      },
      userLoc,
      description,
      hasImage
    );
  }

  // Case 2: Water Leakage
  if (
    lowerText.includes("nước") ||
    lowerText.includes("rò rỉ") ||
    lowerText.includes("ống") ||
    lowerText.includes("tràn") ||
    lowerText.includes("thấm")
  ) {
    return validateAndNormalizeAIResult(
      {
        category: "Sự cố đường ống nước",
        location: location,
        priority: "High",
        issue: text || "Rò rỉ nước đọng vũng trên sàn",
        suggestedAction: "Khóa van nước tổng khu vực ngay lập tức và cử thợ sửa đường ống khắc phục điểm rò rỉ.",
        summary: `Phát hiện rò rỉ nước tại ${location}. Cần xử lý sớm để ngăn chặn nguy cơ ngập sàn, trơn trượt và hư hỏng kết cấu.`,
        confidence: confidence,
        missingInformation: missingInfo,
      },
      userLoc,
      description,
      hasImage
    );
  }

  // Case 3: Electrical Hazard
  if (
    lowerText.includes("điện") ||
    lowerText.includes("dây") ||
    lowerText.includes("chập") ||
    lowerText.includes("ổ cắm") ||
    lowerText.includes("tia lửa")
  ) {
    return validateAndNormalizeAIResult(
      {
        category: "Nguy cơ điện",
        location: location,
        priority: "High",
        issue: text || "Sự cố chập điện và rò rỉ nguồn điện",
        suggestedAction: "Ngắt cầu dao Aptomat khu vực, nối lại dây dẫn bị hở, thay mới ổ cắm bị cháy xém.",
        summary: `Sự cố hệ thống điện tại ${location} tiềm ẩn nguy cơ chập cháy nổ và mất an toàn cho nhân sự xung quanh.`,
        confidence: confidence,
        missingInformation: missingInfo,
      },
      userLoc,
      description,
      hasImage
    );
  }

  // Case 4: Photo Only
  if (hasImage && text.length === 0) {
    return validateAndNormalizeAIResult(
      {
        category: "Hư hỏng thiết bị hiện trường",
        location: location,
        priority: "High",
        issue: "Sự cố thiết bị nhận diện qua ảnh chụp",
        suggestedAction: "Cử kỹ thuật viên kiểm tra toàn bộ linh kiện thiết bị trong ảnh và thay thế bộ phận hỏng.",
        summary: `AI đã phân tích ảnh chụp hiện trường tại ${location}: Phát hiện lỗi linh kiện thiết bị cần bảo trì sửa chữa.`,
        confidence: 0.88,
        missingInformation: missingInfo,
      },
      userLoc,
      description,
      hasImage
    );
  }

  // Fallback Mock Result
  return validateAndNormalizeAIResult(
    {
      category: "Hư hỏng thiết bị",
      location: location,
      priority: text.length > 0 ? "High" : "Medium",
      issue: text || "Máy điều hòa không hoạt động",
      suggestedAction: "Gửi nhân viên kỹ thuật bảo trì đến kiểm tra hiện trường và sửa chữa.",
      summary: text
        ? `Ghi nhận sự cố tại ${location}: "${text}". Hệ thống AI đề xuất điều động nhân viên bảo trì xử lý.`
        : `Hệ thống thiết bị tại ${location} gặp sự cố hỏng hóc, cần cử đội bảo trì đến khắc phục ngay.`,
      confidence: confidence,
      missingInformation: missingInfo,
    },
    userLoc,
    description,
    hasImage
  );
}
