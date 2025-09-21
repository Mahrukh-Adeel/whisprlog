#!/usr/bin/env node

import { processReminders } from '../services/reminderService.js';

async function testAzureEmailIntegration() {
  try {
    console.log(' Testing Azure Communication Services Email Integration...');
    console.log(`${new Date().toISOString()}`);

    console.log('\n🔍 Checking environment variables...');
    console.log(`COSMOSDB_URI: ${process.env.COSMOSDB_URI ? '✅ Set' : '❌ Not set'}`);
    console.log(`AZURE_COMMUNICATION_CONNECTION_STRING: ${process.env.AZURE_COMMUNICATION_CONNECTION_STRING ? '✅ Set' : '❌ Not set'}`);
    console.log(`AZURE_COMMUNICATION_EMAIL_FROM: ${process.env.AZURE_COMMUNICATION_EMAIL_FROM || 'noreply@whisprlog.com'}`);

    if (!process.env.COSMOSDB_URI) {
      console.log('\n  COSMOSDB_URI not set - cannot test database connection');
      console.log(' Set up your Azure CosmosDB connection string in .env file');
    }

    if (!process.env.AZURE_COMMUNICATION_CONNECTION_STRING) {
      console.log('\n AZURE_COMMUNICATION_CONNECTION_STRING not set - emails will not be sent');
      console.log(' Set up your Azure Communication Services connection string in .env file');
      console.log(' See README.md for setup instructions');
    }

    console.log('\nRunning reminder processing...');
    await processReminders();

    console.log('\n Azure email integration test completed');
    console.log('\n Next steps:');
    console.log('1. Set up Azure Communication Services (see README.md)');
    console.log('2. Configure environment variables');
    console.log('3. Test with a real user who has weeklyReminders enabled');
    console.log('4. Schedule the reminder job to run weekly');

  } catch (error) {
    console.error(' Azure email integration test failed:', error);
    process.exit(1);
  }
}

testAzureEmailIntegration();