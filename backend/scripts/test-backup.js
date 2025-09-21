#!/usr/bin/env node

import { getBackupStats, getUsersForBackup } from '../services/backupService.js';

async function testBackupSystem() {
  try {
    console.log('🧪 Testing WhisprLog Backup System...');

    console.log('\n Testing backup statistics...');
    const stats = await getBackupStats();
    console.log('Backup stats:', JSON.stringify(stats, null, 2));

    console.log('\n Testing user eligibility check...');
    const users = await getUsersForBackup();
    console.log(`Found ${users.length} users needing backup`);

    if (users.length > 0) {
      console.log('Sample user:', {
        uid: users[0].uid,
        email: users[0].email,
        autoBackup: users[0].privacySettings?.autoBackup
      });
    }

    console.log('\n Backup system test completed successfully');
  } catch (error) {
    console.error(' Backup system test failed:', error.message);
    process.exit(1);
  }
}

testBackupSystem();