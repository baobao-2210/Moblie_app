import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
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
import { Header } from "../components/Header";
import { ReportCard } from "../components/ReportCard";
import { EmptyState } from "../components/EmptyState";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { Search, Plus, X } from "lucide-react-native";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "History">;

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [reports, setReports] = useState<FieldReport[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [reportToDelete, setReportToDelete] = useState<FieldReport | null>(null);

  const loadReports = async () => {
    try {
      const data = await storageService.getReports();
      setReports(data);
    } catch (err) {
      console.error("Lỗi khi tải lịch sử báo cáo:", err);
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

  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.issue.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      r.priority.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <Header
        title="Lịch sử báo cáo"
        subtitle={`Tổng số ${reports.length} báo cáo đã lưu`}
        showBack={true}
        onBackPress={() => navigation.navigate("Home")}
        rightAction={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("CreateReport")}
            activeOpacity={0.8}
          >
            <Plus size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.container}>
        {/* Search Bar */}
        {reports.length > 0 && (
          <View style={styles.searchContainer}>
            <Search size={18} color={Colors.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm theo sự cố, danh mục hoặc vị trí..."
              placeholderTextColor={Colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={Colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onPress={(r) => navigation.navigate("ReportDetail", { reportId: r.id })}
                onDeletePress={(r) => setReportToDelete(r)}
              />
            ))
          ) : reports.length > 0 && searchQuery.length > 0 ? (
            <EmptyState
              title="Không tìm thấy báo cáo phù hợp"
              description={`Không tìm thấy báo cáo nào khớp với từ khóa "${searchQuery}". Hãy thử xóa bộ lọc tìm kiếm.`}
              buttonText="Xóa bộ lọc"
              onButtonPress={() => setSearchQuery("")}
            />
          ) : (
            <EmptyState
              title="Lịch sử báo cáo trống"
              description="Bạn chưa lưu báo cáo hiện trường nào. Tạo báo cáo mới ngay để bắt đầu theo dõi sự cố."
              buttonText="+ Tạo báo cáo mới"
              onButtonPress={() => navigation.navigate("CreateReport")}
            />
          )}
        </ScrollView>
      </View>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={!!reportToDelete}
        title="Xóa báo cáo đã lưu"
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
  container: {
    flex: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
});
