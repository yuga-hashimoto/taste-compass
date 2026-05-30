// terms.tsx - 利用規約画面
import React from 'react';
import { StyleSheet, Text, ScrollView } from 'react-native';
import { THEME } from '../src/theme/theme';

export default function TermsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>利用規約</Text>

      <Text style={styles.sectionTitle}>第1条 (適用)</Text>
      <Text style={styles.bodyText}>
        本利用規約は、「好みズレ診断（Taste
        Compass）」（以下、「本サービス」）の提供条件および本サービスと利用者との間の権利義務関係を定めるものです。利用者は、本サービスを利用することにより、本規約に同意したものとみなされます。
      </Text>

      <Text style={styles.sectionTitle}>第2条 (サービスの本質と免責)</Text>
      <Text style={styles.bodyText}>
        1.
        本サービスで表示される人物画像は、すべて人工知能(AI)技術によって自動生成された「架空の成人女性」のビジュアルであり、実在する人物、モデル、または有名人とは一切関係ありません。
        {'\n'}
        2.
        本サービスは、利用者の好みの傾向を統計的に分析・診断する娯楽目的のツールであり、特定の人物の美醜の判定や、優劣を決定づけるものではありません。結果の正確性や客観性について一切保証しません。
      </Text>

      <Text style={styles.sectionTitle}>第3条 (利用対象年齢)</Text>
      <Text style={styles.bodyText}>
        本サービスで取り扱うコンテンツは成人向け表現を排除した健全な日常ファッションですが、サービスの性質上、18歳未満の利用は想定していません。18歳未満の方が利用する場合は、保護者・親権者の同意を得る必要があります。
      </Text>

      <Text style={styles.sectionTitle}>第4条 (禁止事項)</Text>
      <Text style={styles.bodyText}>
        利用者は本サービスの利用にあたり、以下の行為を行ってはなりません。{'\n'}•
        診断結果や画像を、実在する特定の個人を誹謗中傷、差別、名誉毀損する目的で利用・共有する行為。
        {'\n'}• 本サービスに対して不正アクセスを行い、またはサーバーに過度な負荷をかける行為。{'\n'}
        • その他、公序良俗に反する行為または運営が不適切と判断した行為。
      </Text>

      <Text style={styles.sectionTitle}>第5条 (不適切画像への対応)</Text>
      <Text style={styles.bodyText}>
        万一、本サービス内の画像において実在の人物に極めて酷似している、または不適切であると思われる画像を発見した場合は、アプリ内「お問い合わせ/報告」ページよりご報告ください。運営側で確認し、必要に応じて画像の非アクティブ化、削除等の措置を速やかに行います。
      </Text>

      <Text style={styles.sectionTitle}>第6条 (規約の変更)</Text>
      <Text style={styles.bodyText}>
        運営は、必要と判断した場合にはいつでも本規約を変更することができるものとします。変更後の利用規約は、本サービス上に掲載された時点から効力を生じるものとします。
      </Text>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.accent,
    marginTop: 16,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 18,
    textAlign: 'justify',
  },
});
