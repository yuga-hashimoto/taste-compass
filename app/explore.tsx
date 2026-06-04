import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { THEME } from '../src/theme/theme';

const sections = [
  {
    icon: 'shield',
    title: '安全な画像設計',
    body: '診断画像はすべてAI生成の架空成人ビジュアルです。実在人物との関係や個人評価を前提にしない娯楽サービスとして設計しています。',
  },
  {
    icon: 'bar-chart-2',
    title: '匿名の統計比較',
    body: 'ログイン不要の匿名IDで、好みの傾向と全体平均との差を算出します。個人を特定する登録情報は扱いません。',
  },
  {
    icon: 'globe',
    title: '多角的な好み分析',
    body: 'スタイル、地域傾向、雰囲気、年齢感などを組み合わせて、単純な好き嫌いでは見えにくい傾向を表示します。',
  },
] as const;

export default function ExploreScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: '概要' }} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ABOUT TASTE COMPASS</Text>
          <Text style={styles.title}>好みのズレを、軽く楽しく見える化。</Text>
          <Text style={styles.lead}>
            Taste Compass は、スワイプ診断を通して自分の好みと世間の傾向を比較するWebサービスです。
          </Text>
        </View>

        <View style={styles.sectionList}>
          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <View style={styles.iconBox}>
                <Feather name={section.icon} size={18} color={THEME.colors.primary} />
              </View>
              <View style={styles.sectionText}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="診断スタート"
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={() => router.push('/setup')}
        >
          <Text style={styles.ctaText}>診断スタート</Text>
          <Feather name="arrow-right" size={18} color="#FFF8F2" />
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: THEME.colors.background,
    paddingHorizontal: 22,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    gap: 14,
    marginBottom: 28,
  },
  eyebrow: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: THEME.colors.text,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '900',
  },
  lead: {
    color: THEME.colors.textSub,
    fontSize: 14,
    lineHeight: 23,
  },
  sectionList: {
    gap: 12,
    marginBottom: 28,
  },
  section: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: THEME.radius.lg,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(175,82,57,0.10)',
  },
  sectionText: {
    flex: 1,
    gap: 6,
  },
  sectionTitle: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionBody: {
    color: THEME.colors.textSub,
    fontSize: 12,
    lineHeight: 20,
  },
  cta: {
    minHeight: 54,
    borderRadius: THEME.radius.full,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    color: '#FFF8F2',
    fontSize: 16,
    fontWeight: '900',
  },
});
