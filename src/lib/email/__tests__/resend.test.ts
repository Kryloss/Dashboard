import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendWelcome, testResendConfig } from '../resend';

// Mock environment variables
const mockEnv = {
    RESEND_API_KEY: 'test_api_key',
    RESEND_FROM: 'test@example.com',
};

// Mock Resend
const mockResendSend = vi.fn();
const mockResendApiKeysList = vi.fn();

vi.mock('resend', () => ({
    Resend: vi.fn().mockImplementation(() => ({
        emails: {
            send: mockResendSend,
        },
        apiKeys: {
            list: mockResendApiKeysList,
        },
    })),
}));

// Mock react-email render
vi.mock('@react-email/render', () => ({
    render: vi.fn(() => '<html>Mock email HTML</html>'),
}));

describe('Resend Email Library', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset environment variables
        delete process.env.RESEND_API_KEY;
        delete process.env.RESEND_FROM;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('sendWelcome', () => {
        it('should send welcome email successfully when configured', async () => {
            // Setup
            process.env.RESEND_API_KEY = mockEnv.RESEND_API_KEY;
            process.env.RESEND_FROM = mockEnv.RESEND_FROM;

            mockResendSend.mockResolvedValue({
                data: { id: 'test_message_id' },
                error: null,
            });

            // Execute
            const result = await sendWelcome('test@example.com', 'TestUser');

            // Assert
            expect(result).toBe(true);
            expect(mockResendSend).toHaveBeenCalledWith({
                from: 'test@example.com',
                to: ['test@example.com'],
                subject: 'Welcome to Kryloss, TestUser!',
                html: '<html>Mock email HTML</html>',
            });
        });

        it('should send welcome email without username when not provided', async () => {
            // Setup
            process.env.RESEND_API_KEY = mockEnv.RESEND_API_KEY;
            process.env.RESEND_FROM = mockEnv.RESEND_FROM;

            mockResendSend.mockResolvedValue({
                data: { id: 'test_message_id' },
                error: null,
            });

            // Execute
            const result = await sendWelcome('test@example.com');

            // Assert
            expect(result).toBe(true);
            expect(mockResendSend).toHaveBeenCalledWith({
                from: 'test@example.com',
                to: ['test@example.com'],
                subject: 'Welcome to Kryloss!',
                html: '<html>Mock email HTML</html>',
            });
        });

        it('should return false when RESEND_API_KEY is missing', async () => {
            // Setup - only set RESEND_FROM
            process.env.RESEND_FROM = mockEnv.RESEND_FROM;

            // Execute
            const result = await sendWelcome('test@example.com', 'TestUser');

            // Assert
            expect(result).toBe(false);
            expect(mockResendSend).not.toHaveBeenCalled();
        });

        it('should return false when RESEND_FROM is missing', async () => {
            // Setup - only set RESEND_API_KEY
            process.env.RESEND_API_KEY = mockEnv.RESEND_API_KEY;

            // Execute
            const result = await sendWelcome('test@example.com', 'TestUser');

            // Assert
            expect(result).toBe(false);
            expect(mockResendSend).not.toHaveBeenCalled();
        });

        it('should return false when Resend API returns error', async () => {
            // Setup
            process.env.RESEND_API_KEY = mockEnv.RESEND_API_KEY;
            process.env.RESEND_FROM = mockEnv.RESEND_FROM;

            mockResendSend.mockResolvedValue({
                data: null,
                error: { message: 'API error' },
            });

            // Execute
            const result = await sendWelcome('test@example.com', 'TestUser');

            // Assert
            expect(result).toBe(false);
            expect(mockResendSend).toHaveBeenCalled();
        });

        it('should return false when Resend API throws exception', async () => {
            // Setup
            process.env.RESEND_API_KEY = mockEnv.RESEND_API_KEY;
            process.env.RESEND_FROM = mockEnv.RESEND_FROM;

            mockResendSend.mockRejectedValue(new Error('Network error'));

            // Execute
            const result = await sendWelcome('test@example.com', 'TestUser');

            // Assert
            expect(result).toBe(false);
            expect(mockResendSend).toHaveBeenCalled();
        });
    });

    describe('testResendConfig', () => {
        it('should return true when configuration is valid', async () => {
            // Setup
            process.env.RESEND_API_KEY = mockEnv.RESEND_API_KEY;
            process.env.RESEND_FROM = mockEnv.RESEND_FROM;

            mockResendApiKeysList.mockResolvedValue({ data: [] });

            // Execute
            const result = await testResendConfig();

            // Assert
            expect(result).toBe(true);
            expect(mockResendApiKeysList).toHaveBeenCalled();
        });

        it('should return false when RESEND_API_KEY is missing', async () => {
            // Setup - only set RESEND_FROM
            process.env.RESEND_FROM = mockEnv.RESEND_FROM;

            // Execute
            const result = await testResendConfig();

            // Assert
            expect(result).toBe(false);
            expect(mockResendApiKeysList).not.toHaveBeenCalled();
        });

        it('should return false when API call fails', async () => {
            // Setup
            process.env.RESEND_API_KEY = mockEnv.RESEND_API_KEY;
            process.env.RESEND_FROM = mockEnv.RESEND_FROM;

            mockResendApiKeysList.mockRejectedValue(new Error('Invalid API key'));

            // Execute
            const result = await testResendConfig();

            // Assert
            expect(result).toBe(false);
            expect(mockResendApiKeysList).toHaveBeenCalled();
        });
    });
});
