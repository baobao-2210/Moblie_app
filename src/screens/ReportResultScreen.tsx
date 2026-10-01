import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, PriorityLevel, getPriorityVietnameseLabel } from "../types/report";
import { storageService } from "../services/storageService";
import { Colors } from "../constants/colors";
import { Header } from "../components/Header";
import {
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Navigation,
  Compass,
} from "lucide-react-native";

type RouteProps = RouteProp<RootStackParamList, "ReportResult">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ReportResult">;

export const ReportResultScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();

  const { analysisResult, imageUri, existingReportId } = route.params;

  // Editable Form State prefilled with AI result
  const [category, setCategory] = useState<string>(analysisResult.category || "");
  const [location, setLocation] = useState<string>(analysisResult.location || "");
  const [priority, setPriority] = useState<PriorityLevel>(analysisResult.priority || "Medium");
  const [issue, setIssue] = useState<string>(analysisResult.issue || "");
  const [suggestedAction, setSuggestedAction] = useState<string>(
    analysisResult.suggestedAction || ""
  );
  const [summary, setSummary] = useState<string>(analysisResult.summary || "");

  const [isSaving, setIsSaving] = useState<boolean>(false);

  const priorityOptions: PriorityLevel[] = ["Low", "Medium", "High"];

  const handleSaveReport = async () => {
    if (!issue.trim()) {
      Alert.alert("Lỗi nhập liệu", "Vui lòng nhập tiêu đề sự cố hợp lệ.");
      return;
    }

    setIsSaving(true);
    try {
      await storageService.saveReport({
        id: existingReportId,
        imageUri,
        category: category.trim() || "Bảo trì chung",
        location: location.trim() || "Chưa xác định vị trí",
        priority,
        issue: issue.trim(),
        suggestedAction: suggestedAction.trim(),
        summary: summary.trim(),
        confidence: analysisResult.confidence,
        missingInformation: analysisResult.missingInformation,
        gps: route.params.gps,
      });

      setIsSaving(false);
      
      // Navigate to History page after saving as requested in specs
      navigation.reset({
        index: 1,
        routes: [{ name: "Home" }, { name: "History" }],
      });
    } catch (err) {
      console.error("Lưu báo cáo thất bại:", err);
      setIsSaving(false);
      Alert.alert("Lỗi", "Không thể lưu báo cáo hiện trường. Vui lòng thử lại.");
    }
  };

  const handleAnalyzeAgain = () => {
    navigation.navigate("CreateReport");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Kết quả phân tích AI"
        subtitle="Xem và chỉnh sửa báo cáo trước khi lưu"
        showBack={true}
        onBackPress={() => navigation.goBack()}
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
          {/* AI Banner Disclaimer & Confidence Badge */}
          <View style={styles.aiNoticeCard}>
            <View style={styles.aiNoticeHeader}>
              <Sparkles size={16} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.aiNoticeTitle}>Bản thảo tự động tạo bởi AI</Text>
              {analysisResult.confidence !== undefined && (
                <View
                  style={[
                    styles.confidenceBadge,
                    {
                      backgroundColor:
                        analysisResult.confidence >= 0.9
                          ? Colors.successBg
                          : analysisResult.confidence >= 0.7
                          ? Colors.warningBg
                          : Colors.dangerBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.confidenceBadgeText,
                      {
                        color:
                          analysisResult.confidence >= 0.9
                            ? Colors.successDark
                            : analysisResult.confidence >= 0.7
                            ? Colors.warningDark
                            : Colors.dangerDark,
                      },
                    ]}
                  >
                    AI: {Math.round(analysisResult.confidence * 100)}%
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.aiNoticeText}>
              Vui lòng kiểm tra và chỉnh sửa các trường dữ liệu bên dưới để đảm bảo tính chính xác trước khi lưu chính thức.
            </Text>

            {/* Low Confidence Warning */}
            {analysisResult.confidence !== undefined && analysisResult.confidence < 0.7 && (
              <View style={styles.warningBanner}>
                <AlertTriangle size={16} color={Colors.warningDark} style={{ marginRight: 6 }} />
                <Text style={styles.warningBannerText}>
                  AI chưa chắc chắn về kết quả (độ tin cậy {"<"} 70%). Vui lòng kiểm tra kỹ các thông tin bên dưới.
                </Text>
              </View>
            )}
          </View>

          {/* Missing Information Banner if detected */}
          {analysisResult.missingInformation && analysisResult.missingInformation.length > 0 && (
            <View style={styles.missingInfoCard}>
              <View style={styles.missingInfoHeader}>
                <AlertCircle size={18} color={Colors.warningDark} style={{ marginRight: 6 }} />
                <Text style={styles.missingInfoTitle}>⚠️ Phát hiện thông tin chưa đầy đủ</Text>
              </View>
              <Text style={styles.missingInfoText}>
                AI chưa xác định được: <Text style={{ fontWeight: "700" }}>{analysisResult.missingInformation.join(", ")}</Text>.
              </Text>
              <Text style={styles.missingInfoSubText}>
                Bạn có thể tự nhập bổ sung vào các ô bên dưới hoặc nhấn "Phân tích lại".
              </Text>
            </View>
          )}

          {/* GPS Location Data Card if available */}
          {route.params.gps ? (
            <View style={styles.gpsInfoCard}>
              <View style={styles.gpsInfoHeader}>
                <Navigation size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.gpsInfoTitle}>📍 Tọa độ GPS hiện trường</Text>
              </View>
              <Text style={styles.gpsInfoText}>
                Lat: <Text style={{ fontWeight: "700" }}>{route.params.gps.latitude}</Text> | Long: <Text style={{ fontWeight: "700" }}>{route.params.gps.longitude}</Text>
              </Text>
              {route.params.gps.accuracy !== undefined && (
                <Text style={styles.gpsInfoSubText}>
                  Độ chính xác định vị: ±{route.params.gps.accuracy}m
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.gpsInfoCardDisabled}>
              <Compass size={16} color={Colors.muted} style={{ marginRight: 6 }} />
              <Text style={styles.gpsInfoDisabledText}>
                📍 Chưa ghi nhận tọa độ GPS cho báo cáo này
              </Text>
            </View>
          )}

          {/* Optional Thumbnail Preview */}
          {imageUri && (
            <View style={styles.imageCard}>
              <Image source={{ uri: imageUri }} style={styles.thumbnail} />
            </View>
          )}

          {/* Category Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Danh mục sự cố</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={category}
                onChangeText={setCategory}
                placeholder="Ví dụ: Hư hỏng thiết bị"
                placeholderTextColor={Colors.muted}
              />
            </View>
          </View>

          {/* Location Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Vị trí / Khu vực</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Ví dụ: Khu vực Lễ tân, Phòng Server"
                placeholderTextColor={Colors.muted}
              />
            </View>
          </View>

          {/* Priority Level Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Mức độ ưu tiên</Text>
            <View style={styles.prioritySelectorRow}>
              {priorityOptions.map((option) => {
                const isSelected = priority === option;
                let activeColor = Colors.priorityLow;
                let activeBg = Colors.priorityLowBg;
                if (option === "Medium") {
                  activeColor = Colors.priorityMedium;
                  activeBg = Colors.priorityMediumBg;
                } else if (option === "High") {
                  activeColor = Colors.priorityHigh;
                  activeBg = Colors.priorityHighBg;
                }

                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.priorityOption,
                      isSelected && {
                        backgroundColor: activeBg,
                        borderColor: activeColor,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setPriority(option)}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <CheckCircle2
                        size={14}
                        color={activeColor}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.priorityOptionText,
                        isSelected && { color: activeColor, fontWeight: "800" },
                      ]}
                    >
                      {getPriorityVietnameseLabel(option)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Issue Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Sự cố ghi nhận</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={issue}
                onChangeText={setIssue}
                placeholder="Tóm tắt ngắn gọn sự cố phát hiện"
                placeholderTextColor={Colors.muted}
              />
            </View>
          </View>

          {/* Suggested Action Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Đề xuất hành động xử lý</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={suggestedAction}
                onChangeText={setSuggestedAction}
                placeholder="Các bước khuyến nghị để khắc phục"
                placeholderTextColor={Colors.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Executive Summary Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Tóm tắt báo cáo</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={summary}
                onChangeText={setSummary}
                placeholder="Tóm tắt tổng quan báo cáo hiện trường"
                placeholderTextColor={Colors.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.reanalyzeButton}
              onPress={handleAnalyzeAgain}
              activeOpacity={0.8}
            >
              <RotateCcw size={18} color={Colors.text} style={{ marginRight: 6 }} />
              <Text style={styles.reanalyzeText}>Phân tích lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.disabledButton]}
              onPress={handleSaveReport}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <Save size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveButtonText}>
                {isSaving ? "Đang lưu..." : "Lưu báo cáo"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  aiNoticeCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  aiNoticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  aiNoticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primaryDark,
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  confidenceBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  aiNoticeText: {
    fontSize: 12,
    color: Colors.primaryDark,
    lineHeight: 17,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warningBg,
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  warningBannerText: {
    fontSize: 12,
    color: Colors.warningDark,
    fontWeight: "600",
    flex: 1,
  },
  missingInfoCard: {
    backgroundColor: Colors.warningBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  missingInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  missingInfoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.warningDark,
  },
  missingInfoText: {
    fontSize: 13,
    color: Colors.warningDark,
    marginBottom: 4,
    lineHeight: 18,
  },
  missingInfoSubText: {
    fontSize: 12,
    color: Colors.muted,
    fontStyle: "italic",
  },
  imageCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbnail: {
    width: "100%",
    height: 180,
    borderRadius: 10,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  inputContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textInput: {
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    minHeight: 70,
  },
  prioritySelectorRow: {
    flexDirection: "row",
    gap: 10,
  },
  priorityOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priorityOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.muted,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  reanalyzeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceVariant,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reanalyzeText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  gpsInfoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gpsInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  gpsInfoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
  gpsInfoText: {
    fontSize: 13,
    color: Colors.text,
    marginLeft: 22,
  },
  gpsInfoSubText: {
    fontSize: 11,
    color: Colors.muted,
    fontStyle: "italic",
    marginLeft: 22,
    marginTop: 2,
  },
  gpsInfoCardDisabled: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gpsInfoDisabledText: {
    fontSize: 12,
    color: Colors.muted,
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
