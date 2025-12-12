import { Stack } from 'expo-router';

export default function AddPGLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="step1-basic" />
      <Stack.Screen name="step2-amenities" />
      <Stack.Screen name="step3-rules" />
      <Stack.Screen name="step4-rooms" />
      <Stack.Screen name="step5-images" />
    </Stack>
  );
}
