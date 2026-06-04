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
import { useI18n } from '../src/i18n';
import { Feather } from '@expo/vector-icons';

type ReportType = 'inappropriate' | 'resemblance' | 'other';

export default function ContactScreen() {
  const router = useRouter();
  const anonymousUserId = useDiagnosisStore((state) => state.anonymousUserId);
  const { t } = useI18n();

  const [selectedType, setSelectedType] = useState<ReportType>('inappropriate');
  const [message, setMessage] = useState('');
  const [imageId, setImageId] = useState(''); // オプション (特定の画像ID)

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reportTypes = [
    {
      id: 'inappropriate' as const,
      label: t.contact.types.inappropriate,
      desc: t.contact.types.inappropriateDesc,
    },
    {
      id: 'resemblance' as const,
      label: t.contact.types.resemblance,
      desc: t.contact.types.resemblanceDesc,
    },
    {
      id: 'other' as const,
      label: t.contact.types.other,
      desc: t.contact.types.otherDesc,
    },
  ];

  const handleSubmit = async () => {
    if (!message.trim()) {
      setErrorMsg(t.contact.errorRequired);
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
      setErrorMsg(res.error || t.contact.errorSubmit);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Feather name="check-circle" size={64} color="#3E7B5E" style={styles.successIcon} />
        <Text style={styles.successTitle}>{t.contact.successTitle}</Text>
        <Text style={styles.successDesc}>{t.contact.successDesc}</Text>
        <Pressable style={styles.backButton} onPress={() => router.replace('/')}>
          <Text style={styles.backButtonText}>{t.common.backHome}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{t.contact.title}</Text>
      <Text style={styles.subtitle}>{t.contact.subtitle}</Text>

      {/* 報告タイプセレクト */}
      <Text style={styles.label}>{t.contact.labelType}</Text>
      <View style={styles.typeList}>
        {reportTypes.map((type) => {
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
      <Text style={styles.label}>{t.contact.labelImageId}</Text>
      <TextInput
        style={styles.textInput}
        placeholder={t.contact.placeholderImageId}
        placeholderTextColor={THEME.colors.textMuted}
        value={imageId}
        onChangeText={setImageId}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* メッセージ入力 */}
      <Text style={styles.label}>{t.contact.labelMessage}</Text>
      <TextInput
        style={[styles.textInput, styles.textArea]}
        placeholder={t.contact.placeholderMessage}
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
          accessibilityRole="button"
          accessibilityLabel={t.contact.submit}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>{t.contact.submit}</Text>
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
    backgroundColor: 'rgba(175,82,57,0.02)',
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
        backgroundColor: THEME.colors.primary,
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
  successIcon: {
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
