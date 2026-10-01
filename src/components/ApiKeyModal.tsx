import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { Colors } from "../constants/colors";
import {
  getSavedApiKey,
  saveApiKey,
  getSavedProvider,
  saveProvider,
} from "../services/aiService";
import { AIProvider } from "../types/report";
import { Bot, Key, Sparkles, X, Check } from "lucide-react-native";

interface ApiKeyModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  visible,
  onClose,
  onSaved,
}) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [provider, setProvider] = useState<AIProvider>("mock");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    const key = await getSavedApiKey();
    const p = await getSavedProvider();
    setApiKey(key);
    setProvider(p);
  };

  const handleSave = async () => {
    if (provider === "gemini" && !apiKey.trim()) {
      Alert.alert(
        "Gemini API Key chưa cấu hình",
        "Vui lòng nhập Google Gemini API Key để chuyển sang chế độ Gemini AI."
      );
      return;
    }

    setIsSaving(true);
    await saveApiKey(apiKey.trim());
    await saveProvider(provider);
    setIsSaving(false);

    if (onSaved) onSaved();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Bot size={22} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.title}>Cấu hình AI Provider</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Toggle Switch */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.modeTitleRow}>
                <Sparkles size={14} color={provider === "gemini" ? Colors.primary : Colors.muted} style={{ marginRight: 4 }} />
                <Text style={styles.modeTitle}>
                  {provider === "gemini" ? "Gemini AI Mode" : "Mock AI Mode"}
                </Text>
              </View>
              <Text style={styles.modeSubtitle}>
                {provider === "gemini"
                  ? "Sử dụng mô hình Google Gemini REST API trực tiếp."
                  : "Dùng bộ mô phỏng NLP offline không cần API key."}
              </Text>
            </View>
            <Switch
              value={provider === "gemini"}
              onValueChange={(val) => setProvider(val ? "gemini" : "mock")}
              trackColor={{ false: Colors.border, true: Colors.primaryBorder }}
              thumbColor={provider === "gemini" ? Colors.primary : Colors.muted}
            />
          </View>

          {/* Key Input (Shown if Gemini mode is selected) */}
          {provider === "gemini" && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Google Gemini API Key</Text>
              <View style={styles.inputWrapper}>
                <Key size={16} color={Colors.muted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  placeholder="Dán API Key (EXPO_PUBLIC_GEMINI_API_KEY) vào đây"
                  placeholderTextColor={Colors.muted}
                  value={apiKey}
                  onChangeText={setApiKey}
                  secureTextEntry={false}
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.helpText}>
                Lấy API Key miễn phí tại: https://aistudio.google.com/app/apikey hoặc cấu hình trong file .env
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>Lưu cấu hình</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 22,
    width: "100%",
    maxWidth: 380,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceVariant,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  modeSubtitle: {
    fontSize: 11,
    color: Colors.muted,
    lineHeight: 15,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  helpText: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 6,
    lineHeight: 15,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
