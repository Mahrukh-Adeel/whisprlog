import { MongoClient } from 'mongodb';
import admin from 'firebase-admin';
import { EmailClient } from '@azure/communication-email';

const getCosmosDbUri = () => process.env.COSMOSDB_URI;
const getCosmosDbName = () => process.env.COSMOSDB_DBNAME || 'whisprlog';
const getAzureCommunicationConnectionString = () => process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
const getAzureCommunicationEmailFrom = () => process.env.AZURE_COMMUNICATION_EMAIL_FROM || 'noreply@whisprlog.com';

let client;
let privacyCollection;
let reminderHistoryCollection;
let emailClient;

async function connectDB() {
  if (!client) {
    const cosmosUri = getCosmosDbUri();
    if (!cosmosUri) throw new Error('COSMOSDB_URI is not set');
    client = new MongoClient(cosmosUri);
    try {
      await client.connect();
      const db = client.db(getCosmosDbName());
      privacyCollection = db.collection('privacySettings');
      reminderHistoryCollection = db.collection('reminderHistory');
    } catch (err) {
      client = null;
      console.error('connectDB: failed to connect to MongoDB', err?.message || err);
      throw err;
    }
  }
  if (!privacyCollection || !reminderHistoryCollection) {
    const db = client.db(getCosmosDbName());
    privacyCollection = db.collection('privacySettings');
    reminderHistoryCollection = db.collection('reminderHistory');
  }
}

/**
 * Initialize Azure Communication Services Email client
 */
async function initializeEmailClient() {
  if (!emailClient && getAzureCommunicationConnectionString()) {
    try {
      emailClient = new EmailClient(getAzureCommunicationConnectionString());
    } catch (error) {
      throw error;
    }
  }
  return emailClient;
}

/**
 * Get users who have weekly reminders enabled and haven't received a reminder recently
 * @returns {Array} Array of user objects eligible for reminders
 */
export const getUsersForReminders = async () => {
  try {
    await connectDB();

    const usersWithReminders = await privacyCollection.find({
      weeklyReminders: true
    }).toArray();

    console.log(`Found ${usersWithReminders.length} users with weekly reminders enabled`);

    const eligibleUsers = [];

    for (const user of usersWithReminders) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentReminder = await reminderHistoryCollection.findOne({
        uid: user.uid,
        sentAt: { $gte: sevenDaysAgo }
      });

      if (!recentReminder) {
        try {
          const userRecord = await admin.auth().getUser(user.uid);
          eligibleUsers.push({
            uid: user.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || 'User',
            privacySettings: user
          });
        } catch (firebaseError) {
          console.error(`Error fetching user ${user.uid} from Firebase:`, firebaseError.message);
        }
      }
    }

    console.log(`Found ${eligibleUsers.length} users eligible for reminders`);
    return eligibleUsers;
  } catch (error) {
    console.error('Error getting users for reminders:', error);
    return [];
  }
};

/**
 * Send a reminder to a user
 * @param {Object} user - User object with uid, email, displayName
 * @returns {boolean} Success status
 */
export const sendReminder = async (user) => {
  try {
    console.log(` Sending reminder to ${user.email} (${user.displayName})`);

    const client = await initializeEmailClient();

    if (!client) {
      await recordReminderSent(user.uid, 'email', {
        to: user.email,
        subject: 'Time for your weekly reflection! 🌟',
        status: 'failed_no_client'
      });
      return false;
    }

    const emailMessage = {
      senderAddress: getAzureCommunicationEmailFrom(),
      recipients: {
        to: [{ address: user.email }]
      },
      content: {
        subject: 'Time for your weekly reflection! 🌟',
        html: generateReminderEmailHTML(user)
      }
    };

    const poller = await client.beginSend(emailMessage);
    const result = await poller.pollUntilDone();

    if (result.status === 'Succeeded') {
      console.log(`✅ Email sent successfully to ${user.email}`);
      await recordReminderSent(user.uid, 'email', {
        to: user.email,
        subject: 'Time for your weekly reflection! 🌟',
        messageId: result.messageId,
        status: 'sent'
      });
      return true;
    } else {
      console.error(` Failed to send email to ${user.email}:`, result.error);
      await recordReminderSent(user.uid, 'email', {
        to: user.email,
        subject: 'Time for your weekly reflection! 🌟',
        status: 'failed',
        error: result.error?.message
      });
      return false;
    }

  } catch (error) {
    console.error(`Error sending reminder to ${user.email}:`, error);

    // Record the failed attempt
    await recordReminderSent(user.uid, 'email', {
      to: user.email,
      subject: 'Time for your weekly reflection! 🌟',
      status: 'error',
      error: error.message
    });

    return false;
  }
};

/**
 * Generate HTML content for reminder email
 * @param {Object} user - User object
 * @returns {string} HTML email content
 */
const generateReminderEmailHTML = (user) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Weekly Journal Reminder</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌟 Time for Your Weekly Reflection</h1>
          <p>${currentDate}</p>
        </div>
        <div class="content">
          <h2>Hello ${user.displayName}!</h2>
          <p>It's been a week since your last journal entry. Taking a few moments to reflect on your thoughts and experiences can be incredibly valuable for your well-being.</p>

          <p>Consider these gentle prompts for your reflection:</p>
          <ul>
            <li>What were the highlights of your week?</li>
            <li>What challenges did you face, and how did you overcome them?</li>
            <li>What are you grateful for right now?</li>
            <li>What would you like to focus on in the coming week?</li>
          </ul>

          <p>Your journal is a safe space for self-discovery and growth. Even a few minutes of writing can make a meaningful difference.</p>

          <a href="${getFrontendUrl()}/journal" class="button">Write in Your Journal</a>

          <p>You can manage your reminder preferences anytime in your <a href="${getFrontendUrl()}/profile">profile settings</a>.</p>
        </div>
        <div class="footer">
          <p>This reminder was sent because you have weekly reminders enabled in your WhisprLog settings.</p>
          <p>WhisprLog - Your personal journaling companion</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Record that a reminder was sent to prevent duplicates
 * @param {string} uid - User ID
 * @param {string} type - Reminder type (email, push, etc.)
 * @param {Object} data - Reminder data/details
 */
export const recordReminderSent = async (uid, type, data) => {
  try {
    await connectDB();

    await reminderHistoryCollection.insertOne({
      uid,
      type,
      data,
      sentAt: new Date(),
      createdAt: new Date()
    });

  } catch (error) {
    console.error(' Error recording reminder:', error);
  }
};

/**
 * Main function to process and send reminders
 * This should be called by a cron job or scheduled task
 */
export const processReminders = async () => {
  try {
    console.log('Starting reminder processing job...');

    const eligibleUsers = await getUsersForReminders();

    if (eligibleUsers.length === 0) {
      console.log('No users eligible for reminders at this time.');
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const user of eligibleUsers) {
      try {
        const success = await sendReminder(user);
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to process reminder for user ${user.uid}:`, error);
        failureCount++;
      }
    }

    console.log(`Reminder job completed. Success: ${successCount}, Failures: ${failureCount}`);

  } catch (error) {
    console.error('Error in reminder processing job:', error);
  }
};

// For testing purposes - can be called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processReminders().then(() => {
    console.log('Reminder job finished');
    process.exit(0);
  }).catch((error) => {
    console.error('Reminder job failed:', error);
    process.exit(1);
  });
}