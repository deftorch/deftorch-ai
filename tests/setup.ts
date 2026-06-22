import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock environment variables or global objects here
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));
