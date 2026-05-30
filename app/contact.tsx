// contact.tsx - お問い合わせ / 不適切画像報告画面
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDiagnosisStore } from '../src/stores/useDiagnosisStore';
import { THEME } from '../src/theme/theme';
import { submitReport } from '../src/services/reportService';
import { trackEvent } from '../src/services/eventService';

type ReportType = 'inappropriate' | 'resemblance' | 'other';

const REPORT_TYPES: { id: ReportType; label: string; desc: string }[] = [
  {
    id: 'inappropriate',
    label: '不適切な画像の報告',
    desc: '露出度が高い、または健全ではないビジュアルが含まれる場合',
  },
  {
    id: 'resemblance',
    label: '実在人物への酷似報告',
    desc: '実在の特定個人や有名人に酷似しており、削除・差替を求める場合',
  },
  {
    id: 'other',
    label: 'その他のお問い合わせ',
    desc: 'ご意見、バグ報告、その他の運営へのお問い合わせ',
  },
];

export default function ContactScreen() {
  const router = useRouter();
  const anonymousUserId = useDiagnosisStore((state) => state.anonymousUserId);

  const [selectedType, setSelectedType] = useState<ReportType>('inappropriate');
  const [message, setMessage] = useState('');
  const [imageId, setImageId] = useState(''); // オプション (特定の画像ID)

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setErrorMsg('メッセージ本文を入力してください。');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    // イベントトラッキング
    trackEvent(anonymousUserId, 'report_submit', { report_type: selectedType });

    const payload = {
      anonymous_user_id: anonymousUserId || 'guest_user',
      report_type: selectedType,
      message: message.trim() + (imageId ? `\n[対象画像ID: ${imageId}]` : ''),
      image_id: imageId.trim() ? imageId.trim() : undefined,
    };

    const res = await submitReport(payload);

    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
      setMessage('');
      setImageId('');
    } else {
      setErrorMsg(res.error || '送信に失敗しました。時間をおいて再度お試しください。');
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>📬</Text>
        <Text style={styles.successTitle}>送信が完了しました</Text>
        <Text style={styles.successDesc}>
          ご報告・お問い合わせありがとうございました。頂いた内容を運営で確認し、必要に応じて迅速に対応（画像の削除や非表示措置等）を行います。
        </Text>
        <Pressable style={styles.backButton} onPress={() => router.replace('/')}>
          <Text style={styles.backButtonText}>ホームに戻る</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>不適切報告 / お問い合わせ</Text>
      <Text style={styles.subtitle}>
        本サービスの画像に関して、実在人物への酷似や不適切な表現がある場合はこちらからご報告ください。
      </Text>

      {/* 報告タイプセレクト */}
      <Text style={styles.label}>お問い合わせの種類</Text>
      <View style={styles.typeList}>
        {REPORT_TYPES.map((type) => {
          const isActive = selectedType === type.id;
          return (
            <Pressable
              key={type.id}
              style={[styles.typeItem, isActive && styles.activeTypeItem]}
              onPress={() => setSelectedType(type.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isActive }}
            >
              <View style={styles.typeInfo}>
                <Text style={[styles.typeLabel, isActive && styles.activeTypeLabel]}>
                  {type.label}
                </Text>
                <Text style={styles.typeDesc}>{type.desc}</Text>
              </View>
              <View style={[styles.radioOutline, isActive && styles.radioActiveOutline]}>
                {isActive && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* 画像IDの入力 (オプション) */}
      <Text style={styles.label}>対象の画像ID (分かる場合のみ・任意)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="例: 00000000-0000-0000-0000-000000000001"
        placeholderTextColor={THEME.colors.textMuted}
        value={imageId}
        onChangeText={setImageId}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* メッセージ入力 */}
      <Text style={styles.label}>メッセージ内容 (必須)</Text>
      <TextInput
        style={[styles.textInput, styles.textArea]}
        placeholder="具体的な不適切箇所や、削除を要請する理由を詳しくご記入ください。"
        placeholderTextColor={THEME.colors.textMuted}
        value={message}
        onChangeText={setMessage}
        multiline={true}
        numberOfLines={6}
        textAlignVertical="top"
      />

      {/* エラーメッセージ表示 */}
      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* 送信ボタン */}
      <View style={styles.actionArea}>
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.pressed,
            submitting && styles.disabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>送信する</Text>
          )}
        </Pressable>
      </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  typeList: {
    width: '100%',
    marginBottom: 12,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    padding: 12,
    marginBottom: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  activeTypeItem: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(224, 64, 251, 0.02)',
  },
  typeInfo: {
    flex: 1,
    paddingRight: 12,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 2,
  },
  activeTypeLabel: {
    color: THEME.colors.primary,
  },
  typeDesc: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    lineHeight: 13,
  },
  radioOutline: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActiveOutline: {
    borderColor: THEME.colors.primary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.primary,
  },
  textInput: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    color: THEME.colors.text,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 13,
    marginBottom: 12,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 23, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 23, 68, 0.15)',
    borderRadius: THEME.radius.md,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: THEME.colors.skip,
    fontWeight: 'bold',
  },
  actionArea: {
    alignItems: 'center',
    marginTop: 16,
  },
  submitButton: {
    width: '100%',
    maxWidth: 320,
    height: 52,
    borderRadius: THEME.radius.xl,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        backgroundImage: `linear-gradient(90deg, ${THEME.colors.primaryGradient[0]} 0%, ${THEME.colors.primaryGradient[1]} 100%)`,
        cursor: 'pointer',
      },
    }),
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.6,
  },
  // 送信成功画面
  successContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 12,
  },
  successDesc: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  backButton: {
    height: 48,
    borderRadius: THEME.radius.xl,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  backButtonText: {
    color: THEME.colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
