# Nhật Ký Công Việc AI (AI Worklog) - AI Field Assistant

Tài liệu này ghi chép chi tiết quá trình tích hợp Google Gemini REST API, kiến trúc xử lý AI, phòng chống AI bịa thông tin (Anti-Hallucination), cơ chế phát hiện thiếu dữ liệu (Missing Information Detection), quy trình Kiểm duyệt bởi con người (Human Review), và hướng dẫn kiểm thử cho lập trình viên.

---

## 🛠️ 1. Các Công Cụ AI Đã Sử Dụng

1. **Google Antigravity AI Assistant**: Trợ lý lập trình AI chính trong thiết kế kiến trúc, tái cấu trúc TypeScript type-safe, xây dựng các tiện ích kiểm tra (Validation & Sanitization), và thiết kế giao diện React Native.
2. **Google Gemini REST API (`gemini-1.5-flash` / `gemini-2.0-flash`)**: Mô hình ngôn ngữ & thị giác điện toán đám mây trực tiếp xử lý đa phương thức (Ảnh + Text + Vị trí) qua HTTP REST API với `x-goog-api-key`.
3. **Smart NLP Engine (Mock AI)**: Bộ máy phân tích ngôn ngữ tự nhiên mô phỏng nội bộ, giúp ứng dụng chạy thử mượt mà offline không cần mạng hoặc API Key.

---

## 🎯 2. Prompt Chính & Cấu Trúc Yêu Cầu AI (System Prompt)

Gemini được cấu hình với System Prompt nghiêm ngặt yêu cầu trả về duy nhất chuỗi JSON hợp lệ không kèm Markdown code fence hay giải thích ngoài:

```json
{
  "category": "Tên danh mục sự cố",
  "location": "Vị trí chính xác hoặc 'Chưa xác định'",
  "priority": "Low" | "Medium" | "High",
  "issue": "Tóm tắt sự cố",
  "suggestedAction": "Khuyến nghị khắc phục",
  "summary": "Tóm tắt tổng quan",
  "confidence": 0.92,
  "missingInformation": ["Vị trí hiện trường"]
}
```

---

## 🛡️ 3. Phòng Chống AI Bịa Thông Tin (Anti-Hallucination) & Phát Hiện Thiếu Dữ Liệu

### Nguyên tắc chống bịa thông tin:
- AI **không được tự tạo** thông tin chưa được cung cấp hoặc chưa thể suy đoán chắc chắn từ hình ảnh.
- Nếu người dùng không nhập vị trí và ảnh không có dấu hiệu rõ ràng, AI buộc phải trả:
  - `location: "Chưa xác định"`
  - `missingInformation: ["Vị trí hiện trường"]`

### Cơ chế phát hiện thiếu thông tin (`src/utils/validation.ts`):
1. Kiểm tra vị trí: Nếu `location` chứa từ khóa "Chưa xác định", "Không rõ", hoặc "Unknown" ➔ Tự động thêm `"Vị trí hiện trường"` vào danh sáng `missingInformation`.
2. Kiểm tra mô tả sự cố: Nếu `issue` ngắn dưới 5 ký tự ➔ Thêm `"Mô tả chi tiết sự cố"`.
3. Kiểm tra độ tin cậy: Nếu `confidence < 0.70` ➔ Thêm `"Độ tin cậy AI thấp - Cần kiểm tra lại"`.

---

## ⚠️ 4. Các Lỗi AI Có Thể Gặp & Phương Án Validation Xử Lý

