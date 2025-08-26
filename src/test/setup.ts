// Test setup file for vitest
import { vi } from 'vitest';

// Global test utilities
global.console = {
    ...console,
    // Suppress console.warn and console.error in tests unless explicitly needed
    warn: vi.fn(),
    error: vi.fn(),
};
