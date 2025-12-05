import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function HomeIndex() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/(home)/home-feed');
  }, []);

  return null;
}