| STT | Lỗi AI Có Thể Gặp | Nguyên nhân | Cách Validation & Sanitization Xử Lý |
|---|---|---|---|
| 1 | **Gemini bao bọc JSON trong Markdown codeblock** (` ```json ... ``` `) | Hành vi mặc định của LLM khi sinh mã. | Hàm `sanitizeJsonResponse()` trong `src/utils/validation.ts` tự động dùng Regex bóc tách chuỗi JSON sạch trước khi parse. |
| 2 | **Thiếu API Key hoặc Key không hợp lệ** | Chưa cấu hình `.env` hoặc API Key nhập sai. | `aiService.ts` kiểm tra Key trước khi gọi API, hiển thị thông báo "Gemini API Key chưa được cấu hình" kèm hướng dẫn nhập Key trong UI. |
| 3 | **Mất mạng / Network Timeout** | Mạng chập chờn hoặc Gemini phản hồi lâu quá 15 giây. | `AbortController` tự động hủy request sau 15s. UI hiển thị "Không thể kết nối đến AI" kèm nút "Thử lại", không làm gián đoạn trải nghiệm người dùng. |
| 4 | **JSON sai định dạng (Invalid JSON)** | Phản hồi bị cắt đứt giữa chừng. | `validateAndNormalizeAIResult()` bắt lỗi `JSON.parse` và nạp cấu trúc fallback an toàn, báo lỗi "AI trả về dữ liệu không hợp lệ" kèm lựa chọn "Phân tích lại". |
| 5 | **AI suy đoán linh tinh về vị trí** | AI tự bịa vị trí dù người dùng không nhập. | System prompt cấm bịa thông tin + Bộ kiểm tra `normalizeAIReportResult` tự động chuyển vị trí không căn cứ thành "Chưa xác định" và đánh dấu thiếu dữ liệu. |

---

## 👤 5. Quy Trình Kiểm Duyệt Bởi Con Người (Human Review Workflow)

### Tại sao Human Review là bắt buộc?
> **Trong các hoạt động bảo trì, an toàn lao động và quản lý hiện trường, AI chỉ là công cụ hỗ trợ tạo bản thảo.** Khâu kiểm duyệt và xác nhận của con người là bắt buộc để đảm bảo tính pháp lý, độ chính xác thực tế và trách nhiệm nghề nghiệp trước khi lưu trữ vào hệ thống.

### Luồng xử lý chi tiết:
```text
Ảnh + Mô tả
     ↓
Gọi Gemini REST API
     ↓
Trả về Structured JSON
     ↓
Khử Codeblock & Validation Chuẩn hóa
     ↓
Màn hình Human Review (ReportResultScreen)
  - Hiển thị badge Confidence (Ví dụ: AI 92%)
  - Cảnh báo ⚠️ Missing Information (nếu thiếu vị trí)
  - Cho phép người dùng chỉnh sửa cả 6 trường dữ liệu
     ↓
Xác nhận & Lưu vào AsyncStorage
```

---

## 🔍 6. Những Gì Lập Trình Viên Phải Kiểm Tra Thủ Công (Developer Audit Checklist)

1. **Kiểm tra TypeScript compile**:
   ```bash
   npx tsc --noEmit
   ```
   *Yêu cầu*: 0 lỗi Type.

2. **Kiểm tra Expo Doctor**:
   ```bash
   npx expo-doctor
   ```
   *Yêu cầu*: Pass 21/21 checks.

3. **Kiểm tra Mode Mock AI**:
   - Chuyển Mode AI sang **Mock AI**.
   - Nhập text / chụp ảnh và nhấn "Phân tích báo cáo".
   - *Yêu cầu*: Báo cáo tạo ra mượt mà không cần API key.

4. **Kiểm tra Mode Gemini AI**:
   - Nhập Gemini API Key chuẩn (`AIzaSy...` hoặc `AQ...`).
   - Nhập "Máy lạnh phòng lễ tân bị chảy nước".
   - *Yêu cầu*: Trả về dữ liệu chuẩn JSON, hiển thị % Confidence, không bịa thông tin.

5. **Kiểm tra Case Thiếu Vị Trí (Missing Information)**:
   - Chỉ nhập "Máy điều hòa bị hư" (không nhập Vị trí).
   - *Yêu cầu*: Màn hình kết quả xuất hiện thẻ Cảnh báo `⚠️ Phát hiện thông tin chưa đầy đủ` (AI chưa xác định được Vị trí hiện trường).

6. **Kiểm tra Chỉnh Sửa & Lưu (Human Review & Edit)**:
   - Sửa lại trường Vị trí từ "Chưa xác định" thành "Phòng 102".
   - Nhấn "Lưu báo cáo".
   - Chuyển sang màn hình Lịch sử (History).
   - *Yêu cầu*: Báo cáo hiển thị đúng nội dung đã chỉnh sửa ("Phòng 102") kèm tag độ tin cậy AI.

