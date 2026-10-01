import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, AIProvider, LocationData } from "../types/report";
import {
  analyzeReport,
  getSavedProvider,
  getSavedApiKey,
} from "../services/aiService";
import { locationService } from "../services/locationService";
import { speechService, RecordingState } from "../services/speechService";
import { Colors } from "../constants/colors";
import { Header } from "../components/Header";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { WebCameraModal } from "../components/WebCameraModal";
import { ApiKeyModal } from "../components/ApiKeyModal";
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  AlertCircle,
  RefreshCw,
  Info,
  Settings,
  Bot,
  MapPin,
  Mic,
  Square,
  Navigation,
  Compass,
} from "lucide-react-native";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "CreateReport">;

export const CreateReportScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState<string>("");
  const [locationInput, setLocationInput] = useState<string>("");
  
  // GPS State
  const [gpsData, setGpsData] = useState<LocationData | undefined>(undefined);
  const [isFetchingGps, setIsFetchingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Voice State
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showWebCamera, setShowWebCamera] = useState<boolean>(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  
  const [provider, setProvider] = useState<AIProvider>("mock");
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    checkAiSettings();
    return () => {
      stopTimer();
      speechService.stopListening();
    };
  }, []);

  const checkAiSettings = async () => {
    const p = await getSavedProvider();
    const key = await getSavedApiKey();
    setProvider(p);
    setHasApiKey(!!key);
  };

  // Timer helpers for voice recording
  const startTimer = () => {
    stopTimer();
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // GPS Location Handler
  const handleGetLocation = async () => {
    setIsFetchingGps(true);
    setGpsError(null);
    const result = await locationService.getCurrentLocation();
    setIsFetchingGps(false);

    if (result.success) {
      setGpsData(result.location);
    } else {
      setGpsError(result.message);
      Alert.alert("Thông báo Vị trí", result.message);
    }
  };

  // Voice Input Handlers
  const handleStartVoice = async () => {
    setVoiceError(null);
    setValidationError(null);

    await speechService.startListening({
      onResult: (text) => {
        stopTimer();
        if (text.trim()) {
          setDescription((prev) => (prev.trim() ? `${prev.trim()} ${text.trim()}` : text.trim()));
        }
      },
      onError: (errMsg) => {
        stopTimer();
        setVoiceError(errMsg);
        Alert.alert("Lỗi ghi âm", errMsg);
      },
      onStateChange: (state) => {
        setRecordingState(state);
        if (state === "recording") {
          startTimer();
        } else {
          stopTimer();
        }
      },
    });
  };

  const handleStopVoice = () => {
    stopTimer();
    speechService.stopListening();
    setRecordingState("idle");
  };

  // Request permissions & launch camera
  const handleTakePhoto = async () => {
    try {
      if (Platform.OS === "web") {
        setShowWebCamera(true);
        return;
      }

      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Yêu cầu quyền truy cập",
          "Cần cấp quyền truy cập máy ảnh để chụp hình hiện trường."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setValidationError(null);
        setAiError(null);
      }
    } catch (err) {
      console.error("Lỗi khi mở camera:", err);
      Alert.alert("Lỗi máy ảnh", "Không thể mở máy ảnh. Vui lòng thử chọn ảnh từ thư viện.");
    }
  };

  // Select photo from photo gallery
  const handleChooseGallery = async () => {
    try {
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e: any) => {
          const file = e.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              setImageUri(reader.result as string);
              setValidationError(null);
              setAiError(null);
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Yêu cầu quyền truy cập",
          "Cần cấp quyền truy cập thư viện ảnh để chọn ảnh."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setValidationError(null);
        setAiError(null);
      }
    } catch (err) {
      console.error("Lỗi khi chọn ảnh:", err);
      Alert.alert("Lỗi", "Không thể mở thư viện ảnh.");
    }
  };

  const handleRemoveImage = () => {
    setImageUri(undefined);
  };

  // Trigger AI Analysis with validation & error handling
  const handleAnalyze = async () => {
    if (isLoading) return; // Block double submission

    if (!imageUri && (!description || description.trim().length === 0)) {
      setValidationError("Vui lòng thêm ảnh hoặc nhập mô tả sự cố.");
      return;
    }

    setValidationError(null);
    setAiError(null);
    setIsLoading(true);

    try {
      const result = await analyzeReport({
        imageUri,
        description,
        location: locationInput,
        gps: gpsData,
        provider,
      });
      setIsLoading(false);

      navigation.navigate("ReportResult", {
        analysisResult: result,
        imageUri,
        gps: gpsData,
      });
    } catch (err: any) {
      console.error("Phân tích AI thất bại:", err);
      setIsLoading(false);
      setAiError(
        err.message || "Không thể kết nối đến AI. Vui lòng kiểm tra Internet và thử lại."
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Tạo báo cáo hiện trường"
        showBack={true}
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => setShowApiKeyModal(true)}
            activeOpacity={0.7}
          >
            <Settings size={18} color={Colors.text} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* AI Provider Banner */}
          <TouchableOpacity
            style={styles.aiConfigBanner}
            onPress={() => setShowApiKeyModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.aiConfigLeft}>
              <Bot size={18} color={provider === "gemini" ? Colors.primary : Colors.muted} style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.aiConfigTitle}>
                  {provider === "gemini" ? "🤖 Chế độ Gemini AI (Real REST API)" : "⚡ Chế độ Mock AI (Offline Demo)"}
                </Text>
                <Text style={styles.aiConfigSub}>
                  {provider === "gemini"
                    ? hasApiKey ? "Đã có API Key • Bấm để cấu hình" : "Chưa có API Key • Bấm để cài đặt"
                    : "Đang chạy mô phỏng NLP • Nhấn để đổi sang Gemini AI"}
                </Text>
              </View>
            </View>
            <Settings size={16} color={Colors.muted} />
          </TouchableOpacity>

          {/* Recommendation Banner */}
          <View style={styles.recommendBanner}>
            <Info size={16} color={Colors.primary} style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={styles.recommendText}>
              Kết hợp ảnh chụp thực tế, giọng nói 🎤 và tọa độ GPS 📍 để AI phân tích chuẩn xác nhất.
            </Text>
          </View>

          {/* Validation Error Banner */}
          {validationError && (
            <View style={styles.errorBanner}>
              <AlertCircle size={18} color={Colors.dangerDark} style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{validationError}</Text>
            </View>
          )}

          {/* AI Error Banner with Retry */}
          {aiError && (
            <View style={styles.aiErrorCard}>
              <View style={styles.aiErrorHeader}>
                <AlertCircle size={20} color={Colors.dangerDark} style={{ marginRight: 8 }} />
                <Text style={styles.aiErrorTitle}>{aiError}</Text>
              </View>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleAnalyze}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <RefreshCw size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Photo Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>Ảnh chụp hiện trường</Text>
            
            {imageUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <View style={styles.previewActions}>
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={handleChooseGallery}
                    activeOpacity={0.7}
                  >
                    <ImageIcon size={14} color={Colors.text} style={{ marginRight: 4 }} />
                    <Text style={styles.changeImageText}>Đổi ảnh khác</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={handleRemoveImage}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={14} color={Colors.dangerDark} style={{ marginRight: 4 }} />
                    <Text style={styles.removeImageText}>Xóa ảnh</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.pickerBox}>
                <Text style={styles.pickerTitle}>Chụp hoặc tải ảnh lên</Text>
                <Text style={styles.pickerSubtitle}>Vui lòng chọn phương thức đính kèm ảnh hiện trường</Text>

                <View style={styles.pickerButtonRow}>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={handleTakePhoto}
                    activeOpacity={0.8}
                  >
                    <Camera size={22} color={Colors.primary} style={{ marginBottom: 6 }} />
                    <Text style={styles.pickerButtonText}>📷 Chụp bằng máy ảnh</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={handleChooseGallery}
                    activeOpacity={0.8}
                  >
                    <ImageIcon size={22} color={Colors.primary} style={{ marginBottom: 6 }} />
                    <Text style={styles.pickerButtonText}>🖼️ Chọn từ thư viện</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Location Input Text (User Provided Location Name) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>Vị trí hiện trường (Tên khu vực)</Text>
            <View style={styles.locationInputWrapper}>
              <MapPin size={18} color={Colors.muted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.locationInput}
                placeholder="Ví dụ: Khu vực Lễ tân, Phòng Server, Nhà vệ sinh Tầng 2"
                placeholderTextColor={Colors.muted}
                value={locationInput}
                onChangeText={setLocationInput}
              />
            </View>
          </View>

          {/* GPS Location Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>📍 Vị trí GPS hiện trường</Text>
              <TouchableOpacity
                style={styles.gpsFetchBtn}
                onPress={handleGetLocation}
                disabled={isFetchingGps}
                activeOpacity={0.8}
              >
                {isFetchingGps ? (
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 4 }} />
                ) : (
                  <Navigation size={14} color={Colors.primary} style={{ marginRight: 4 }} />
                )}
                <Text style={styles.gpsFetchBtnText}>
                  {isFetchingGps ? "Đang lấy..." : gpsData ? "🔄 Cập nhật vị trí" : "📍 Lấy vị trí"}
                </Text>
              </TouchableOpacity>
            </View>

            {gpsData ? (
              <View style={styles.gpsDataCard}>
                <View style={styles.gpsRow}>
                  <Compass size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.gpsCoordinateText}>
                    Lat: <Text style={{ fontWeight: "700" }}>{gpsData.latitude}</Text> | Long: <Text style={{ fontWeight: "700" }}>{gpsData.longitude}</Text>
                  </Text>
                </View>
                {gpsData.accuracy !== undefined && (
                  <Text style={styles.gpsAccuracyText}>
                    Độ chính xác GPS: ±{gpsData.accuracy}m
                  </Text>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.gpsPlaceholderBox}
                onPress={handleGetLocation}
                disabled={isFetchingGps}
                activeOpacity={0.8}
              >
                <Navigation size={20} color={Colors.muted} style={{ marginBottom: 4 }} />
                <Text style={styles.gpsPlaceholderText}>
                  {isFetchingGps ? "Đang định vị tọa độ GPS..." : "Nhấn để tự động lấy tọa độ GPS hiện tại"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Text & Voice Description Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Mô tả hiện trường</Text>

              {/* Voice Action Button */}
              {recordingState === "recording" ? (
                <TouchableOpacity
                  style={styles.voiceStopBtn}
                  onPress={handleStopVoice}
                  activeOpacity={0.8}
                >
                  <Square size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.voiceStopBtnText}>⏹ Dừng ({formatTimer(recordingSeconds)})</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.voiceStartBtn}
                  onPress={handleStartVoice}
                  disabled={recordingState === "processing"}
                  activeOpacity={0.8}
                >
                  <Mic size={14} color={Colors.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.voiceStartBtnText}>
                    {recordingState === "processing" ? "⏳ Đang nhận diện..." : "🎤 Nhập giọng nói"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Voice Status Banners */}
            {recordingState === "recording" && (
              <View style={styles.recordingActiveBanner}>
                <View style={styles.recordingPulse} />
                <Text style={styles.recordingActiveText}>
                  🔴 Đang ghi âm... ({formatTimer(recordingSeconds)})
                </Text>
              </View>
            )}

            {recordingState === "processing" && (
              <View style={styles.processingBanner}>
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.processingBannerText}>
                  ⏳ Đang chuyển giọng nói thành văn bản...
                </Text>
              </View>
            )}

            {recordingState === "error" && voiceError && (
              <View style={styles.voiceErrorBanner}>
                <AlertCircle size={16} color={Colors.dangerDark} style={{ marginRight: 6 }} />
                <Text style={styles.voiceErrorText}>{voiceError}</Text>
                <TouchableOpacity onPress={handleStartVoice}>
                  <Text style={styles.voiceRetryLink}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textArea}
                placeholder="Mô tả chi tiết sự cố bằng bàn phím hoặc nhấn 🎤 để nói..."
                placeholderTextColor={Colors.muted}
                multiline
                numberOfLines={6}
                value={description}
                onChangeText={(val) => {
                  setDescription(val);
                  if (val.trim().length > 0 && validationError) {
                    setValidationError(null);
                  }
                }}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.analyzeButton, isLoading && styles.disabledButton]}
            onPress={handleAnalyze}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Sparkles size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.analyzeButtonText}>
              {isLoading ? "Đang phân tích..." : "Phân tích bằng AI"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Web Camera Modal for Web view */}
      <WebCameraModal
        visible={showWebCamera}
        onCapture={(capturedUri) => {
          setImageUri(capturedUri);
          setShowWebCamera(false);
          setValidationError(null);
          setAiError(null);
        }}
        onClose={() => setShowWebCamera(false)}
      />

      {/* API Key Modal Configuration */}
      <ApiKeyModal
        visible={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSaved={checkAiSettings}
      />

      {/* Loading Modal Screen Lock */}
      <LoadingOverlay visible={isLoading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  aiConfigBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiConfigLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  aiConfigTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
  aiConfigSub: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },
  recommendBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  recommendText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primaryDark,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dangerBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  errorBannerText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dangerDark,
    flex: 1,
  },
  aiErrorCard: {
    backgroundColor: Colors.dangerBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  aiErrorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  aiErrorTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dangerDark,
    flex: 1,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dangerDark,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  pickerBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  pickerSubtitle: {
    fontSize: 12,
    color: Colors.muted,
    marginBottom: 16,
    textAlign: "center",
  },
  pickerButtonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  pickerButton: {
    flex: 1,
    backgroundColor: Colors.surfaceVariant,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  previewContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imagePreview: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: Colors.surfaceVariant,
  },
  previewActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changeImageText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },
  removeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dangerBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeImageText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dangerDark,
  },
  locationInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  locationInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  inputWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  textArea: {
    fontSize: 15,
    color: Colors.text,
    minHeight: 120,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  gpsFetchBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  gpsFetchBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  gpsDataCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  gpsCoordinateText: {
    fontSize: 13,
    color: Colors.text,
  },
  gpsAccuracyText: {
    fontSize: 11,
    color: Colors.muted,
    fontStyle: "italic",
    marginLeft: 22,
  },
  gpsPlaceholderBox: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  gpsPlaceholderText: {
    fontSize: 12,
    color: Colors.muted,
    textAlign: "center",
  },
  voiceStartBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  voiceStartBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  voiceStopBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dangerDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  voiceStopBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  recordingActiveBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dangerBg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  recordingPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dangerDark,
    marginRight: 8,
  },
  recordingActiveText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.dangerDark,
  },
  processingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  processingBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primaryDark,
  },
  voiceErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warningBg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  voiceErrorText: {
    fontSize: 12,
    color: Colors.warningDark,
    flex: 1,
  },
  voiceRetryLink: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primaryDark,
    marginLeft: 8,
    textDecorationLine: "underline",
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
