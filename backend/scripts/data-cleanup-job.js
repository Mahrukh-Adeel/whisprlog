#!/usr/bin/env node

/**
 * Data Cleanup Job Runner
 *
 * This script processes and cleans up old data based on users' data retention settings.
 * It should be run as a cron job, typically daily or weekly.
 *
 * Example cron job (runs daily at 2 AM):
 * 0 2 * * * /path/to/node /path/to/data-cleanup-job.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processDataCleanup, getCleanupStats } from '../services/dataCleanupService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('Starting WhisprLog Data Cleanup Job...');
console.log(`${new Date().toISOString()}`);

processDataCleanup()
  .then(async (result) => {
    console.log(' Data cleanup job completed successfully');

    // Get and display cleanup statistics
    try {
      const stats = await getCleanupStats();
      console.log('Cleanup Statistics:');
      console.log(`   Total cleanups ever: ${stats.totalCleanups}`);
      console.log(`   Total entries deleted: ${stats.totalEntriesDeleted}`);
      console.log(`   Recent cleanups (30 days): ${stats.recentCleanupsCount}`);
      if (stats.lastCleanup) {
        console.log(`   Last cleanup: ${stats.lastCleanup.toISOString()}`);
      }
    } catch (statsError) {
      console.error('Error getting cleanup stats:', statsError);
    }

    process.exit(0);
  })
  .catch((error) => {
    console.error(' Data cleanup job failed:', error);
    process.exit(1);
  });