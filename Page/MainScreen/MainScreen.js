import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Easing,
  TouchableOpacity,
  Vibration,
  // Alert, // Gak pake Alert bawaan lagi
  Modal, // Pake Modal custom
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  COLORS,
  BASE_URL_PATIENT,
  getTokenFromStorage,
  decodeJwtPayload,
  cleanNumberString,
  getDjjStatus,
  getDilatationPhase,
  getLatestFilledPartografData,
  SHADOW_STYLE,
} from "../../utils/global";

import HeaderTop from "../../components/HeaderTop";
import HeaderGradient from "../../components/HeaderGradient";
import MidwifeCard from "../../components/MidwifeCard";
import DilatationVisualizer from "../../components/DilatationVisualizer";
import DjjStatusCard from "../../components/DjjStatusCard";
import IbuStatusCard from "../../components/IbuStatusCard";
import BottomTabBar from "../../components/BottomTabBar";

// ==========================================
// 0. COMPONENT ALERT MODERN (CUSTOM)
// ==========================================
const ModernAlert = ({ visible, title, message, type, actions }) => {
  if (!visible) return null;

  // Tentukan Icon & Warna
  let iconName = "alert-circle";
  let color = COLORS.primaryBlue;

  if (type === "success") {
    iconName = "checkmark-circle";
    color = COLORS.accentSuccess;
  } else if (type === "error") {
    iconName = "warning";
    color = COLORS.accentError;
  }

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Ionicons name={iconName} size={60} color={color} />
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>

          <View style={styles.modalActions}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalBtn,
                  action.style === "cancel"
                    ? styles.modalBtnCancel
                    : { backgroundColor: color },
                ]}
                onPress={action.onPress}
              >
                <Text
                  style={[
                    styles.modalBtnText,
                    action.style === "cancel"
                      ? { color: COLORS.textSecondary }
                      : { color: "white" },
                  ]}
                >
                  {action.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ==========================================
// 1. SUB-COMPONENT: PANDUAN NAPAS
// ==========================================
const BreathingGuide = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [textGuide, setTextGuide] = useState("Tarik Napas...");

  useEffect(() => {
    let isMounted = true;
    const breathe = () => {
      if (!isMounted) return;
      setTextGuide("Tarik Napas... 😤");
      Animated.timing(scaleAnim, {
        toValue: 1.4,
        duration: 4000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }).start(() => {
        if (!isMounted) return;
        setTextGuide("Hembuskan Perlahan... 😮‍💨");
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }).start(() => breathe());
      });
    };
    breathe();
    return () => {
      isMounted = false;
    };
  }, [scaleAnim]);

  return (
    <View style={styles.breathingContainer}>
      <Text style={styles.breathingTitle}>Panduan Napas & Rileks</Text>
      <View style={styles.circleWrapper}>
        <Animated.View
          style={[
            styles.breathingCircle,
            { transform: [{ scale: scaleAnim }] },
          ]}
        />
        <Text style={styles.breathingText}>{textGuide}</Text>
      </View>
      <Text style={styles.breathingSub}>
        Ikuti ritme lingkaran untuk mengurangi nyeri kontraksi.
      </Text>
    </View>
  );
};

// ==========================================
// 2. SUB-COMPONENT: PANIC BUTTON
// ==========================================
const PanicButton = ({ onPress, isLoading }) => (
  <TouchableOpacity
    style={[styles.panicButton, isLoading && { opacity: 0.7 }]}
    onPress={isLoading ? null : onPress}
    activeOpacity={0.8}
  >
    <View style={styles.panicInner}>
      <View style={styles.panicIconBg}>
        {isLoading ? (
          <ActivityIndicator color={COLORS.accentError} />
        ) : (
          <Ionicons name="alert" size={32} color={COLORS.accentError} />
        )}
      </View>
      <View style={{ marginLeft: 15, flex: 1 }}>
        <Text style={styles.panicTitle}>
          {isLoading ? "MENGIRIM SINYAL..." : "PANGGIL BIDAN"}
        </Text>
        <Text style={styles.panicSub}>
          {isLoading ? "Mohon tunggu sebentar" : "Tekan untuk sinyal darurat"}
        </Text>
      </View>
      {!isLoading && (
        <Ionicons name="chevron-forward" size={24} color="white" />
      )}
    </View>
  </TouchableOpacity>
);

