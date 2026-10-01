import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { FieldReport, PriorityLevel, getPriorityVietnameseLabel } from "../types/report";
import { Colors } from "../constants/colors";
import { MapPin, Clock, Trash2, ChevronRight, AlertCircle } from "lucide-react-native";

interface ReportCardProps {
  report: FieldReport;
  onPress: (report: FieldReport) => void;
  onDeletePress?: (report: FieldReport) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onPress,
  onDeletePress,
}) => {
  const getPriorityColors = (priority: PriorityLevel) => {
    switch (priority) {
      case "High":
        return { bg: Colors.priorityHighBg, text: Colors.priorityHigh };
      case "Medium":
        return { bg: Colors.priorityMediumBg, text: Colors.priorityMedium };
      case "Low":
      default:
        return { bg: Colors.priorityLowBg, text: Colors.priorityLow };
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const priorityStyle = getPriorityColors(report.priority);
  const priorityLabel = getPriorityVietnameseLabel(report.priority);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(report)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText} numberOfLines={1}>
            {report.category}
          </Text>
        </View>

        {report.confidence !== undefined && (
          <View style={styles.cardConfidenceBadge}>
            <Text style={styles.cardConfidenceText}>
              AI {Math.round(report.confidence * 100)}%
            </Text>
          </View>
        )}

        <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
          <AlertCircle size={12} color={priorityStyle.text} style={{ marginRight: 4 }} />
          <Text style={[styles.priorityText, { color: priorityStyle.text }]}>
            {priorityLabel}
          </Text>
        </View>
      </View>

      <View style={styles.bodyRow}>
        {report.imageUri ? (
          <Image source={{ uri: report.imageUri }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.thumbnailPlaceholderText}>Không có ảnh</Text>
          </View>
        )}

        <View style={styles.contentContainer}>
          <Text style={styles.issueTitle} numberOfLines={2}>
            {report.issue}
          </Text>

          <View style={styles.metaRow}>
            <MapPin size={13} color={Colors.muted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {report.location}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Clock size={13} color={Colors.muted} />
            <Text style={styles.metaText}>{formatDate(report.createdAt)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        {onDeletePress && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              onDeletePress(report);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={16} color={Colors.dangerDark} />
            <Text style={styles.deleteButtonText}>Xóa</Text>
          </TouchableOpacity>
        )}

        <View style={styles.viewDetailLink}>
          <Text style={styles.viewDetailText}>Xem báo cáo</Text>
          <ChevronRight size={16} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryContainer: {
    flex: 1,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardConfidenceBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  cardConfidenceText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "700",
  },
  bodyRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: Colors.surfaceVariant,
    marginRight: 14,
  },
  thumbnailPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: Colors.surfaceVariant,
    marginRight: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  thumbnailPlaceholderText: {
    fontSize: 10,
    color: Colors.muted,
    textAlign: "center",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  issueTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: Colors.muted,
    marginLeft: 5,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: Colors.dangerBg,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dangerDark,
    marginLeft: 4,
  },
  viewDetailLink: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
  },
  viewDetailText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
    marginRight: 2,
  },
});