---

## 🎤 7. Tích Hợp Chuyển Giọng Nói Thành Văn Bản (Voice → Text)

- **Dịch vụ**: `src/services/speechService.ts`
- **Cơ chế**: Sử dụng `Web Speech API` (`window.SpeechRecognition`) khi chạy trên Web và `expo-speech-recognition` khi chạy trên Native Mobile.
- **Trạng thái**: `idle` (chờ) ➔ `recording` (đang ghi âm) ➔ `processing` (đang chuyển đổi) ➔ `idle` / `error`.
- **Cơ chế bổ sung**: Chuỗi văn bản sau khi nhận diện sẽ tự động nối trực tiếp vào ô TextInput "Mô tả hiện trường". Kỹ thuật viên có thể đọc thành từng câu hoặc gõ thêm/chỉnh sửa nội dung bằng bàn phím.
- **Xử lý quyền**: Nếu từ chối quyền microphone, hệ thống hiển thị thông báo hướng dẫn mở cài đặt thiết bị và không gây crash ứng dụng.

---

## 📍 8. Tự Động Định Vị GPS Hiện Trường (GPS Location)

- **Dịch vụ**: `src/services/locationService.ts` (`expo-location`)
- **Tọa độ**: Lấy `latitude`, `longitude`, `accuracy` (độ chính xác ±m) và `timestamp`.
- **Cơ chế chống bịa thông tin từ GPS**: Tọa độ thô GPS không được AI tự ý phán đoán thành tên phòng/tòa nhà cụ thể nếu người dùng không tự nhập tên địa điểm.
- **Model**: `gps?: LocationData` được lưu trữ vào AsyncStorage một cách tương thích ngược. Các báo cáo cũ không có dữ liệu GPS vẫn mở và xem bình thường.

---

## 🔍 9. Những Gì Lập Trình Viên Phải Kiểm Tra Thủ Công (Developer Audit Checklist)

1. **Kiểm tra TypeScript compile**:
   ```bash
   npx tsc --noEmit
   ```
   *Yêu cầu*: 0 lỗi Type.

2. **Kiểm tra Expo Doctor**:
   ```bash
   npx expo-doctor
   ```
   *Yêu cầu*: Pass 21/21 checks.

3. **Kiểm tra Voice-to-Text**:
   - Nhấn nút 🎤 **Nhập giọng nói** tại ô Mô tả hiện trường.
   - Cho phép quyền Microphone khi được hỏi.
   - Nói: *"Máy lạnh phòng lễ tân không hoạt động và khách phản ánh rất nóng."*
   - Nhấn ⏹ **Dừng**.
   - *Yêu cầu*: Chuỗi văn bản hiển thị trong TextInput. Người dùng có thể tự sửa lại bằng bàn phím.

4. **Kiểm tra GPS Location**:
   - Nhấn nút 📍 **Lấy vị trí**.
   - Cho phép quyền Location.
   - *Yêu cầu*: Hiển thị tọa độ Latitude & Longitude kèm độ chính xác. Nhấn "Phân tích bằng AI" và "Lưu báo cáo". Mở Lịch sử hoặc Chi tiết để xem tọa độ GPS đã lưu.

5. **Kiểm tra Báo cáo cũ**:
   - Mở các báo cáo cũ trong Lịch sử.
   - *Yêu cầu*: Ứng dụng không crash, hiển thị "Tọa độ GPS: Chưa có dữ liệu vị trí".

---

## 📅 10. Kế Hoạch Nâng Cấp Tiếp Theo

- [x] Tích hợp `expo-location` tự động gắn tọa độ GPS vào trường Vị trí hiện trường.
- [x] Tích hợp nhập giọng nói Voice-to-Text Speech Recognition (`speechService.ts`).
- [ ] Tích hợp hàng đợi đồng bộ Offline (Offline Sync Queue) với `NetInfo`.
- [ ] Xuất báo cáo PDF kèm hình ảnh và chữ ký điện tử.