// ==========================================
// 3. MAIN SCREEN
// ==========================================
export default function MainScreen() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [panicLoading, setPanicLoading] = useState(false);

  const [pasienName, setPasienName] = useState("");
  const [bidanName, setBidanName] = useState("Memuat Bidan...");

  const [pembukaan, setPembukaan] = useState(0);
  const [djj, setDjj] = useState(0);
  const [sistolik, setSistolik] = useState("---");
  const [diastolik, setDiastolik] = useState("---");
  const [nadi, setNadi] = useState("---");
  const [suhu, setSuhu] = useState("---");
  const [waktuCatat, setWaktuCatat] = useState("");
  const [djjStatus, setDjjStatus] = useState({
    text: "Memuat",
    color: COLORS.textSecondary,
    message: "Memuat...",
  });

  // State untuk Alert Modern
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info", // success, error, info
    actions: [],
  });

  const isFocusMode = pembukaan >= 4 && pembukaan < 10;

  // Helper menutup alert
  const closeAlert = () => setAlertConfig({ ...alertConfig, visible: false });

  const fetchBidanData = async (pasienId, token) => {
    try {
      const BIDAN_URL = `${BASE_URL_PATIENT}/${pasienId}/bidanId`;
      const res = await fetch(BIDAN_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.bidan_nama) {
        setBidanName(json.bidan_nama.trim() || "Bidan");
      } else {
        setBidanName("Bidan Tidak Ditemukan");
      }
    } catch (err) {
      console.log("ERROR FETCH BIDAN:", err.message);
      setBidanName("Error Memuat Bidan");
    }
  };

  const fetchPartografData = async (pasienId, token) => {
    try {
      const PARTOGRAF_URL = `${BASE_URL_PATIENT}/${pasienId}/progres-persalinan`;
      const res = await fetch(PARTOGRAF_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const resetPartografState = () => {
        setPembukaan(0);
        setDjj(0);
        setSistolik("---");
        setDiastolik("---");
        setNadi("---");
        setSuhu("---");
        setWaktuCatat("---");
        setDjjStatus(getDjjStatus(0));
      };

      if (!res.ok) {
        resetPartografState();
        return;
      }

      const json = await res.json();
      const dataArray = json.data;

      if (!dataArray || dataArray.length === 0) {
        resetPartografState();
        return;
      }

      const latestData = getLatestFilledPartografData(dataArray);
      if (!latestData) {
        resetPartografState();
        return;
      }

      setPembukaan(parseFloat(latestData.pembukaan_servik) || 0);
      setDjj(parseFloat(latestData.djj) || 0);
      setSistolik(cleanNumberString(latestData.sistolik));
      setDiastolik(cleanNumberString(latestData.diastolik));
      setNadi(cleanNumberString(latestData.nadi_ibu));
      setSuhu(cleanNumberString(latestData.suhu_ibu, true));
      setWaktuCatat(latestData.waktu_catat || "---");
      setDjjStatus(getDjjStatus(parseFloat(latestData.djj) || 0));
    } catch (err) {
      console.log("ERROR FETCH PARTOGRAF:", err.message);
      setPembukaan(0);
      setDjj(0);
      setDjjStatus(getDjjStatus(0));
    }
  };

  const fetchData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);

        const token = await getTokenFromStorage();
        if (!token) {
          navigate("/login");
          return;
        }

        const { pasienId, pasienName } = decodeJwtPayload(token);
        setPasienName(pasienName);

        await Promise.all([
          fetchBidanData(pasienId, token),
          fetchPartografData(pasienId, token),
        ]);
      } catch (err) {
        console.log("GENERAL ERROR:", err.message);
      } finally {
        setLoading(false);
        if (isRefresh) setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const handlePanic = async () => {
    closeAlert(); // Tutup alert lama jika ada
    Vibration.vibrate([0, 500, 200, 500]);
    setPanicLoading(true);

    try {
      const token = await getTokenFromStorage();
      if (!token) {
        // ERROR SESSION
        setAlertConfig({
          visible: true,
          title: "Sesi Habis",
          message: "Silakan login ulang.",
          type: "error",
          actions: [{ text: "Login", onPress: () => navigate("/login") }],
        });
        return;
      }

      const URL_DARURAT =
        "https://restful-api-bmc-production-v2.up.railway.app/api/darurat";

      const response = await fetch(URL_DARURAT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tipe: "PANIC_BUTTON" }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Gagal mengirim sinyal.");
      }

      // --- SUKSES ---
      setAlertConfig({
        visible: true,
        title: "SINYAL TERKIRIM!",
        message: `Notifikasi prioritas tinggi telah dikirim ke Bidan ${bidanName}.\n\nMohon tetap tenang.`,
        type: "success",
        actions: [{ text: "SAYA MENGERTI", onPress: closeAlert }],
      });
    } catch (error) {
      // --- GAGAL ---
      setAlertConfig({
        visible: true,
        title: "GAGAL TERKIRIM",
        message: `Error: ${error.message}\n\nSilakan panggil manual atau coba lagi.`,
        type: "error",
        actions: [
          { text: "BATAL", style: "cancel", onPress: closeAlert },
          { text: "COBA LAGI", onPress: handlePanic }, // Rekursif panggil fungsi ini lagi
        ],
      });
    } finally {
      setPanicLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
        <Text style={styles.loadingText}>Memuat asisten persalinan...</Text>
      </View>
    );
  }

  const activePhase = getDilatationPhase(pembukaan);

  return (
    <View style={styles.containerFixed}>
      {/* ALERT COMPONENT MODERN */}
      <ModernAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={alertConfig.actions}
      />

      <ScrollView
        style={styles.scrollViewContent}
        contentContainerStyle={{ paddingBottom: 150 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryBlue}
            colors={[COLORS.primaryBlue]}
          />
        }
      >
        <HeaderTop />

        {isFocusMode ? (
          // ==========================================
          // TAMPILAN MODE FOKUS (DARURAT)
          // ==========================================
          <View style={styles.focusModeContainer}>
            <View style={{ marginBottom: 15, marginTop: 40 }}>
              <MidwifeCard
                bidanName={bidanName}
                activePhase={activePhase}
                waktuCatat={waktuCatat}
              />
            </View>

            <PanicButton onPress={handlePanic} isLoading={panicLoading} />

            <View style={{ marginTop: 5 }}>
              <DjjStatusCard djj={djj} djjStatus={djjStatus} />
            </View>

            <BreathingGuide />

            <View style={{ marginTop: 10 }}>
              <IbuStatusCard
                sistolik={sistolik}
                diastolik={diastolik}
                nadi={nadi}
                suhu={suhu}
              />
            </View>

            <Text style={styles.focusFooterText}>
              "Anda kuat, Bunda. Sebentar lagi bertemu si Kecil."
            </Text>
          </View>
        ) : (
          // ==========================================
          // TAMPILAN NORMAL
          // ==========================================
          <>
            <HeaderGradient pasienName={pasienName} />

            <MidwifeCard
              bidanName={bidanName}
              activePhase={activePhase}
              waktuCatat={waktuCatat}
            />

            <DilatationVisualizer pembukaan={pembukaan} />

            <DjjStatusCard djj={djj} djjStatus={djjStatus} />

            <IbuStatusCard
              sistolik={sistolik}
              diastolik={diastolik}
              nadi={nadi}
              suhu={suhu}
            />
          </>
        )}
      </ScrollView>

      <BottomTabBar navigate={navigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  containerFixed: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  scrollViewContent: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    width: "100%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
    textAlign: "center",
    color: COLORS.textPrimary,
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancel: {
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  modalBtnText: {
    fontWeight: "bold",
    fontSize: 14,
  },

  // Focus Mode Styles
  focusModeContainer: {
    marginTop: 10,
    paddingBottom: 20,
  },
  breathingContainer: {
    marginHorizontal: 18,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 25,
    alignItems: "center",
    marginBottom: 25,
    ...SHADOW_STYLE,
    borderWidth: 1,
    borderColor: COLORS.lightBlue,
  },
  breathingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.darkBlue,
    marginBottom: 20,
  },
  circleWrapper: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  breathingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightBlue,
    position: "absolute",
    opacity: 0.5,
  },
  breathingText: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primaryBlue,
    zIndex: 2,
    textAlign: "center",
  },
  breathingSub: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: "80%",
  },

  panicButton: {
    marginHorizontal: 18,
    marginBottom: 25,
    backgroundColor: COLORS.accentError,
    borderRadius: 20,
    padding: 15,
    ...SHADOW_STYLE,
    shadowColor: COLORS.accentError,
    shadowOpacity: 0.4,
    elevation: 8,
  },
  panicInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panicIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  panicTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  panicSub: {
    color: COLORS.white,
    opacity: 0.9,
    fontSize: 13,
    marginTop: 2,
  },
  focusFooterText: {
    textAlign: "center",
    fontStyle: "italic",
    color: COLORS.textSecondary,
    marginTop: 10,
    fontSize: 14,
  },
});
