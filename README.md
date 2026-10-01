# AI Field Assistant (Trợ Lý Hiện Trường AI)

Ứng dụng di động thông minh được xây dựng trên nền tảng **React Native Expo** dành riêng cho kỹ thuật viên hiện trường và thanh tra an toàn. Ứng dụng giúp chụp ảnh sự cố, ghi nhận quan sát qua giọng nói/GPS, và tự động tạo báo cáo kỹ thuật có cấu trúc dựa trên công nghệ **Google Gemini AI (Real REST API)** và bộ máy giả lập **Mock AI (Offline Demo)**.

---

## 📌 Đặt Vấn Đề (Problem)

Các kỹ thuật viên, quản lý tòa nhà và thanh tra an toàn thường tốn rất nhiều thời gian để nhập liệu thủ công các báo cáo sự cố, phân loại mức độ nghiêm trọng, tra cứu mã khu vực và đề xuất phương án bảo trì tại hiện trường. Việc ghi chép bằng giấy truyền thống hoặc điền biểu mẫu web phức tạp dẫn đến trễ hạn bảo trì và dữ liệu không đồng nhất.

---

## 💡 Giải Pháp (Solution)

**AI Field Assistant** đơn giản hóa quy trình tạo báo cáo hiện trường thành luồng làm việc thông minh:
1. **Chụp ảnh & Nhập thông tin**: Chụp ảnh hiện trường, nhập mô tả bằng bàn phím hoặc đọc bằng 🎤 **Giọng nói**, tự động lấy 📍 **Tọa độ GPS**.
2. **AI Phân Tích & Xác Thực**: Real Gemini AI (hoặc Mock AI) trích xuất dữ liệu JSON có cấu trúc, tính toán % độ tin cậy (Confidence), và tự động phát hiện thông tin còn thiếu mà không bịa đặt sự thật.
3. **Kiểm Duyệt & Lưu Trữ (Human Review)**: Kỹ thuật viên kiểm tra độ tin cậy AI, rà soát cảnh báo thông tin thiếu, chỉnh sửa nội dung và xác nhận lưu vào lịch sử bộ nhớ thiết bị.

---

## ✨ Tính Năng Nổi Bật (Features)

- 📸 **Chụp & Quản Lý Ảnh Hiện Trường**: Chụp ảnh trực tiếp qua `expo-camera` / `expo-image-picker` hoặc chọn từ thư viện với giao diện xem trước linh hoạt.
- 🎤 **Nhận Diện Giọng Nói (Voice-to-Text)**: Thu âm giọng nói của kỹ thuật viên (`speechService.ts`), tự động chuyển văn bản và nối vào ô mô tả sự cố để chỉnh sửa bằng bàn phím.
- 📍 **Định Vị GPS Tự Động (GPS Auto-Tagging)**: Lấy tọa độ GPS chính xác (`locationService.ts` gồm Latitude, Longitude, Độ chính xác ±m) để gắn vào báo cáo và cung cấp ngữ cảnh địa lý cho Gemini AI.
- 🤖 **Real Gemini AI & Chuyển Đổi Chế Độ**: Tích hợp Google Gemini REST API (`gemini-1.5-flash` / `gemini-2.0-flash`) với giao diện cài đặt API Key trực tiếp và chế độ fallback Mock AI mượt mà.
- 🎯 **Chống Bịa Thông Tin & Phát Hiện Dữ Liệu Thiếu**: System prompt và bộ kiểm tra dữ liệu nghiêm ngặt ngăn AI tự bịa vị trí hoặc chi tiết không có thực. Các mục thiếu được gắn tag `missingInformation`.
- 📊 **Đánh Giá Độ Tin Cậy (AI Confidence)**: Hiển thị badge % tin cậy của AI (0-100%) kèm banner cảnh báo khi độ tin cậy thấp (< 70%).
- ✏️ **Kiểm Duyệt Bởi Con Người (Human Review)**: Tất cả 6 trường dữ liệu (Danh mục, Vị trí, Mức độ ưu tiên, Sự cố, Đề xuất xử lý, Tóm tắt) đều cho phép chỉnh sửa trước khi lưu.
- 💾 **Lưu Trữ Lịch Sử Local**: Bộ nhớ offline bền vững qua `@react-native-async-storage/async-storage` với khả năng tương thích ngược hoàn toàn.
- 🔍 **Tìm Kiếm & Quản Lý Lịch Sử**: Lọc báo cáo đã lưu theo từ khóa/vị trí, chỉnh sửa báo cáo cũ và xóa báo cáo với hộp thoại xác nhận an toàn.
- ⚡ **Xử Lý Lỗi & Loading Linh Hoạt**: Tự động hủy khi quá hạn (Timeout 15s), khôi phục lỗi kết nối mạng với nút Thử lại, và bộ bóc tách khử mã Markdown codeblock.

---

## 🏗️ Kiến Trúc Hệ Thống AI (AI Architecture)

```text
React Native (Expo SDK 57)
     ↓
AI Service Layer (src/services/aiService.ts)
     ↓
Mock AI  /  Real Gemini REST API (gemini-1.5-flash)
     ↓
Bộ Lọc Khử Codeblock & Parse JSON Chuẩn
     ↓
Bộ Kiểm Tra & Phát Hiện Thiếu Dữ Liệu (src/utils/validation.ts)
     ↓
Màn Hình Kiểm Duyệt Human Review (src/screens/ReportResultScreen.tsx)
     ↓
Lưu Trữ Cục Bộ AsyncStorage (src/services/storageService.ts)
```

### Tại Sao Khâu Kiểm Duyệt (Human Review) Là Bắt Buộc?

