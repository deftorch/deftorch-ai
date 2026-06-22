import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUser, createUser, createGuestUser } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { ChatbotError } from '@/lib/errors';
import * as utils from '@/lib/utils';
import * as dbUtils from '@/lib/db/utils';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  }
}));

vi.mock('@/lib/utils', () => ({
  generateUUID: vi.fn(() => 'mocked-uuid'),
}));

vi.mock('@/lib/db/utils', () => ({
  generateHashedPassword: vi.fn(() => 'hashed-password'),
}));

describe('Database Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUser', () => {
    it('should return user if exists', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockResolvedValue([mockUser]);
      
      (db.select as any).mockReturnValue({
        from: mockFrom.mockReturnValue({
          where: mockWhere
        })
      });

      const result = await getUser('test@example.com');
      expect(result).toEqual([mockUser]);
    });

    it('should throw ChatbotError on db error', async () => {
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockRejectedValue(new Error('DB Error'));
      
      (db.select as any).mockReturnValue({
        from: mockFrom.mockReturnValue({
          where: mockWhere
        })
      });

      await expect(getUser('test@example.com')).rejects.toThrow(ChatbotError);
      await expect(getUser('test@example.com')).rejects.toThrow('An error occurred while executing a database query.');
    });
  });

  describe('createUser', () => {
    it('should hash password and create user', async () => {
      const mockValues = vi.fn().mockResolvedValue([{ id: '1', email: 'test@example.com' }]);
      (db.insert as any).mockReturnValue({
        values: mockValues
      });

      const result = await createUser('test@example.com', 'password123');

      expect(dbUtils.generateHashedPassword).toHaveBeenCalledWith('password123');
      expect(mockValues).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashed-password'
      });
      expect(result).toEqual([{ id: '1', email: 'test@example.com' }]);
    });
  });

  describe('createGuestUser', () => {
    it('should create guest user with generated UUID', async () => {
      const mockReturning = vi.fn().mockResolvedValue([{ id: 'guest-1', email: 'guest-xxxx' }]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      
      (db.insert as any).mockReturnValue({
        values: mockValues
      });

      const result = await createGuestUser();
      
      expect(utils.generateUUID).toHaveBeenCalled();
      expect(dbUtils.generateHashedPassword).toHaveBeenCalledWith('mocked-uuid');
      expect(result).toEqual([{ id: 'guest-1', email: 'guest-xxxx' }]);
    });
  });
});
