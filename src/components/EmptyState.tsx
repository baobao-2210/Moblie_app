import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "../constants/colors";
import { FileSearch, Plus } from "lucide-react-native";

interface EmptyStateProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onButtonPress?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "Chưa có báo cáo hiện trường",
  description = "Chụp ảnh hoặc nhập mô tả sự cố hiện trường để AI hỗ trợ khởi tạo báo cáo tự động cho bạn.",
  buttonText = "Tạo báo cáo mới",
  onButtonPress,
  icon,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        {icon || <FileSearch size={36} color={Colors.primary} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text
        style={[
          styles.description,
          !onButtonPress && { marginBottom: 0 },
        ]}
      >
        {description}
      </Text>

      {onButtonPress && (
        <TouchableOpacity
          style={styles.button}
          onPress={onButtonPress}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    marginVertical: 12,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 280,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
