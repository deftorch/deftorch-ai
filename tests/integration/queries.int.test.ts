import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { 
  createUser, 
  getUser, 
  createGuestUser,
  saveChat,
  getChatsByUserId,
  deleteChatById
} from '@/lib/db/queries';
import path from 'path';

import { db as realDb } from '@/lib/db';

// Pastikan untuk tidak pernah menjalankan ini di Production DB!
const testDbUrl = process.env.POSTGRES_TEST_URL;
const runIntegrationTests = !!testDbUrl;

let queryClient: postgres.Sql<{}>;
let testDb: ReturnType<typeof drizzle>;

// Mock koneksi db utama agar queries.ts menggunakan testDb
vi.mock('@/lib/db', () => {
  return {
    get db() {
      return testDb; // Selalu kembalikan testDb saat dipanggil
    }
  };
});

// Skip seluruh blok jika tidak ada Test DB URL
describe.runIf(runIntegrationTests)('Database Integration Tests (Real DB)', () => {
  beforeAll(async () => {
    // 1. Setup koneksi khusus testing
    queryClient = postgres(testDbUrl!, { max: 1 });
    testDb = drizzle(queryClient);

    // 2. Jalankan migrasi ke Test DB agar tabel terbentuk
    // Memerlukan folder drizzle yang di-generate oleh drizzle-kit
    await migrate(testDb, { migrationsFolder: path.join(process.cwd(), 'lib/db/migrations') });
  });

  afterAll(async () => {
    // Bersihkan koneksi setelah test
    if (queryClient) {
      // Idealnya: bersihkan (truncate) tabel di sini agar test selanjutnya bersih
      await queryClient.end();
    }
  });

  it('should create and retrieve a user', async () => {
    const testEmail = `integration-${Date.now()}@example.com`;
    
    // 1. Create User
    const newUsers = await createUser(testEmail, 'password123');
    expect(newUsers).toBeDefined();
    expect(newUsers[0].email).toBe(testEmail);

    // 2. Retrieve User
    const fetchedUsers = await getUser(testEmail);
    expect(fetchedUsers).toHaveLength(1);
    expect(fetchedUsers[0].email).toBe(testEmail);
  });

  it('should handle full chat lifecycle (create, retrieve, delete)', async () => {
    // 1. Create a guest user first to satisfy foreign key constraints
    const newGuest = await createGuestUser();
    const userId = newGuest[0].id;
    const chatId = `chat-${Date.now()}`;

    // 2. Save Chat
    await saveChat({
      id: chatId,
      userId,
      title: 'Integration Test Chat',
      visibility: 'private'
    });

    // 3. Get Chat
    const chatResult = await getChatsByUserId({
      id: userId,
      limit: 10,
      startingAfter: null,
      endingBefore: null
    });

    expect(chatResult.chats).toHaveLength(1);
    expect(chatResult.chats[0].title).toBe('Integration Test Chat');
    expect(chatResult.chats[0].id).toBe(chatId);

    // 4. Delete Chat
    await deleteChatById({ id: chatId });

    // 5. Verify Deletion
    const verifyResult = await getChatsByUserId({
      id: userId,
      limit: 10,
      startingAfter: null,
      endingBefore: null
    });
    
    expect(verifyResult.chats).toHaveLength(0);
  });
});

if (!runIntegrationTests) {
  describe.skip('Database Integration Tests (Real DB)', () => {
    it('Skipped because POSTGRES_TEST_URL is not provided', () => {});
  });
}
