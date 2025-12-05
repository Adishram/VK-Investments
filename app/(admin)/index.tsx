import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function AdminPanel() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Super Admin Panel 👑</Text>
      <Text style={styles.subtitle}>You found the secret!</Text>
      
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/sign-in')}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40 },
  button: { backgroundColor: '#000', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 25 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
