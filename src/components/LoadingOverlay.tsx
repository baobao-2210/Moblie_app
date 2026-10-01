import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, Modal } from "react-native";
import { Colors } from "../constants/colors";
import { Bot, Sparkles } from "lucide-react-native";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  subMessage?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = "AI đang phân tích báo cáo của bạn...",
  subMessage = "Đang trích xuất danh mục, mức độ ưu tiên và hành động đề xuất",
}) => {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Bot size={32} color={Colors.primary} />
            <View style={styles.sparkleBadge}>
              <Sparkles size={14} color="#FFFFFF" />
            </View>
          </View>

          <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />

          <Text style={styles.messageText}>{message}</Text>
          {subMessage ? <Text style={styles.subText}>{subMessage}</Text> : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    position: "relative",
  },
  sparkleBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 4,
  },
  spinner: {
    marginBottom: 16,
  },
  messageText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 6,
  },
  subText: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 18,
  },
});
