import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/global'; 

const { width } = Dimensions.get('window');

// Konstanta warna khusus untuk visualisasi ini agar terlihat alami & menenangkan
const SCALE_COLORS = {
  bgActive: '#FF6B8B',     // Pink tua untuk fase aktif saat ini
  bgInactive: '#FFE4E8',   // Pink sangat muda untuk fase lain
  borderActive: '#D6345B',
  borderInactive: '#F2B5C3',
  textSub: '#8A6F75',
};

// Rasio visual: 1cm = 12 unit pixel (bukan ukuran fisik layar, tapi rasio perbandingan)
const PIXEL_RATIO = 13; 

const DilatationScaleModal = ({ visible, onClose, currentDilatation }) => {
  const safeDilatation = Math.round(parseFloat(currentDilatation)) || 0;
  
  // Animasi berdenyut untuk lingkaran saat ini (Breathing Animation)
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1); // Reset saat close
    }
  }, [visible]);

  // Komponen Helper untuk merender satu lingkaran
  const RenderCircleItem = ({ cm }) => {
    const isCurrent = safeDilatation === cm;
    const size = 20 + (cm * PIXEL_RATIO); // Formula ukuran
    
    // Style dinamis
    const circleStyle = {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: isCurrent ? SCALE_COLORS.bgActive : SCALE_COLORS.bgInactive,
      borderColor: isCurrent ? SCALE_COLORS.borderActive : SCALE_COLORS.borderInactive,
      borderWidth: isCurrent ? 3 : 1.5,
      // Bayangan halus
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    };

    const Wrapper = isCurrent ? Animated.View : View;
    const animStyle = isCurrent ? { transform: [{ scale: pulseAnim }] } : {};

    return (
      <View style={styles.circleWrapper}>
        <Wrapper style={[styles.circleShape, circleStyle, animStyle]}>
           <Text style={[styles.cmTextInside, { color: isCurrent ? '#FFF' : SCALE_COLORS.borderActive }]}>
             {cm}
           </Text>
        </Wrapper>
        {isCurrent && (
            <View style={styles.hereBadge}>
                <Text style={styles.hereText}>Anda Disini</Text>
            </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          
          {/* --- HEADER --- */}
          <View style={styles.header}>
            <View>
              <Text style={styles.modalTitle}>Skala Serviks Realistis</Text>
              <Text style={styles.modalSubtitle}>Visualisasi perbandingan diameter</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={26} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* --- CONTENT --- */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Legend Info */}
            <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={COLORS.primaryBlue} />
                <Text style={styles.infoText}>
                    Ukuran di bawah adalah ilustrasi perbandingan. 
                    <Text style={{fontWeight:'bold'}}> 10 cm</Text> adalah target pembukaan lengkap.
                </Text>
            </View>

            {/* FASE 1: AWAL (1-3 cm) */}
            <View style={styles.phaseContainer}>
                <Text style={styles.phaseTitle}>Fase Laten (Awal)</Text>
                <View style={styles.gridRow}>
                    {[1, 2, 3].map(cm => <RenderCircleItem key={cm} cm={cm} />)}
                </View>
            </View>

            {/* FASE 2: AKTIF (4-7 cm) */}
            <View style={styles.phaseContainer}>
                <Text style={styles.phaseTitle}>Fase Aktif (Cepat)</Text>
                <View style={styles.gridRow}>
                    {[4, 5, 6].map(cm => <RenderCircleItem key={cm} cm={cm} />)}
                </View>
                {/* Baris kedua untuk 7 agar rapi */}
                <View style={[styles.gridRow, { marginTop: 15 }]}>
                     <RenderCircleItem cm={7} />
                </View>
            </View>

            {/* FASE 3: TRANSISI & LENGKAP (8-10 cm) */}
            <View style={[styles.phaseContainer, styles.phaseFinal]}>
                <Text style={styles.phaseTitle}>Fase Transisi & Lengkap</Text>
                <View style={styles.gridRow}>
                     <RenderCircleItem cm={8} />
                     <RenderCircleItem cm={9} />
                </View>
                
                <View style={styles.finalCircleContainer}>
                     <RenderCircleItem cm={10} />
                     <Text style={styles.finalLabel}>Siap Melahirkan! 👶</Text>
                </View>
            </View>

            <View style={{height: 40}} />
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)', // Gelapkan background belakang agar fokus
    justifyContent: 'flex-end',
  },
  modalView: {
    backgroundColor: '#FAFAFA', // Putih gading, lebih lembut di mata
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%', 
    paddingTop: 25,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.darkBlue,
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: SCALE_COLORS.textSub,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#EEE',
    borderRadius: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  infoBox: {
      flexDirection: 'row',
      backgroundColor: '#EDF7FF',
      padding: 12,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#D6EAF8'
  },
  infoText: {
      marginLeft: 10,
      fontSize: 12,
      color: COLORS.darkBlue,
      flex: 1,
      lineHeight: 18,
  },
  phaseContainer: {
      backgroundColor: COLORS.white,
      padding: 15,
      borderRadius: 16,
      marginBottom: 15,
      // Card Shadow
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
      borderWidth: 1,
      borderColor: '#F0F0F0'
  },
  phaseFinal: {
      borderColor: SCALE_COLORS.borderActive, // Highlight border fase akhir
      borderWidth: 1.5,
      backgroundColor: '#FFF5F7'
  },
  phaseTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.textSecondary,
      marginBottom: 15,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
  },
  gridRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end', // Rata bawah supaya terlihat tumbuh ke atas
  },
  circleWrapper: {
      alignItems: 'center',
      justifyContent: 'flex-end',
      minWidth: 60,
  },
  circleShape: {
      justifyContent: 'center',
      alignItems: 'center',
  },
  cmTextInside: {
      fontSize: 12,
      fontWeight: 'bold',
  },
  hereBadge: {
      marginTop: 6,
      backgroundColor: COLORS.darkBlue,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
  },
  hereText: {
      color: COLORS.white,
      fontSize: 10,
      fontWeight: 'bold',
  },
  finalCircleContainer: {
      alignItems: 'center',
      marginTop: 20,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.05)'
  },
  finalLabel: {
      marginTop: 10,
      fontSize: 16,
      fontWeight: '800',
      color: SCALE_COLORS.borderActive,
  }
});

export default DilatationScaleModal;