// privacy.tsx - プライバシーポリシー画面
import React from 'react';
import { StyleSheet, Text, ScrollView } from 'react-native';
import { THEME } from '../src/theme/theme';

export default function PrivacyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>プライバシーポリシー</Text>

      <Text style={styles.sectionTitle}>1. 取得する情報について</Text>
      <Text style={styles.bodyText}>
        本サービスは、ユーザー登録やログインを必要としない「完全匿名」でご利用いただけます。取得するデータは以下の通り最小限に制限されています。
        {'\n'}• **匿名ID**:
        クライアント端末側で自動生成されるランダムなUUIDであり、個人の氏名、メールアドレス、電話番号などの個人情報は一切紐づきません。
        {'\n'}• **投票ログ**:
        診断中に入力した「好き」「スキップ」の選択データ。画像ごとのLike率集計に利用されます。{'\n'}
        • **診断結果**: 世間との一致度、お好みのタイプ傾向などの計算結果。{'\n'}• **デバイス情報**:
        ご利用のプラットフォーム (iOS/Android/Web) 情報。
      </Text>

      <Text style={styles.sectionTitle}>2. 情報の利用目的</Text>
      <Text style={styles.bodyText}>
        取得した匿名情報は、以下の目的でのみ利用されます。{'\n'}•
        利用者に対するパーソナライズされた好み診断結果の提供。{'\n'}•
        画像ごとの全体Like率や、人気スタイルの統計情報の集計・作成。{'\n'}•
        サービスの動作不具合検出、およびUI/UXの改善。
      </Text>

      <Text style={styles.sectionTitle}>3. 広告配信とデータ利用について</Text>
      <Text style={styles.bodyText}>
        本サービスでは、第三者配信事業者（Google AdMob、Google
        AdSense等）による広告配信を行っています。これらは、ユーザーの興味に応じた広告を表示するために、Cookieや広告識別子（IDFA/AAID等）の匿名識別技術を利用する場合があります。これらはブラウザの設定や端末のプライバシー設定によりオプトアウト（無効化）することが可能です。
      </Text>

      <Text style={styles.sectionTitle}>4. データの削除と自己管理について</Text>
      <Text style={styles.bodyText}>
        利用者は、アプリ内の「設定」画面より、ご自身の全診断履歴およびデータベースに同期されているすべての匿名投票ログをいつでも瞬時に完全削除することができます。また、匿名IDの再生成を行うことで、クラウド上のデータとの関連性を完全に遮断することができます。
      </Text>

      <Text style={styles.sectionTitle}>5. お問い合わせ</Text>
      <Text style={styles.bodyText}>
        プライバシーおよびデータ取り扱いに関するご質問、削除依頼等は、アプリ内「お問い合わせ /
        報告」フォームよりお送りください。
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
