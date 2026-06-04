/**
 * 文字列形式の画像ID（例: 'tc_diag_b01_s01', 'local-001'）を
 * PostgreSQLのUUID型に適合する決定論的UUIDに透過的変換する。
 */
export const toDeterministicUUID = (id: string): string => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id.toLowerCase();

  // tc_diag_b01_s01 ➔ b0400000-0001-0000-0000-000000000001
  if (id.startsWith('tc_diag_b')) {
    const match = id.match(/tc_diag_b(\d+)_s(\d+)/);
    if (match) {
      const batch = parseInt(match[1], 10);
      const slot = parseInt(match[2], 10);
      const batchPart = batch.toString().padStart(4, '0');
      const slotPart = slot.toString().padStart(12, '0');
      return `b0400000-${batchPart}-0000-0000-${slotPart}`.toLowerCase();
    }
  }

  // local-001 ➔ 00000000-0000-0000-0000-000000000001
  if (id.startsWith('local-')) {
    const match = id.match(/local-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      const numPart = num.toString().padStart(12, '0');
      return `00000000-0000-0000-0000-${numPart}`.toLowerCase();
    }
  }

  // 決定論的ハッシュフォールバック
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hex = Math.abs(hash).toString(16).padStart(12, '0').slice(-12);
  return `00000000-9999-0000-0000-${hex}`.toLowerCase();
};
