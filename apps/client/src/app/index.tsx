import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fetchHealth } from '@/lib/api';

type ServerStatus = 'checking' | 'online' | 'offline';

export default function HomeScreen() {
  const [status, setStatus] = useState<ServerStatus>('checking');

  useEffect(() => {
    fetchHealth()
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'));
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Ping Pong GW' }} />
      <Text style={styles.title}>Ping Pong GW</Text>
      <Text>Server: {status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '600' },
});
