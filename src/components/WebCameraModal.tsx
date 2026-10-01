import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from "react-native";
import { Colors } from "../constants/colors";
import { Camera, X, RefreshCw } from "lucide-react-native";

interface WebCameraModalProps {
  visible: boolean;
  onCapture: (imageUri: string) => void;
  onClose: () => void;
}

export const WebCameraModal: React.FC<WebCameraModalProps> = ({
  visible,
  onCapture,
  onClose,
}) => {
  const videoRef = useRef<any>(null);
  const [stream, setStream] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible && Platform.OS === "web") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [visible]);

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      } else {
        setErrorMsg("Trình duyệt không hỗ trợ truy cập máy ảnh webcam.");
      }
    } catch (err: any) {
      console.error("Lỗi webcam:", err);
      setErrorMsg("Không thể kết nối máy ảnh. Vui lòng kiểm tra quyền webcam trình duyệt.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track: any) => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        stopCamera();
        onCapture(dataUrl);
      }
    } catch (err) {
      console.error("Lỗi chụp ảnh canvas:", err);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Camera size={20} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.title}>Máy ảnh hiện trường</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Video Feed */}
          <View style={styles.videoContainer}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={startCamera}>
                  <RefreshCw size={14} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.retryBtnText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "320px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  backgroundColor: "#000",
                }}
              />
            )}
          </View>

          {/* Capture Controls */}
          {!errorMsg && (
            <View style={styles.controls}>
              <TouchableOpacity style={styles.captureBtn} onPress={takePhoto} activeOpacity={0.85}>
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>
              <Text style={styles.instruction}>Nhấn nút tròn để chụp ảnh hiện trường</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 500,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  videoContainer: {
    width: "100%",
    height: 320,
    borderRadius: 14,
    backgroundColor: "#0F172A",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  errorBox: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: Colors.dangerDark,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 14,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 13,
  },
  controls: {
    alignItems: "center",
    marginTop: 18,
  },
  captureBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  captureBtnInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
  },
  instruction: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 10,
  },
});
