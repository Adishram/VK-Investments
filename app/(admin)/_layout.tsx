import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="availability" />
      <Stack.Screen name="booking-reports" />
      <Stack.Screen name="owners" />
      <Stack.Screen name="owner-details" />
    </Stack>
  );
}
