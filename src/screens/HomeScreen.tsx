import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, FieldReport } from "../types/report";
import { storageService } from "../services/storageService";
import { Colors } from "../constants/colors";
import { ReportCard } from "../components/ReportCard";
import { EmptyState } from "../components/EmptyState";
import { ConfirmationModal } from "../components/ConfirmationModal";
import {
  Plus,
  History,
  Bot,
  Sparkles,
  ShieldAlert,
  ArrowRight,
} from "lucide-react-native";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<FieldReport | null>(null);

  const loadReports = async () => {
    try {
      const data = await storageService.getReports();
      setReports(data);
    } catch (err) {
      console.error("Không thể tải danh sách báo cáo", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const handleConfirmDelete = async () => {
    if (reportToDelete) {
      await storageService.deleteReport(reportToDelete.id);
      setReportToDelete(null);
      await loadReports();
    }
  };

  const recentReports = reports.slice(0, 3);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Bot size={22} color="#FFFFFF" />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>AI Field Assistant</Text>
              <View style={styles.aiBadge}>
                <Sparkles size={10} color={Colors.primary} style={{ marginRight: 3 }} />
                <Text style={styles.aiBadgeText}>MVP</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>Trợ lý Báo cáo Hiện trường Thông minh</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.historyIconButton}
          onPress={() => navigation.navigate("History")}
          activeOpacity={0.7}
        >
          <History size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <ShieldAlert size={14} color={Colors.primary} style={{ marginRight: 5 }} />
            <Text style={styles.heroBadgeText}>Phân tích AI tức thì</Text>
          </View>
          
          <Text style={styles.heroTitle}>Tự động hóa báo cáo sự cố hiện trường</Text>
          <Text style={styles.heroDescription}>
            Chụp ảnh hoặc nhập mô tả nhanh. Mô hình AI sẽ trích xuất danh mục, mức độ ưu tiên, vị trí và các bước xử lý đề xuất ngay lập tức.
          </Text>

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate("CreateReport")}
            activeOpacity={0.85}
          >
            <Plus size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.createButtonText}>Tạo báo cáo</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Reports Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Báo cáo gần đây</Text>
          {reports.length > 0 && (
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => navigation.navigate("History")}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>Xem tất cả ({reports.length})</Text>
              <ArrowRight size={14} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* List or Empty State */}
        {recentReports.length > 0 ? (
          recentReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onPress={(r) => navigation.navigate("ReportDetail", { reportId: r.id })}
              onDeletePress={(r) => setReportToDelete(r)}
            />
          ))
        ) : (
          <EmptyState
            title="Chưa có báo cáo gần đây"
            description="Bắt đầu bằng cách bấm + Tạo báo cáo để phân tích sự cố hiện trường đầu tiên."
            buttonText="+ Tạo báo cáo"
            onButtonPress={() => navigation.navigate("CreateReport")}
          />
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={!!reportToDelete}
        title="Xóa báo cáo"
        message={`Bạn có chắc chắn muốn xóa báo cáo "${reportToDelete?.issue}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy bỏ"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setReportToDelete(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.4,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  brandSubtitle: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 1,
  },
  historyIconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  heroDescription: {
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 21,
    marginBottom: 20,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
    marginRight: 4,
  },
});
