import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/palette';
import { db, schema } from '@/db';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export default function HomeScreen() {
  const { session } = useAuth();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // Smoke test de la BD local: si esta query corre, SQLite + drizzle están OK.
    db.select()
      .from(schema.dsrDrafts)
      .limit(1)
      .then(() => setDbReady(true))
      .catch(() => setDbReady(false));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.title')}</Text>
      <Text style={styles.dim}>
        {t('home.welcome')} {session?.user.email}
      </Text>

      <View style={styles.card}>
        <View
          style={[
            styles.dot,
            { backgroundColor: dbReady ? palette.tech : palette.textFaint },
          ]}
        />
        <Text style={styles.cardText}>{t('home.offlineReady')}</Text>
      </View>

      <Text style={styles.hint}>{t('home.hint')}</Text>

      <Pressable
        style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.8 }]}
        onPress={() => supabase.auth.signOut()}
      >
        <Text style={styles.signOutText}>{t('auth.signOut')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { color: palette.text, fontSize: 22, fontWeight: '700' },
  dim: { color: palette.textDim, fontSize: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.surfaceElevated,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  cardText: { color: palette.text, fontSize: 14 },
  hint: { color: palette.textFaint, fontSize: 13 },
  signOut: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  signOutText: { color: palette.danger, fontWeight: '600' },
});