> **Báo cáo do AI tạo ra luôn được kiểm tra và cho phép kỹ thuật viên chỉnh sửa trước khi lưu chính thức.**  
> Trong công tác kỹ thuật và an toàn hiện trường, AI đóng vai trò như một **Trợ lý soạn thảo tự động**. Việc xác nhận của con người giúp đảm bảo tính pháp lý, độ chính xác thực tế và trách nhiệm nghề nghiệp trước khi đưa dữ liệu vào hệ thống quản lý bảo trì.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Framework**: React Native với Expo (SDK 57 + TypeScript 5+)
- **Navigation**: React Navigation (`@react-navigation/native-stack`)
- **Tích hợp AI**: Google Gemini REST API (`x-goog-api-key` / `EXPO_PUBLIC_GEMINI_API_KEY`)
- **Định vị & Giọng nói**: `expo-location` & `expo-speech-recognition` / Web Speech API
- **Lưu trữ**: `@react-native-async-storage/async-storage`
- **Hình ảnh**: `expo-image-picker`
- **Biểu tượng**: `lucide-react-native` + `react-native-svg`
- **Giao diện UI**: Hệ thống Design Tokens màu sắc hiện đại (`#2563EB` primary, `#F8FAFC` background)

---

## 💾 Cấu Trúc Dữ Liệu Lưu Trữ (Storage Schema)

```typescript
type PriorityLevel = "Low" | "Medium" | "High";

type LocationData = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
};

type FieldReport = {
  id: string;
  imageUri?: string;
  description?: string;
  category: string;
  location: string;
  priority: PriorityLevel;
  issue: string;
  suggestedAction: string;
  summary: string;
  createdAt: string; // Chuỗi ngày giờ ISO
  confidence?: number; // 0.00 đến 1.00
  missingInformation?: string[]; // Ví dụ: ["Vị trí hiện trường"]
  gps?: LocationData;
};
```

---

## 🛠️ Các Quyết Định Kỹ Thuật (Technical Decisions)

1. **Gọi REST API Trực Tiếp thay vì dùng SDK nặng**:
   - Sử dụng `fetch` HTTP REST API nhẹ nhàng với header `x-goog-api-key` thay vì thêm các thư viện SDK nặng. Quyết định này giúp tối ưu dung lượng app, tránh lỗi native trên Expo SDK 57 và linh hoạt chuyển đổi giữa các mô hình (`gemini-1.5-flash` / `gemini-2.0-flash`).
2. **Bộ Lọc Khử Markdown Codeblock (`sanitizeJsonResponse`)**:
   - Các mô hình LLM thường bao bọc JSON trong các thẻ ` ```json ... ``` `. Hàm Regex xử lý bóc tách chuỗi JSON sạch trước khi parse giúp ứng dụng vận hành ổn định 100% không lo rò rỉ lỗi.
3. **Chống Bịa Thông Tin & Phát Hiện Dữ Liệu Thiếu**:
   - AI được chỉ định không tự tạo tên phòng/tòa nhà nếu không có căn cứ. Khi thông tin thiếu, hệ thống tự đưa vị trí về `"Chưa xác định"` và ghi nhận vào mảng `missingInformation`.
4. **Tích Hợp Giọng Nói & GPS Đa Nền Tảng**:
   - `speechService.ts` tự động chọn Web Speech API khi chạy trên trình duyệt web và `expo-speech-recognition` khi chạy trên ứng dụng di động. `locationService.ts` sử dụng `expo-location` với cơ chế xử lý từ chối quyền mượt mà.

---

## 📌 Những Hạn Chế Đã Biết (Known Limitations)

- **Lưu Trữ Cục Bộ (Local-Only Storage)**: Dữ liệu hiện được lưu hoàn toàn trên bộ nhớ đệm thiết bị qua AsyncStorage. Chưa đồng bộ trực tiếp lên cơ sở dữ liệu đám mây (PostgreSQL/Supabase).
- **Lưu Ảnh Trên Bộ Nhớ Đệm Thiết Bị**: Ảnh chụp hiện trường được lưu tạm thời trong bộ nhớ file system của điện thoại thay vì tải lên AWS S3 hay Cloudinary.
- **Phạm Vi Đơn Người Dùng**: Chưa tích hợp hệ thống phân quyền nhiều cấp (RBAC), quản trị viên hoặc đăng nhập nhiều tài khoản.

---

## 🔑 Cấu Hình Biến Môi Trường (Environment)

Tạo tệp `.env` tại thư mục gốc dự án (không commit tệp này lên Git):

```env
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...
```

Hoặc bạn có thể bấm vào biểu tượng **Cài đặt (Settings)** ở góc màn hình ứng dụng để bật/tắt **Mock AI** hoặc nhập **Gemini API Key** trực tiếp trên giao diện.

---

## 🚀 Hướng Dẫn Khởi Chạy (How to Run)

### Yêu cầu tiên quyết:
- Node.js (v18 trở lên)
- Ứng dụng Expo Go trên điện thoại HOẶC Máy ảo Android/iOS Emulator

### Các bước thực hiện:

1. **Cài đặt các thư viện phụ thuộc**:
   ```bash
   npm install
   ```

2. **Khởi động Expo Development Server**:
   ```bash
   npx expo start --host lan
   ```

3. **Mở ứng dụng trên thiết bị**:
   - Nhấn **`a`** để mở trên Máy ảo Android.
   - Nhấn **`i`** để mở trên Máy ảo iOS Simulator.
   - Mở app **Expo Go** trên điện thoại và quét mã QR hiển thị ở Terminal.



