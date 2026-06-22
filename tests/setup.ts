import { vi } from "vitest";

// Mock environment variables or global objects here
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));
