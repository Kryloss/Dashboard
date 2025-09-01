#!/usr/bin/env node

/**
 * Simple test script for the welcome webhook
 * Run with: node test-webhook.js
 */

import https from 'https';
import http from 'http';

// Configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/hooks/welcome';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'test_secret';

// Test data
const testPayload = {
    email: 'test@example.com',
    username: 'TestUser'
};

function makeRequest(url, options, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;

        const req = client.request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: response
                    });
                } catch {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testWebhook() {
    console.log('🧪 Testing Welcome Webhook');
    console.log('==========================');
    console.log(`URL: ${WEBHOOK_URL}`);
    console.log(`Secret: ${WEBHOOK_SECRET ? '***' + WEBHOOK_SECRET.slice(-4) : 'NOT SET'}`);
    console.log('');

    try {
        // Test 1: Valid request
        console.log('1️⃣ Testing valid request...');
        const validResponse = await makeRequest(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WEBHOOK_SECRET}`
            }
        }, testPayload);

        console.log(`   Status: ${validResponse.status}`);
        console.log(`   Response:`, validResponse.body);
        console.log('');

        // Test 2: Missing authorization
        console.log('2️⃣ Testing missing authorization...');
        const noAuthResponse = await makeRequest(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, testPayload);

        console.log(`   Status: ${noAuthResponse.status}`);
        console.log(`   Response:`, noAuthResponse.body);
        console.log('');

        // Test 3: Invalid payload
        console.log('3️⃣ Testing invalid payload...');
        const invalidResponse = await makeRequest(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WEBHOOK_SECRET}`
            }
        }, { invalid: 'data' });

        console.log(`   Status: ${invalidResponse.status}`);
        console.log(`   Response:`, invalidResponse.body);
        console.log('');

        // Test 4: Wrong method
        console.log('4️⃣ Testing wrong HTTP method...');
        const wrongMethodResponse = await makeRequest(WEBHOOK_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${WEBHOOK_SECRET}`
            }
        });

        console.log(`   Status: ${wrongMethodResponse.status}`);
        console.log(`   Response:`, wrongMethodResponse.body);
        console.log('');

        console.log('✅ Webhook testing completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
    testWebhook();
}

export { testWebhook };
