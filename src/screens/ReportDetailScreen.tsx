import React, { useState, useEffect } from "react";
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
import { RootStackParamList, FieldReport, PriorityLevel, getPriorityVietnameseLabel } from "../types/report";
import { storageService } from "../services/storageService";
import { Colors } from "../constants/colors";
import { Header } from "../components/Header";
import { ConfirmationModal } from "../components/ConfirmationModal";
import {
  Save,
  Trash2,
  CheckCircle2,
  Calendar,
  Navigation,
  Compass,
} from "lucide-react-native";

type RouteProps = RouteProp<RootStackParamList, "ReportDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ReportDetail">;

export const ReportDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { reportId } = route.params;

  const [report, setReport] = useState<FieldReport | null>(null);
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [priority, setPriority] = useState<PriorityLevel>("Medium");
  const [issue, setIssue] = useState<string>("");
  const [suggestedAction, setSuggestedAction] = useState<string>("");
  const [summary, setSummary] = useState<string>("");

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchReport = async () => {
      const data = await storageService.getReportById(reportId);
      if (data) {
        setReport(data);
        setCategory(data.category);
        setLocation(data.location);
        setPriority(data.priority);
        setIssue(data.issue);
        setSuggestedAction(data.suggestedAction);
        setSummary(data.summary);
      } else {
        Alert.alert("Lỗi", "Không tìm thấy báo cáo.");
        navigation.goBack();
      }
    };
    fetchReport();
  }, [reportId]);

  if (!report) return null;

  const priorityOptions: PriorityLevel[] = ["Low", "Medium", "High"];

  const handleUpdate = async () => {
    if (!issue.trim()) {
      Alert.alert("Lỗi nhập liệu", "Trường sự cố ghi nhận không được để trống.");
      return;
    }

    setIsSaving(true);
    try {
      const updatedReport: FieldReport = {
        ...report,
        category,
        location,
        priority,
        issue,
        suggestedAction,
        summary,
      };

      await storageService.updateReport(updatedReport);
      setIsSaving(false);
      Alert.alert("Thành công", "Đã cập nhật báo cáo thành công.");
      navigation.goBack();
    } catch (err) {
      console.error("Cập nhật báo cáo thất bại:", err);
      setIsSaving(false);
      Alert.alert("Lỗi", "Không thể cập nhật báo cáo.");
    }
  };

  const handleDelete = async () => {
    try {
      await storageService.deleteReport(report.id);
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (err) {
      console.error("Xóa báo cáo thất bại:", err);
      Alert.alert("Lỗi", "Không thể xóa báo cáo.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Chi tiết báo cáo"
        subtitle={`Mã: ${report.id.substring(0, 14)}...`}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.deleteIconButton}
            onPress={() => setShowDeleteModal(true)}
            activeOpacity={0.7}
          >
            <Trash2 size={18} color={Colors.dangerDark} />
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
          {/* Metadata Bar */}
          <View style={styles.metaCard}>
            <View style={styles.metaItem}>
              <Calendar size={14} color={Colors.muted} style={{ marginRight: 6 }} />
              <Text style={styles.metaItemText}>
                Tạo lúc: {new Date(report.createdAt).toLocaleString("vi-VN")}
              </Text>
            </View>

            {report.gps ? (
              <View style={[styles.metaItem, { marginTop: 6 }]}>
                <Navigation size={14} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.metaItemText}>
                  Tọa độ GPS: <Text style={{ fontWeight: "700" }}>{report.gps.latitude}, {report.gps.longitude}</Text> (±{report.gps.accuracy || "N/A"}m)
                </Text>
              </View>
            ) : (
              <View style={[styles.metaItem, { marginTop: 6 }]}>
                <Compass size={14} color={Colors.muted} style={{ marginRight: 6 }} />
                <Text style={styles.metaItemText}>Tọa độ GPS: Chưa có dữ liệu vị trí</Text>
              </View>
            )}
          </View>

          {/* Photo if available */}
          {report.imageUri && (
            <View style={styles.imageCard}>
              <Image source={{ uri: report.imageUri }} style={styles.thumbnail} />
            </View>
          )}

          {/* Category */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Danh mục sự cố</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={category}
                onChangeText={setCategory}
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Vị trí / Khu vực</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* Priority */}
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

          {/* Issue */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Sự cố ghi nhận</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={issue}
                onChangeText={setIssue}
              />
            </View>
          </View>

          {/* Suggested Action */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Đề xuất hành động xử lý</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={suggestedAction}
                onChangeText={setSuggestedAction}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Summary */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Tóm tắt báo cáo</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={summary}
                onChangeText={setSummary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.disabledButton]}
            onPress={handleUpdate}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            <Save size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.saveButtonText}>
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        title="Xóa báo cáo"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn báo cáo này không?"
        confirmText="Xóa"
        cancelText="Hủy bỏ"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  deleteIconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.dangerBg,
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
  metaCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItemText: {
    fontSize: 13,
    color: Colors.muted,
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
    height: 200,
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
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
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
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
