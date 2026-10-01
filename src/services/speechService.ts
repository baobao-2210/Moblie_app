import { Platform } from "react-native";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

export type RecordingState = "idle" | "recording" | "processing" | "error";

interface SpeechListeners {
  onResult: (text: string) => void;
  onError: (errorMsg: string) => void;
  onStateChange: (state: RecordingState) => void;
}

class SpeechService {
  private activeWebRecognition: any = null;
  private isListeningNative: boolean = false;
  private resultSubscription: any = null;
  private errorSubscription: any = null;

  /**
   * Check if Speech Recognition is supported on the current platform
   */
  isSupported(): boolean {
    if (Platform.OS === "web") {
      const windowObj = typeof window !== "undefined" ? (window as any) : {};
      return !!(windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition);
    }
    // On Native mobile apps, check ExpoSpeechRecognitionModule
    return typeof ExpoSpeechRecognitionModule !== "undefined";
  }

  /**
   * Start listening for voice input
   */
  async startListening(listeners: SpeechListeners): Promise<void> {
    const { onResult, onError, onStateChange } = listeners;

    if (!this.isSupported()) {
      onStateChange("error");
      onError(
        "Nhận diện giọng nói không được hỗ trợ trên trình duyệt/thiết bị này. Vui lòng nhập bằng bàn phím."
      );
      return;
    }

    onStateChange("processing");

    // WEB PLATFORM IMPLEMENTATION
    if (Platform.OS === "web") {
      try {
        const windowObj = window as any;
        const SpeechRecognitionClass =
          windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;

        if (!SpeechRecognitionClass) {
          throw new Error("Web Speech API missing");
        }

        const recognition = new SpeechRecognitionClass();
        recognition.lang = "vi-VN"; // Vietnamese language support
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          onStateChange("recording");
        };

        recognition.onresult = (event: any) => {
          onStateChange("processing");
          if (event.results && event.results[0] && event.results[0][0]) {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
            onStateChange("idle");
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Web Speech Recognition error:", event.error);
          onStateChange("error");
          if (event.error === "not-allowed" || event.error === "permission-denied") {
            onError("Không thể sử dụng microphone.\n\nVui lòng cấp quyền microphone trong phần Settings của ứng dụng/trình duyệt.");
          } else {
            onError("⚠️ Không thể nhận diện giọng nói. Vui lòng thử lại hoặc gõ bằng bàn phím.");
          }
        };

        recognition.onend = () => {
          this.activeWebRecognition = null;
        };

        this.activeWebRecognition = recognition;
        recognition.start();
      } catch (err) {
        console.warn("Lỗi khởi tạo Web Speech API:", err);
        onStateChange("error");
        onError("Không thể khởi tạo bộ nhận diện giọng nói.");
      }
      return;
    }

    // NATIVE PLATFORM IMPLEMENTATION (iOS / Android)
    try {
      // 1. Request Microphone & Speech Permissions
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      
      if (!result.granted) {
        onStateChange("error");
        onError(
          "Không thể sử dụng microphone.\n\nVui lòng cấp quyền microphone trong phần Settings của thiết bị."
        );
        return;
      }

      // 2. Set up native listeners
      this.resultSubscription = ExpoSpeechRecognitionModule.addListener("result", (event: any) => {
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0]?.transcript || event.results[0];
          if (typeof transcript === "string" && transcript.trim()) {
            onResult(transcript);
          }
        }
        onStateChange("idle");
        this.stopListening();
      });

      this.errorSubscription = ExpoSpeechRecognitionModule.addListener("error", (event: any) => {
        console.warn("Native Speech error:", event);
        onStateChange("error");
        onError("⚠️ Không thể nhận diện giọng nói. Vui lòng thử lại.");
        this.stopListening();
      });

      // 3. Start native recognition engine
      this.isListeningNative = true;
      onStateChange("recording");
      
      ExpoSpeechRecognitionModule.start({
        lang: "vi-VN",
        interimResults: false,
        maxAlternatives: 1,
      });
    } catch (err) {
      console.warn("Lỗi khởi chạy Native Speech Recognition:", err);
      onStateChange("error");
      onError("Không thể bắt đầu ghi âm giọng nói. Vui lòng kiểm tra quyền thiết bị.");
    }
  }

  /**
   * Stop listening manually
   */
  stopListening(): void {
    if (Platform.OS === "web" && this.activeWebRecognition) {
      try {
        this.activeWebRecognition.stop();
      } catch (e) {
        // ignore
      }
      this.activeWebRecognition = null;
    }

    if (this.isListeningNative) {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch (e) {
        // ignore
      }
      this.isListeningNative = false;
    }

    if (this.resultSubscription) {
      this.resultSubscription.remove();
      this.resultSubscription = null;
    }
    if (this.errorSubscription) {
      this.errorSubscription.remove();
      this.errorSubscription = null;
    }
  }
}

export const speechService = new SpeechService();
