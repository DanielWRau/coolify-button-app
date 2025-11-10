#!/usr/bin/env node

/**
 * Coolify Deployment Verification Script
 * Checks deployment status via Coolify API
 */

require('dotenv').config();
const https = require('https');
const http = require('http');

const COOLIFY_API_URL = process.env.COOLIFY_API_URL;
const COOLIFY_API_KEY = process.env.COOLIFY_API_KEY;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function callCoolifyAPI(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, COOLIFY_API_URL);
    const protocol = url.protocol === 'https:' ? https : http;

    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${COOLIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = protocol.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data, error: e.message });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function verifyDeployment() {
  console.log('🔍 Coolify Deployment Verification');
  console.log('==================================\n');

  // Check credentials
  if (!COOLIFY_API_URL || !COOLIFY_API_KEY) {
    log('❌ Coolify API credentials not found in .env', 'red');
    process.exit(1);
  }

  log('✅ Coolify API credentials found', 'green');
  log(`   URL: ${COOLIFY_API_URL}\n`);

  try {
    // Get server info
    log('📡 Fetching server information...', 'blue');
    const serverInfo = await callCoolifyAPI('/api/v1/servers');

    if (serverInfo.status !== 200) {
      log(`❌ Failed to connect to Coolify API (HTTP ${serverInfo.status})`, 'red');
      log(`   Response: ${JSON.stringify(serverInfo.data, null, 2)}`);
      process.exit(1);
    }

    log('✅ Connected to Coolify API\n', 'green');

    // Get applications
    log('📦 Fetching application status...', 'blue');
    const appInfo = await callCoolifyAPI('/api/v1/applications');

    if (appInfo.status !== 200) {
      log(`❌ Failed to fetch applications (HTTP ${appInfo.status})`, 'red');
      log(`   Response: ${JSON.stringify(appInfo.data, null, 2)}`);
      process.exit(1);
    }

    // Look for our application
    const apps = Array.isArray(appInfo.data) ? appInfo.data : appInfo.data.applications || [];
    const ourApp = apps.find(app =>
      app.name?.includes('coolify-button-app') ||
      app.fqdn?.includes('coolify-button-app')
    );

    if (ourApp) {
      log('✅ Application found: coolify-button-app', 'green');
      log(`   Status: ${ourApp.status || 'unknown'}`);
      log(`   URL: ${ourApp.fqdn || 'not set'}`);

      if (ourApp.fqdn) {
        log('\n🏥 Health Check...', 'blue');

        // Health check
        try {
          const healthUrl = new URL(ourApp.fqdn);
          const healthProtocol = healthUrl.protocol === 'https:' ? https : http;

          const healthCheck = await new Promise((resolve) => {
            const req = healthProtocol.get(ourApp.fqdn, (res) => {
              resolve(res.statusCode);
            });
            req.on('error', () => resolve('error'));
            req.setTimeout(5000, () => {
              req.destroy();
              resolve('timeout');
            });
          });

          if (healthCheck === 200) {
            log(`✅ Application is accessible (HTTP ${healthCheck})`, 'green');
          } else if (healthCheck === 'timeout') {
            log('⚠️  Health check timed out', 'yellow');
          } else if (healthCheck === 'error') {
            log('⚠️  Health check failed (connection error)', 'yellow');
          } else {
            log(`⚠️  Application returned HTTP ${healthCheck}`, 'yellow');
          }
        } catch (error) {
          log(`⚠️  Health check error: ${error.message}`, 'yellow');
        }
      }
    } else {
      log('⚠️  Application "coolify-button-app" not found', 'yellow');
      log(`   Found ${apps.length} application(s) in total`);

      if (apps.length > 0) {
        log('\n   Available applications:');
        apps.forEach(app => {
          log(`   - ${app.name || app.fqdn || 'unnamed'} (${app.status || 'unknown'})`);
        });
      }
    }

    log('\n==================================');
    log('✨ Verification complete', 'green');

  } catch (error) {
    log(`\n❌ Verification failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

verifyDeployment();
