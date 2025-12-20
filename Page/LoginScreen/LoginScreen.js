import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal, // Tambah Modal
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons"; // Tambah Ionicons
import { useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- KOMPONEN ALERT MODERN (Re-usable dalam file ini) ---
const CustomAlert = ({ visible, title, message, type, onClose }) => {
  const isError = type === "error";
  const iconName = isError ? "close-circle" : "information-circle";
  const iconColor = isError ? "#F44336" : "#2196F3";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Ionicons
            name={iconName}
            size={60}
            color={iconColor}
            style={{ marginBottom: 10 }}
          />
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: iconColor }]}
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  // State untuk Custom Alert
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const navigate = useNavigate();

  // Helper untuk memanggil alert
  const showAlert = (title, message, type = "info") => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  const handleLogin = async () => {
    if (!username || !password) {
      // GANTI alert() BIASA
      showAlert(
        "Data Belum Lengkap",
        "Username dan Password tidak boleh kosong.",
        "error"
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://restful-api-bmc-production-v2.up.railway.app/api/login-pasien`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Username atau Password salah.");
      }

      setIsLoading(false);

      if (data.token) {
        await AsyncStorage.setItem("userToken", data.token);
        console.log("Token berhasil disimpan!");
      } else {
        throw new Error("Token tidak ada di server.");
      }

      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        navigate("/home");
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      // GANTI alert() BIASA
      showAlert("Gagal Masuk", error.message, "error");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* --- CUSTOM ALERT --- */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={closeAlert}
      />

      {/* ============================ */}
      {/* POPUP SUKSES           */}
      {/* ============================ */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <FontAwesome name="check-circle" size={55} color="#4CAF50" />
            <Text style={styles.successTitle}>Login Berhasil</Text>
          </View>
        </View>
      )}

      {/* ============================ */}
      {/* HEADER            */}
      {/* ============================ */}
      <View style={styles.header}>
        <Image source={require("../../assets/Logo.png")} style={styles.logo} />
        <View style={styles.textBlock}>
          <Text style={styles.title}>Ruang</Text>
          <Text style={styles.subtitle}>Bunda</Text>
        </View>
      </View>

      {/* IMAGE ATAS */}
      <View style={styles.imageWrapper}>
        <Image
          source={require("../../assets/Dokter.png")}
          style={styles.doctorImage}
        />
      </View>

      {/* FORM */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>Login</Text>

          {/* USERNAME */}
          <Text style={styles.label}>Username:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor="#ccc"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <FontAwesome
              name="user"
              size={20}
              color="#fff"
              style={styles.icon}
            />
          </View>

          {/* PASSWORD */}
          <Text style={styles.label}>Password:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#ccc"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <FontAwesome
                name={showPassword ? "eye-slash" : "eye"}
                size={20}
                color="#fff"
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F6F2",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  // STYLES ALERT & MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginVertical: 15,
    lineHeight: 22,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  // STYLES LAMA (TIDAK DIUBAH)
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  successBox: {
    width: 260,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: "center",
    elevation: 8,
  },
  successTitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
    marginLeft: 20,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  logo: {
    width: 55,
    height: 55,
    resizeMode: "contain",
    marginRight: 6,
  },
  textBlock: { flexDirection: "column" },
  title: { fontSize: 22, fontWeight: "bold", color: "#000" },
  subtitle: { fontSize: 22, fontWeight: "bold", color: "#2196F3" },

  imageWrapper: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  doctorImage: {
    width: "100%",
    height: 500,
    resizeMode: "contain",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    width: "100%",
  },
  loginCard: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    width: "100%",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingVertical: 70,
    paddingHorizontal: 25,
    alignItems: "center",
    elevation: 4,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
    marginTop: -30,
  },

  label: {
    alignSelf: "flex-start",
    marginTop: 10,
    marginBottom: -10,
    fontSize: 14,
    color: "#000",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#448AFF",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginTop: 20,
    width: "97%",
    height: 45,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
  },
  icon: { marginLeft: 10 },

  loginButton: {
    backgroundColor: "#448AFF",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 45,
    marginTop: 20,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
