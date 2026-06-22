import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from '@/app/(chat)/api/vote/route';
import { auth } from '@/app/(auth)/auth';
import { getChatById, getVotesByChatId, voteMessage } from '@/lib/db/queries';

// Mock dependencies
vi.mock('@/app/(auth)/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/queries', () => ({
  getChatById: vi.fn(),
  getVotesByChatId: vi.fn(),
  voteMessage: vi.fn(),
}));

describe('API Route: /api/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET Handler', () => {
    it('should return 400 if chatId is missing', async () => {
      const request = new Request('http://localhost/api/vote');
      const response = await GET(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('bad_request:api');
    });

    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      
      const request = new Request('http://localhost/api/vote?chatId=123');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.code).toBe('unauthorized:vote');
    });

    it('should return votes if authenticated and authorized', async () => {
      // Mock auth session
      vi.mocked(auth).mockResolvedValue({ 
        user: { id: 'user-1', email: 'test@test.com' },
        expires: '2050-01-01'
      });
      // Mock chat ownership
      vi.mocked(getChatById).mockResolvedValue({ id: '123', userId: 'user-1' } as any);
      // Mock votes
      vi.mocked(getVotesByChatId).mockResolvedValue([{ messageId: 'msg-1', isUpvoted: true }] as any);

      const request = new Request('http://localhost/api/vote?chatId=123');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(1);
      expect(data[0].messageId).toBe('msg-1');
    });
  });

  describe('PATCH Handler', () => {
    it('should return 400 if payload is invalid', async () => {
      const request = new Request('http://localhost/api/vote', {
        method: 'PATCH',
        body: JSON.stringify({ invalid: 'payload' })
      });
      
      const response = await PATCH(request);
      expect(response.status).toBe(400);
    });

    it('should call voteMessage on valid payload', async () => {
      vi.mocked(auth).mockResolvedValue({ 
        user: { id: 'user-1', email: 'test@test.com' },
        expires: '2050-01-01'
      });
      vi.mocked(getChatById).mockResolvedValue({ id: '123', userId: 'user-1' } as any);
      
      const request = new Request('http://localhost/api/vote', {
        method: 'PATCH',
        body: JSON.stringify({ chatId: '123', messageId: 'msg-1', type: 'up' })
      });
      
      const response = await PATCH(request);
      expect(response.status).toBe(200);
      expect(voteMessage).toHaveBeenCalledWith({
        chatId: '123',
        messageId: 'msg-1',
        type: 'up'
      });
    });
  });
});
