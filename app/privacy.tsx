// privacy.tsx - プライバシーポリシー画面
import React from 'react';
import { StyleSheet, Text, ScrollView } from 'react-native';
import { THEME } from '../src/theme/theme';
import { useI18n, LOCALES } from '../src/i18n';

export default function PrivacyScreen() {
  const { t, lang } = useI18n();

  // 日本語以外は英語のプライバシーポリシーテキストを表示
  const privacyText =
    lang === 'ja' ? t.documents.privacyContent : LOCALES['en'].documents.privacyContent;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t.documents.privacyTitle}</Text>
      <Text style={styles.bodyText}>{privacyText}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: THEME.colors.background,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 18,
    textAlign: 'justify',
    whiteSpace: 'pre-line', // 改行を反映させるための設定 (RN Web/Mobile互換)
  } as any,
});
