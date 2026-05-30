// terms.tsx - 利用規約画面
import React from 'react';
import { StyleSheet, Text, ScrollView } from 'react-native';
import { THEME } from '../src/theme/theme';
import { useI18n, LOCALES } from '../src/i18n';

export default function TermsScreen() {
  const { t, lang } = useI18n();

  // 日本語以外は英語の利用規約テキストを表示
  const termsText = lang === 'ja' ? t.documents.termsContent : LOCALES['en'].documents.termsContent;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t.documents.termsTitle}</Text>
      <Text style={styles.bodyText}>{termsText}</Text>
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
