// Tambahkan import ini di paling atas MainScreen.js
import { Animated, Easing, Vibration, Alert } from 'react-native';

// --- KOMPONEN 1: PANDUAN NAPAS (BREATHING GUIDE) ---
const BreathingGuide = () => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [textGuide, setTextGuide] = useState("Tarik Napas...");

  useEffect(() => {
    const breathe = () => {
      // Fase Tarik Napas (4 detik)
      setTextGuide("Tarik Napas... 😤");
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 4000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }).start(() => {
        // Fase Buang Napas (4 detik)
        setTextGuide("Hembuskan Perlahan... 😮‍💨");
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }).start(() => breathe()); // Loop
      });
    };
    breathe();
  }, []);

  return (
    <View style={styles.breathingContainer}>
      <Text style={styles.breathingTitle}>Panduan Pernapasan</Text>
      <View style={styles.circleWrapper}>
        <Animated.View
          style={[
            styles.breathingCircle,
            { transform: [{ scale: scaleAnim }] },
          ]}
        />
        <Text style={styles.breathingText}>{textGuide}</Text>
      </View>
      <Text style={styles.breathingSub}>Ikuti ritme lingkaran untuk mengurangi nyeri kontraksi.</Text>
    </View>
  );
};

// --- KOMPONEN 2: TOMBOL PANIC (ONE TAP) ---
const PanicButton = ({ onPress }) => (
  <TouchableOpacity
    style={styles.panicButton}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.panicInner}>
      <Ionicons name="alert-circle" size={40} color="white" />
      <View style={{marginLeft: 10}}>
        <Text style={styles.panicTitle}>PANGGIL BIDAN</Text>
        <Text style={styles.panicSub}>Tekan jika darurat / sakit tak tertahankan</Text>
      </View>
    </View>
  </TouchableOpacity>
);