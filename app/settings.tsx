// settings.tsx - 設定画面
import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useDiagnosisStore } from '../src/stores/useDiagnosisStore';
import { THEME } from '../src/theme/theme';
import { deleteUserHistory } from '../src/services/resultService';
import { trackEvent } from '../src/services/eventService';
import { useI18n } from '../src/i18n';
import { Feather } from '@expo/vector-icons';
import { CountryFlag } from '../src/components/ui/CountryFlag';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, lang, changeLanguage, allLangs } = useI18n();

  // Zustandストア
  const anonymousUserId = useDiagnosisStore((state) => state.anonymousUserId);
  const resetAnonymousUser = useDiagnosisStore((state) => state.resetAnonymousUser);

  // モーダル管理
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. 全履歴・データの完全削除
  const handleDeleteData = async () => {
    if (!anonymousUserId) return;
    setIsProcessing(true);

    // イベント送信
    await trackEvent(anonymousUserId, 'data_delete');

    // Supabase & ローカルの削除
    const success = await deleteUserHistory(anonymousUserId);

    if (success) {
      // 匿名IDもリセット
      await resetAnonymousUser();
    }

    setIsProcessing(false);
    setDeleteModalVisible(false);
    router.replace('/');
  };

  // 2. 匿名IDのみの再生成
  const handleRegenerateId = async () => {
    setIsProcessing(true);
    await resetAnonymousUser();
    setIsProcessing(false);
    setResetModalVisible(false);
    router.replace('/');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* ─── 言語選択セクション ─── */}
      <View style={styles.section}>
        <View style={styles.headerWithIcon}>
          <Feather name="globe" size={14} color={THEME.colors.textMuted} />
          <Text style={styles.sectionHeader}>{t.settings.language}</Text>
        </View>
        <Text style={styles.langDesc}>{t.settings.languageDesc}</Text>
        <View style={styles.langGrid}>
          {allLangs.map((l) => {
            const active = l.code === lang;
            return (
              <Pressable
                key={l.code}
                style={({ pressed }) => [
                  styles.langChip,
                  active && styles.langChipActive,
                  pressed && styles.langChipPressed,
                ]}
                onPress={() => changeLanguage(l.code)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
              >
                <CountryFlag code={l.code} size={16} />
                <Text style={[styles.langName, active && styles.langNameActive]}>
                  {l.name}
                </Text>
                {active && <Text style={styles.langCheck}>✓</Text>}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ─── 匿名ユーザー情報 ─── */}
      <View style={styles.section}>
        <View style={styles.headerWithIcon}>
          <Feather name="user" size={14} color={THEME.colors.textMuted} />
          <Text style={styles.sectionHeader}>{t.settings.anonymousInfo}</Text>
        </View>
        <View style={styles.idBox}>
          <Text style={styles.idLabel}>{t.settings.yourAnonymousId}</Text>
          <Text style={styles.idValue} selectable={true}>
            {anonymousUserId || t.settings.anonymousIdLoading}
          </Text>
          <Text style={styles.idSub}>{t.settings.anonymousSub}</Text>
        </View>
      </View>

      {/* ─── サービスについて ─── */}
      <View style={styles.section}>
        <View style={styles.headerWithIcon}>
          <Feather name="info" size={14} color={THEME.colors.textMuted} />
          <Text style={styles.sectionHeader}>{t.settings.aboutService}</Text>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoTitleRow}>
            <Feather name="image" size={14} color={THEME.colors.text} />
            <Text style={styles.infoTitle}> {t.settings.aboutImagesTitle}</Text>
          </View>
          <Text style={styles.infoText}>{t.settings.aboutImagesText}</Text>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoTitleRow}>
            <Feather name="shield" size={14} color={THEME.colors.text} />
            <Text style={styles.infoTitle}> {t.settings.adsPrivacyTitle}</Text>
          </View>
          <Text style={styles.infoText}>{t.settings.adsPrivacyText}</Text>
        </View>
      </View>

      {/* ─── ドキュメント & お問い合わせ ─── */}
      <View style={styles.section}>
        <View style={styles.headerWithIcon}>
          <Feather name="file-text" size={14} color={THEME.colors.textMuted} />
          <Text style={styles.sectionHeader}>{t.settings.docsContact}</Text>
        </View>

        <Pressable style={styles.rowItem} onPress={() => router.push('/terms')}>
          <Text style={styles.rowText}>{t.settings.termsOfService}</Text>
          <Feather name="chevron-right" size={16} color={THEME.colors.textMuted} />
        </Pressable>

        <Pressable style={styles.rowItem} onPress={() => router.push('/privacy')}>
          <Text style={styles.rowText}>{t.settings.privacyPolicy}</Text>
          <Feather name="chevron-right" size={16} color={THEME.colors.textMuted} />
        </Pressable>

        <Pressable style={styles.rowItem} onPress={() => router.push('/contact')}>
          <Text style={styles.rowText}>{t.settings.reportLink}</Text>
          <Feather name="chevron-right" size={16} color={THEME.colors.textMuted} />
        </Pressable>
      </View>

      {/* ─── データ削除・管理 (危険区域) ─── */}
      <View style={styles.section}>
        <View style={styles.headerWithIcon}>
          <Feather name="trash-2" size={14} color={THEME.colors.skip} />
          <Text style={[styles.sectionHeader, styles.dangerHeader]}>{t.settings.dataDeleteSection}</Text>
        </View>

        <Pressable style={styles.dangerRowItem} onPress={() => setResetModalVisible(true)}>
          <Text style={styles.dangerRowText}>{t.settings.regenerateId}</Text>
          <Text style={styles.dangerRowSub}>{t.settings.regenerateIdDesc}</Text>
        </Pressable>

        <Pressable style={styles.dangerRowItem} onPress={() => setDeleteModalVisible(true)}>
          <Text style={[styles.dangerRowText, styles.alertText]}>{t.settings.deleteAllData}</Text>
          <Text style={styles.dangerRowSub}>{t.settings.deleteAllDataDesc}</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>{t.settings.version} 1.0.0 (Expo Web)</Text>
      </View>

      {/* 匿名ID再生成モーダル */}
      <Modal
        visible={resetModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.settings.regenerateModalTitle}</Text>
            <Text style={styles.modalDesc}>{t.settings.regenerateModalDesc}</Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setResetModalVisible(false)}
                disabled={isProcessing}
              >
                <Text style={styles.modalCancelText}>{t.common.cancel}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={handleRegenerateId}
                disabled={isProcessing}
              >
                <Text style={styles.modalConfirmText}>{t.settings.regenerateConfirm}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* データ完全削除モーダル */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, styles.alertText]}>{t.settings.deleteModalTitle}</Text>
            <Text style={styles.modalDesc}>{t.settings.deleteModalDesc}</Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={isProcessing}
              >
                <Text style={styles.modalCancelText}>{t.common.cancel}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalConfirm, styles.modalDangerBtn]}
                onPress={handleDeleteData}
                disabled={isProcessing}
              >
                <Text style={styles.modalConfirmText}>{t.settings.deleteConfirm}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: THEME.colors.background,
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingLeft: 4,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },

  // ─── 言語選択 ───
  langDesc: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginBottom: 12,
    paddingLeft: 4,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...Platform.select({ web: { cursor: 'pointer', transition: 'all 0.12s ease' } }),
  },
  langChipActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(255,77,109,0.08)',
    ...Platform.select({ web: { boxShadow: '0 0 0 1px rgba(255,77,109,0.3)' } }),
  },
  langChipPressed: { opacity: 0.75 },
  langFlag: { display: 'none' },
  langName: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSub,
  },
  langNameActive: { color: THEME.colors.primary },
  langCheck: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontWeight: '800',
  },

  dangerHeader: {
    color: THEME.colors.skip,
  },
  idBox: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    padding: 16,
  },
  idLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginBottom: 4,
  },
  idValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.accent,
    marginBottom: 8,
    ...Platform.select({
      web: {
        userSelect: 'all',
      },
    }),
  },
  idSub: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    lineHeight: 14,
  },
  infoBox: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    lineHeight: 16,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  rowText: {
    fontSize: 13,
    color: THEME.colors.text,
    fontWeight: '600',
  },
  rowArrow: {
    fontSize: 14,
    color: THEME.colors.textMuted,
  },
  dangerRowItem: {
    backgroundColor: THEME.colors.surface,
    padding: 16,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.15)',
    marginBottom: 10,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  dangerRowText: {
    fontSize: 13,
    color: THEME.colors.text,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dangerRowSub: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    lineHeight: 14,
  },
  alertText: {
    color: THEME.colors.skip,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  versionText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  // モーダルスタイル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.lg,
    padding: 24,
    alignItems: 'center',
    ...THEME.shadow,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  modalCancel: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  modalCancelText: {
    color: THEME.colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalConfirm: {
    backgroundColor: THEME.colors.primary,
  },
  modalConfirmText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalDangerBtn: {
    backgroundColor: THEME.colors.skip,
  },
});
