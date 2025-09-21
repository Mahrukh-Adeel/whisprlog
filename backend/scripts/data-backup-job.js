#!/usr/bin/env node

import { processBackups } from '../services/backupService.js';

async function runBackupJob() {
  try {
    console.log('Starting WhisprLog Data Backup Job...');
    console.log(`${new Date().toISOString()}`);

    const result = await processBackups();

    console.log('Backup job completed successfully');
    console.log(`Results: ${JSON.stringify(result, null, 2)}`);

    process.exit(0);
  } catch (error) {
    console.error('Backup job failed:', error);
    process.exit(1);
  }
}

runBackupJob();