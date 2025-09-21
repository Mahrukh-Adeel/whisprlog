#!/usr/bin/env node

/**
 * Reminder Job Runner
 *
 * This script processes and sends weekly reminders to users who have opted in.
 * It should be run as a cron job, typically once per week.
 *
 * Example cron job (runs every Monday at 9 AM):
 * 0 9 * * 1 /path/to/node /path/to/reminder-job.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processReminders } from '../services/reminderService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('Starting WhisprLog Reminder Job...');
console.log(`${new Date().toISOString()}`);

processReminders()
  .then(() => {
    console.log('Reminder job completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Reminder job failed:', error);
    process.exit(1);
  });