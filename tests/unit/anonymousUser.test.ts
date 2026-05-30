// anonymousUser.test.ts - 匿名ユーザー管理のテスト
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getOrCreateAnonymousUserId,
  regenerateAnonymousUserId,
  removeAnonymousUserId,
  generateUUID,
} from '../../src/lib/anonymousUser';

// AsyncStorage の Jest モック設定
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn(async (key: string) => store[key] || null),
    setItem: jest.fn(async (key: string, value: string) => {
      store[key] = value;
      return null;
    }),
    removeItem: jest.fn(async (key: string) => {
      delete store[key];
      return null;
    }),
    clear: jest.fn(async () => {
      store = {};
      return null;
    }),
  };
});

describe('Anonymous User Helper tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('generateUUID', () => {
    it('should generate a valid v4 UUID format', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe('getOrCreateAnonymousUserId', () => {
    it('should create and store a new UUID if none exists', async () => {
      const id = await getOrCreateAnonymousUserId();
      expect(id).toBeDefined();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('taste_compass_anonymous_user_id');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should return the existing stored UUID if it already exists', async () => {
      const storedId = 'existing-test-uuid-1234';
      await AsyncStorage.setItem('taste_compass_anonymous_user_id', storedId);
      jest.clearAllMocks();

      const id = await getOrCreateAnonymousUserId();
      expect(id).toBe(storedId);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('taste_compass_anonymous_user_id');
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('regenerateAnonymousUserId', () => {
    it('should replace the existing UUID with a new one', async () => {
      const firstId = await getOrCreateAnonymousUserId();
      const newId = await regenerateAnonymousUserId();

      expect(newId).not.toBe(firstId);
      const currentStored = await AsyncStorage.getItem('taste_compass_anonymous_user_id');
      expect(currentStored).toBe(newId);
    });
  });

  describe('removeAnonymousUserId', () => {
    it('should delete the stored UUID key from AsyncStorage', async () => {
      await getOrCreateAnonymousUserId();
      await removeAnonymousUserId();

      const currentStored = await AsyncStorage.getItem('taste_compass_anonymous_user_id');
      expect(currentStored).toBeNull();
    });
  });
});
