// MainScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Progress from 'react-native-progress';
import {
  AntDesign,
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
  MaterialIcons,
  Feather, // Tambah Icon untuk Jam
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const BASE_URL_PATIENT = 'https://restful-api-bmc-production.up.railway.app/api/pasien';
const ASYNC_STORAGE_KEY = 'userToken';

// Polyfill minimal atob
if (typeof global.atob === 'undefined') {
  global.atob = (data) => Buffer.from(data, 'base64').toString('binary');
}

/* ===================== TOKEN + DECODE ===================== */
const getTokenFromStorage = async () => {
  try {
    return await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
  } catch (e) {
    return null;
  }
};

const decodeJwtPayload = (token) => {
  try {
    const parts = token.split('.');
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = decodeURIComponent(
      global
        .atob(payloadBase64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(payloadJson);

    return {
      pasienId: payload.sub,
      pasienName: payload.name || payload.username || 'Pasien',
    };
  } catch (e) {
    return { pasienId: null, pasienName: 'Error Loading' };
  }
};

/* ===================== HELPERS ===================== */

const cleanNumber = (num) => {
  if (num === null || num === undefined) return '---';
  if (typeof num === 'string' && num.trim() === '') return '---';
  const n = Number(num);
  if (Number.isNaN(n)) return String(num).trim() || '---';
  return String(Math.trunc(n));
};

const getDjjStatus = (djj) => {
  const value = parseFloat(djj);
  if (isNaN(value)) return { text: 'N/A', color: 'gray' };
  if (value >= 120 && value <= 160) return { text: 'Normal', color: 'green' };
  if (value < 120) return { text: 'Bradikardia', color: 'red' };
  if (value > 160) return { text: 'Takikardia', color: 'orange' };
  return { text: 'N/A', color: 'gray' };
};

const getDilatationPhase = (cm) => {
  const value = parseFloat(cm);
  if (isNaN(value)) return 'Fase Laten';
  if (value <= 3) return 'Fase Laten';
  if (value >= 4 && value <= 10) return 'Fase Aktif';
  if (value > 10) return 'Kala II';
  return 'Fase Laten';
};

const getHeadDescentText = (descent) => {
  const value = parseFloat(descent);
  if (isNaN(value)) return 'N/A';
  if (value >= 4) return 'Kepala belum turun optimal';
  if (value >= 3) return 'Kepala mulai turun';
  if (value <= 2) return 'Kepala sudah turun dengan baik';
  return 'N/A';
};

// Helper baru untuk mengambil Jam dari format "YYYY-MM-DD HH:MM:SS"
const extractTime = (dateTimeString) => {
  if (!dateTimeString) return '---';
  try {
    const parts = dateTimeString.split(' ');
    if (parts.length > 1) {
      const timePart = parts[1];
      // Ambil hanya HH:MM
      return timePart.split(':').slice(0, 2).join(':');
    }
    return '---';
  } catch (e) {
    return '---';
  }
};

/* ===================== HEADER TOP ===================== */

const HeaderTop = ({ pasienName }) => (
  <View style={styles.headerTopContainer}>
    <View style={styles.headerLeft}>
      <Image
        source={require('../../assets/Logo.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />
      <View>
        <Text style={styles.logoTitle}>Ruang</Text>
        <Text style={styles.logoTitleBlue}>Bunda</Text>
      </View>
    </View>

    <TouchableOpacity style={styles.notificationButton}>
      <Ionicons name="notifications-outline" size={26} color="black" />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>2</Text>
      </View>
    </TouchableOpacity>
  </View>
);

/* ===================== HEADER GRADIENT (NO TITLE ANYMORE) ===================== */

const HeaderGradient = ({ pasienName }) => (
  <LinearGradient
    colors={['#ffffff', '#e6f0ff', '#bfe1ff']}
    start={[0, 0]}
    end={[0, 1]}
    style={styles.headerGradient}
  >
    <Text style={styles.haloText}>Halo, {pasienName}</Text>
  </LinearGradient>
);

/* ===================== MIDWIFE CARD ===================== */

const MidwifeCard = ({ bidanName, activePhase, waktuCatat }) => (
  <View style={styles.midwifeCardWrapper}>
    <View style={styles.midwifeCard}>
      <View style={styles.midwifeRow}>
        <FontAwesome name="user-circle" size={44} color="#777" />
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Text style={styles.midwifeLabel}>Ditangani oleh</Text>
          <Text style={styles.midwifeName}>{bidanName}</Text>
        </View>
        <View style={styles.activeIndicatorContainer}>
          <Text style={styles.activeText}>Aktif</Text>
          <View style={styles.activeIndicator} />
        </View>
      </View>

      <View style={styles.stageNote}>
        <AntDesign name="exclamationcircleo" size={16} color="#007bff" />
        <Text style={styles.stageText}>
          Anda sedang dalam tahap <Text style={styles.activePhaseTextBold}>{activePhase}</Text> persalinan
        </Text>
      </View>

      {/* Tambah Waktu Catat */}
      <View style={styles.timeNote}>
        <Feather name="clock" size={16} color="#333" />
        <Text style={styles.timeText}>
          Data terakhir dicatat pada: <Text style={styles.timeBold}>{extractTime(waktuCatat)}</Text>
        </Text>
      </View>
    </View>
  </View>
);

/* ===================== PROGRESS SECTION ===================== */

const ProgressSection = ({ pembukaan }) => {
  const dilatation = parseFloat(pembukaan);
  const progress = dilatation / 10;
  const phase = getDilatationPhase(dilatation);

  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressTitle}>Pembukaan Serviks</Text>

      <View style={styles.progressCircleWrapper}>
        <Progress.Circle
          size={width * 0.50}
          progress={progress}
          showsText={true}
          color="#007bff"
          thickness={10}
          unfilledColor="#e0e0e0"
          formatText={() => `${cleanNumber(dilatation)} cm`}
          textStyle={{ fontSize: 18, fontWeight: 'bold' }}
        />
      </View>

      <Text style={styles.phaseText}>
        Tahap: <Text style={styles.phaseBold}>{phase}</Text>
      </Text>
    </View>
  );
};

/* ===================== MINI CARD ===================== */

const MiniCard = ({ title, value, unit, icon }) => (
  <View style={styles.miniCard}>
    {icon}
    <View style={{ marginLeft: 12, justifyContent: 'center' }}>
      <Text style={styles.miniCardTitle}>{title}</Text>
      <Text style={styles.miniCardValue}>
        {`${value}`} {unit}
      </Text>
    </View>
  </View>
);

/* ===================== BOTTOM TAB BAR ===================== */

const TabBarItem = ({ iconName, label, isFocused }) => (
  <TouchableOpacity
    style={styles.tabItem}
    onPress={() => console.log(`${label} pressed`)}
  >
    {isFocused ? (
      <View style={{ alignItems: 'center' }}>
        <MaterialCommunityIcons name={iconName} size={26} color="#007bff" />
        <Text style={styles.tabLabelFocused}>{label}</Text>
      </View>
    ) : (
      <View style={{ alignItems: 'center' }}>
        <MaterialCommunityIcons name={iconName} size={26} color="#8e8e93" />
        <Text style={styles.tabLabel}>{label}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const BottomTabBar = () => (
  <View style={styles.tabBarContainer}>
    <TabBarItem 
      iconName="view-dashboard" 
      label="Dashboard" 
      isFocused={true} 
    />
    <TabBarItem 
      iconName="chart-bar" 
      label="Progres" 
      isFocused={false} 
    />
    <TabBarItem 
      iconName="book-open-page-variant" 
      label="Edukasi" 
      isFocused={false} 
    />
    <TabBarItem 
      iconName="account-circle" 
      label="Profil" 
      isFocused={false} 
    />
  </View>
);

/* ===================== MAIN SCREEN ===================== */

export default function MainScreen() {
  const [loading, setLoading] = useState(true);
  const [pasienName, setPasienName] = useState('');

  const [bidanName, setBidanName] = useState('Memuat Bidan...');
  const [pembukaan, setPembukaan] = useState(0);

  const [djj, setDjj] = useState(0);
  const [tensi, setTensi] = useState('');
  const [nadi, setNadi] = useState(0);
  const [suhu, setSuhu] = useState('');
  
  // State baru untuk waktu catat dan obat cairan
  const [waktuCatat, setWaktuCatat] = useState('');
  const [obatCairan, setObatCairan] = useState('');
  
  const [djjStatus, setDjjStatus] = useState({ text: '', color: 'gray' });
  // State Urin dan Penurunan Kepala dipertahankan di fetch tapi tidak ditampilkan

  const fetchBidanData = async (pasienId, token) => {
    try {
      const BIDAN_URL = `${BASE_URL_PATIENT}/${pasienId}/bidanId`;
      const res = await fetch(BIDAN_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      
      if (json.bidan_nama) {
        setBidanName(json.bidan_nama.trim() || 'Bidan');
      } else {
        setBidanName('Bidan Tidak Ditemukan');
      }
    } catch (err) {
      console.log('ERROR FETCH BIDAN:', err.message);
      setBidanName('Error Memuat Bidan');
    }
  };

  const fetchPartografData = async (pasienId, token) => {
    try {
      const PARTOGRAF_URL = `${BASE_URL_PATIENT}/${pasienId}/catatan-partograf-terbaru`;
      const res = await fetch(PARTOGRAF_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(`Partograf fetch failed: ${errorJson.message || 'Unknown error'}`);
      }
      
      const json = await res.json();
      const data = json.data;

      if (!data) throw new Error("No Partograph data found.");

      setPembukaan(data.pembukaan_servik || 0);
      setDjj(data.djj || 0);
      setSuhu(data.suhu_ibu || '');
      setNadi(data.nadi_ibu || 0);

      // Data yang diminta
      setWaktuCatat(data.waktu_catat || '');
      setObatCairan(data.obat_cairan || ''); // Obat cairan
      
      // Data yang dihapus dari tampilan tapi dipertahankan di fetch (opsional)
      // setUrin(data.aseton || ''); 
      // setProtein(data.protein || '');
      // setHeadDescent(data.penurunan_kepala || '');
      
      const sistolik = cleanNumber(data.sistolik);
      const diastolik = cleanNumber(data.diastolik);
      setTensi(`${sistolik}/${diastolik}`);
      
      setDjjStatus(getDjjStatus(data.djj));
    } catch (err) {
      console.log('ERROR FETCH PARTOGRAF:', err.message);
    }
  };

  const fetchData = async () => {
    try {
      const token = await getTokenFromStorage();
      if (!token) {
        console.log('No token found');
        return;
      }

      const { pasienId, pasienName } = decodeJwtPayload(token);
      setPasienName(pasienName);

      await Promise.all([
        fetchBidanData(pasienId, token),
        fetchPartografData(pasienId, token)
      ]);

    } catch (err) {
      console.log('GENERAL ERROR:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Memuat data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.containerFixed}> 
      <ScrollView
        style={styles.scrollViewContent}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      >

        {/* HEADER ATAS */}
        <HeaderTop pasienName={pasienName} />

        {/* GRADIENT */}
        <HeaderGradient pasienName={pasienName} />

        {/* CARD BIDAN (Diperbarui dengan waktuCatat) */}
        <MidwifeCard
          bidanName={bidanName}
          activePhase={getDilatationPhase(pembukaan)}
          waktuCatat={waktuCatat}
        />

        {/* PEMBUKAAN SECTION */}
        <ProgressSection pembukaan={pembukaan} />

        {/* MINI CARD SECTION */}
        <View style={styles.miniContainer}>

          <MiniCard
            title="Detak Jantung Janin"
            value={`${cleanNumber(djj)} - ${djjStatus.text}`}
            unit="bpm"
            icon={<Ionicons name="heart-circle" size={32} color={djjStatus.color} />}
          />

          <MiniCard
            title="Tekanan Darah Ibu"
            value={`${tensi}`}
            unit="mmHg"
            icon={<MaterialCommunityIcons name="heart-pulse" size={32} color="#007bff" />}
          />
          
          <MiniCard
            title="Nadi Ibu"
            value={`${cleanNumber(nadi)}`}
            unit="bpm"
            icon={<Ionicons name="pulse" size={32} color="#f44336" />}
          />

          <MiniCard
            title="Suhu Tubuh"
            value={`${cleanNumber(suhu)}`}
            unit="°C"
            icon={<FontAwesome name="thermometer-half" size={32} color="#ff5722" />}
          />
          
          {/* MINI CARD BARU: Obat Cairan */}
          <MiniCard
            title="Cairan dan Obat"
            value={`${cleanNumber(obatCairan)}`}
            unit="ml"
            icon={<MaterialCommunityIcons name="medical-bag" size={32} color="#009688" />}
          />
          
          {/* Urin dan Penurunan Kepala dihapus */}

        </View>
      </ScrollView>
      
      <BottomTabBar /> 
    </View>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  // CONTAINER UTAMA UNTUK LAYOUT FIXED
  containerFixed: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // SCROLLVIEW UNTUK KONTEN DI ATAS TAB BAR
  scrollViewContent: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 60,
  },

  /* HEADER LEVEL 1 */
  headerTopContainer: {
    paddingTop: Platform.OS === 'ios' ? 55 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoImage: {
    width: 50,
    height: 50,
    marginRight: 8,
  },

  logoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    lineHeight: 20,
  },

  logoTitleBlue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
    lineHeight: 20,
  },

  notificationButton: {
    position: 'relative',
  },

  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: 'red',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },

  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  /* GRADIENT HEADER */
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 22,
    paddingBottom: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },

  haloText: {
    fontSize: 19,
    fontWeight: '600',
    color: '#000',
  },

  /* MIDWIFE CARD */
  midwifeCardWrapper: {
    marginTop: -40,
    paddingHorizontal: 18,
  },

  midwifeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  midwifeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  midwifeLabel: {
    fontSize: 13,
    color: '#777',
  },

  midwifeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },

  activeIndicatorContainer: {
    alignItems: 'center',
  },

  activeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'green',
    marginTop: 2,
  },

  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'green',
  },

  stageNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingBottom: 8, // Tambah padding bawah untuk pemisah
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  stageText: {
    marginLeft: 4,
    color: '#555',
    fontSize: 14,
    lineHeight: 18,
  },

  activePhaseTextBold: {
    fontWeight: '700',
    color: '#000',
  },
  
  // Gaya untuk waktu catat
  timeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    marginLeft: 4,
    color: '#777',
    fontSize: 12,
  },
  timeBold: {
    fontWeight: '700',
    color: '#333',
    fontSize: 13,
  },

  /* PROGRESS SECTION */
  progressContainer: {
    alignItems: 'center',
    marginTop: 35,
  },

  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 18,
  },

  progressCircleWrapper: {
    marginBottom: 16,
  },

  phaseText: {
    fontSize: 15,
    marginTop: 6,
    color: '#555',
  },

  phaseBold: {
    fontWeight: 'bold',
    color: '#000',
  },

  /* MINI CARDS */
  miniContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  miniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // perbaikan: dekatkan ikon & teks
    backgroundColor: '#f8faff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  miniCardTitle: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
  },

  miniCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: -1, // sedikit naik agar sejajar dengan title/ikon
  },

  /* BOTTOM TAB BAR STYLES */
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 90 : 60,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },

  tabLabel: {
    fontSize: 11,
    color: '#8e8e93',
    marginTop: 2,
  },
  
  tabLabelFocused: {
    fontSize: 11,
    color: '#007bff',
    fontWeight: '600',
    marginTop: 2,
  },

  /* LOADING */
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
