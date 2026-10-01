# AI Field Assistant

An intelligent, mobile-first React Native Expo application designed for field technicians and safety inspectors to capture incident photos, record observations, and generate structured field reports powered by Real Google Gemini AI and smart fallback Mock AI.

---

## 📌 Problem

Field inspectors, facility managers, and safety auditors often waste substantial time manually typing up incident reports, categorizing severity levels, mapping location codes, and deciding appropriate maintenance actions on-site. Traditional paper forms or complex enterprise web forms lead to delayed maintenance requests and inconsistent data formatting.

---

## 💡 Solution

**AI Field Assistant** simplifies field reporting into an intelligent workflow:
1. **Snap or Describe**: Capture an incident photo, record a quick description, or provide location info.
2. **AI Analysis & Validation**: Real Gemini AI (or Mock AI) extracts structured JSON data, calculates confidence percentage, and detects missing critical information without inventing unverified facts.
3. **Human Review & Save**: The field worker reviews AI confidence, inspects missing item warnings, and edits all fields before saving to local device history.

---

## ✨ Features

- 📸 **Camera & Photo Integration**: Snap live photos using `expo-camera` / `expo-image-picker` or choose from gallery with instant thumbnail preview.
- 🎤 **Voice-to-Text Speech Recognition**: Record verbal incident descriptions using microphone input (`speechService.ts`), auto-populating the editable description field.
- 📍 **GPS Location Auto-Tagging**: Request device GPS permissions (`locationService.ts`) to attach exact latitude, longitude, and accuracy data to reports and Gemini AI context.
- 🤖 **Real Gemini AI & Provider Switch**: Seamless integration with Google Gemini REST API (`gemini-1.5-flash` / `gemini-2.0-flash`) with dynamic API key config modal and Mock AI fallback.
- 🎯 **Anti-Hallucination & Missing Info Detection**: Strict system prompting and result validation prevent AI from creating fictitious locations or facts. Missing elements are flagged as `missingInformation`.
- 📊 **Confidence Ratings**: AI confidence score (0-100%) badge displayed with warning banners when confidence is low (< 70%).
- ✏️ **Human-in-the-Loop Review**: All 6 fields (Category, Location, Priority, Issue, Suggested Action, Summary) are fully editable before saving.
- 💾 **Local History Storage**: Persistent offline storage via `@react-native-async-storage/async-storage` with full backward compatibility.
- 🔍 **History Search & Management**: Filter saved reports by keyword/location, edit existing reports, and delete reports with modal confirmation.
- ⚡ **Resilient Loading & Error Handling**: Timeout handling (15s), API key setup modal, network error recovery with retry button, and JSON codeblock sanitizer.

---

## 🏗️ AI Architecture

```text
React Native (Expo SDK 57)
     ↓
AI Service Layer (src/services/aiService.ts)
     ↓
Mock AI  /  Real Gemini REST API (gemini-1.5-flash)
     ↓
Structured JSON Sanitizer & Parser
     ↓
Validation & Missing Information Detector (src/utils/validation.ts)
     ↓
Human Review & Edit Screen (src/screens/ReportResultScreen.tsx)
     ↓
AsyncStorage Local Storage (src/services/storageService.ts)
```

### Why Human Review is Mandatory

> **AI-generated reports are always reviewed and editable by the field worker before being saved.**  
> In industrial and safety field operations, AI serves as an automated draft assistant. Human verification ensures regulatory compliance, accurate liability records, and safety standards before committing report data into official maintenance records.

---

## 🛠️ Tech Stack

- **Framework**: React Native with Expo (SDK 57 + TypeScript 5+)
- **Navigation**: React Navigation (`@react-navigation/native-stack`)
- **AI Integration**: Google Gemini REST API (`x-goog-api-key` / `EXPO_PUBLIC_GEMINI_API_KEY`)
- **Storage**: `@react-native-async-storage/async-storage`
- **Media**: `expo-image-picker`
- **Icons**: `lucide-react-native` + `react-native-svg`
- **UI Architecture**: Modular Custom Components & Modern Palette Design System (`#2563EB` primary, `#F8FAFC` background)

---

## 💾 Storage Schema

```typescript
type PriorityLevel = "Low" | "Medium" | "High";

type FieldReport = {
  id: string;
  imageUri?: string;
  category: string;
  location: string;
  priority: PriorityLevel;
  issue: string;
  suggestedAction: string;
  summary: string;
  createdAt: string; // ISO date string
  confidence?: number; // 0.00 to 1.00
  missingInformation?: string[]; // e.g. ["Vị trí hiện trường"]
};
```

---

## 🛠️ Technical Decisions & Rationale (Các quyết định kỹ thuật)

1. **Direct REST API vs Heavy SDK**:
   - Integrated Google Gemini via lightweight `fetch` REST API (`x-goog-api-key`) instead of adding heavy client SDKs. This ensures fast bundle size, zero native compatibility issues with Expo SDK 57, and model fallback flexibility (`gemini-1.5-flash` / `gemini-2.0-flash`).
2. **Strict JSON Sanitization & Codeblock Stripping**:
   - LLMs often enclose JSON responses in Markdown codeblocks (` ```json ... ``` `). Implemented `sanitizeJsonResponse()` in `src/utils/validation.ts` using regular expressions to guarantee reliable parsing without runtime crashes.
3. **Anti-Hallucination & Missing Info Detection**:
   - Rather than letting AI invent missing facility names or issues, strict prompt instructions and `validateAndNormalizeAIResult()` normalize unknown locations to `"Chưa xác định"` and populate `missingInformation` array.
4. **Mandatory Human-in-the-Loop Review**:
   - In industrial and safety field operations, AI serves as an automated draft assistant. Human verification ensures regulatory compliance, accurate liability records, and safety standards before committing report data into official maintenance records.
5. **Decoupled AI Provider Architecture**:
   - Abstracts AI logic in `src/services/aiService.ts` behind `analyzeReport()`. UI screens do not depend directly on Gemini or Mock AI, making provider toggling seamless.
6. **Cross-Platform Voice & GPS Integration**:
   - `speechService.ts` leverages `Web Speech API` on Web and `expo-speech-recognition` on mobile native. `locationService.ts` uses `expo-location` with graceful permission fallback to manual typing.

---

## 📌 Known Limitations (Những hạn chế đã biết)

- **Local-Only Storage**: Persistent storage relies on `@react-native-async-storage/async-storage` on the local device. Data is not synchronized to a remote cloud database (PostgreSQL/Supabase).
- **Device Image Caching**: Incident photos are stored locally on the device file system cache rather than uploaded to an S3/Cloudinary bucket.
- **Single-User Scope**: No multi-tenant user accounts, authentication, or role-based permission control (RBAC).

---

## 🔑 Environment Configuration

Create a `.env` file in the root directory (do not commit to Git):

```env
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...
```

Alternatively, tap the **Settings** icon in the app header to switch between **Mock AI** and **Gemini AI** and enter your API key directly in the UI.

---

## 🚀 How to Run

### Prerequisites
- Node.js (v18+)
- Expo Go App on mobile device OR Android/iOS Emulator

### Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Expo Development Server**:
   ```bash
   npx expo start --host lan
   ```

3. **Open Application**:
   - Press `a` for Android Emulator
   - Press `i` for iOS Simulator
   - Scan QR code using Expo Go app on physical phone


