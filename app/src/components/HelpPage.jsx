import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, BookOpen, Shield } from 'lucide-react';

const HelpPage = () => {
  const [activeTab, setActiveTab] = useState('basics');

  const tabs = [
    { id: 'basics', label: 'Mental Health Basics', icon: Heart },
    { id: 'anonymous', label: 'Anonymous Usage', icon: BookOpen },
    { id: 'privacy', label: 'Privacy & Safety', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Heart className="w-12 h-12 text-rose-300 dark:text-rose-400" />
          </div>
          <h1 className="text-3xl font-light text-slate-900 dark:text-white mb-2">Help & Support</h1>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Your guide to emotional wellbeing and using WhisprLog
          </p>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-gray-700 shadow-lg overflow-hidden">
          <div className="border-b border-slate-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:ring-offset-2 ${
                    activeTab === tab.id
                      ? 'text-slate-900 dark:text-white border-b-2 border-slate-600 dark:border-slate-400 bg-white dark:bg-gray-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-700'
                  }`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            {activeTab === 'basics' && (
              <div className="space-y-6" id="panel-basics" role="tabpanel">
                <div>
                  <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-4 flex items-center">
                    <Heart className="w-6 h-6 text-rose-300 dark:text-rose-400 mr-2" />
                    Understanding Your Emotions
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-gray-700/50 rounded-lg">
                      <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">It's Normal to Feel</h3>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        All emotions are valid. Joy, sadness, anger, fear—they all serve a purpose in helping us navigate life. Journaling helps you understand these feelings better.
                      </p>
                    </div>
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                      <h3 className="font-medium text-slate-800 dark:text-rose-200 mb-2">The Power of Writing</h3>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        Research shows that expressive writing can reduce stress, improve immune function, and increase overall wellbeing. It's a gentle form of self-therapy.
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h3 className="font-medium text-slate-800 dark:text-blue-200 mb-2">When to Seek Additional Help</h3>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        If you're experiencing persistent sadness, anxiety, or thoughts of self-harm, please reach out to a mental health professional. WhisprLog complements but doesn't replace professional care.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-4 flex items-center">
                    <BookOpen className="w-6 h-6 text-slate-400 dark:text-slate-500 mr-2" />
                    Advanced AI Features
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50/70 dark:bg-slate-900/20 rounded-lg border border-slate-100/50 dark:border-slate-800/50">
                      <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Deep Emotional Analysis</h3>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        Our AI analyzes your emotional patterns, resilience, and growth over time. It identifies triggers, circadian rhythms, and provides personalized insights about your emotional journey.
                      </p>
                    </div>
                    <div className="p-4 bg-indigo-50/70 dark:bg-indigo-900/20 rounded-lg border border-indigo-100/50 dark:border-indigo-800/50">
                      <h3 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2">Personalized Journaling Prompts</h3>
                      <p className="text-indigo-700 dark:text-indigo-300 leading-relaxed">
                        Receive AI-generated prompts tailored to your emotional patterns and current needs. These prompts help you explore specific areas for growth and self-discovery.
                      </p>
                    </div>
                    <div className="p-4 bg-emerald-50/70 dark:bg-emerald-900/20 rounded-lg border border-emerald-100/50 dark:border-emerald-800/50">
                      <h3 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">Trigger & Pattern Recognition</h3>
                      <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">
                        Identify positive and negative triggers in your life. Understand what consistently improves or challenges your emotional wellbeing, along with coping strategies that work for you.
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50/70 dark:bg-blue-900/20 rounded-lg border border-blue-100/50 dark:border-blue-800/50">
                      <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Weekly Check-in Intelligence</h3>
                      <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                        AI-powered suggestions for your weekly reflections, connecting your check-ins to your daily journaling patterns and providing deeper insights into your growth trajectory.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-4 flex items-center">
                    <Heart className="w-6 h-6 text-rose-300 dark:text-rose-400 mr-2" />
                    Emergency Resources
                  </h2>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-800 dark:text-red-200 font-medium">Crisis Text Line: Text HOME to 741741</p>
                      <p className="text-red-600 dark:text-red-300 text-sm">Free, 24/7 support for those in crisis</p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-800 dark:text-red-200 font-medium">National Suicide Prevention Lifeline: 988</p>
                      <p className="text-red-600 dark:text-red-300 text-sm">Free and confidential emotional support</p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-800 dark:text-red-200 font-medium">Emergency Services: 911</p>
                      <p className="text-red-600 dark:text-red-300 text-sm">For immediate life-threatening emergencies</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'anonymous' && (
              <div className="space-y-6" id="panel-anonymous" role="tabpanel">
                <div>
                  <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-4 flex items-center">
                    <BookOpen className="w-6 h-6 text-slate-400 dark:text-slate-500 mr-2" />
                    Using WhisprLog Anonymously
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                    We understand that privacy is crucial for emotional expression. Here's how anonymous usage works:
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-gray-700/50 rounded-lg">
                      <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">What Anonymous Mode Includes</h3>
                      <ul className="text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                        <li>No email or personal information required</li>
                        <li>Temporary session-based storage in your browser</li>
                        <li>Same AI analysis and insights as registered accounts</li>
                        <li>Access to all journaling features</li>
                        <li>Full mood tracking capabilities</li>
                        <li>Weekly check-in reflections</li>
                        <li>Emotional trend analysis</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <h3 className="font-medium text-slate-800 dark:text-yellow-200 mb-2">Anonymous Mode Limitations</h3>
                      <ul className="text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                        <li>Entries may be lost if you clear browser data</li>
                        <li>No access to long-term trends across sessions</li>
                        <li>Cannot sync across devices</li>
                        <li>Limited data export options (localStorage-based)</li>
                        <li>Session-based data only</li>
                        <li>No cloud backup or recovery options</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h3 className="font-medium text-slate-800 dark:text-blue-200 mb-2">Switching Modes</h3>
                      <p className="text-slate-600 dark:text-slate-300">
                        Start anonymously and create an account later to preserve your entries.{' '}
                        <Link to="/auth?mode=signup" className="underline hover:text-slate-900 dark:hover:text-white">
                          Sign up
                        </Link>{' '}
                        to migrate your anonymous session data to a registered account.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h3 className="font-medium text-slate-800 dark:text-green-200 mb-2">Why Choose Anonymous?</h3>
                      <p className="text-slate-600 dark:text-slate-300">
                        Perfect for trying out WhisprLog, exploring sensitive topics, or prioritizing complete privacy. Your emotional wellbeing shouldn't require giving up your anonymity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6" id="panel-privacy" role="tabpanel">
                <div>
                  <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-4 flex items-center">
                    <Shield className="w-6 h-6 text-slate-400 dark:text-slate-500 mr-2" />
                    Your Privacy & Security
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                    We take your privacy seriously. Your emotional wellbeing depends on feeling safe to express yourself.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h3 className="font-medium text-slate-800 dark:text-green-200 mb-2">Local Data Storage</h3>
                      <p className="text-slate-600 dark:text-slate-300">
                        For anonymous users, journal entries are stored locally in your browser using localStorage. No data is sent to our servers unless you sign up.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h3 className="font-medium text-slate-800 dark:text-green-200 mb-2">AI Analysis Privacy</h3>
                      <p className="text-slate-600 dark:text-slate-300">
                        All emotional analysis is performed securely on our servers using Azure OpenAI. For anonymous users, analysis results are processed server-side but raw journal text is not permanently stored. Registered users' data is encrypted and analyzed to provide personalized insights.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h3 className="font-medium text-slate-800 dark:text-green-200 mb-2">No Third-Party Sharing</h3>
                      <p className="text-slate-600 dark:text-slate-300">
                        Your data is never shared with third parties or used for marketing purposes without your explicit consent.
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h3 className="font-medium text-slate-800 dark:text-blue-200 mb-2">Data Control</h3>
                      <p className="text-slate-600 dark:text-slate-300">
                        Export your entries at any time from the{' '}
                        <Link to="/profile" className="underline hover:text-slate-900 dark:hover:text-white">
                          Profile page
                        </Link>
                        . Registered users can generate comprehensive PDF reports with mood trends, emotional analysis, and insights. Delete your account to permanently remove all data.
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <h3 className="font-medium text-slate-800 dark:text-purple-200 mb-2">Future Security Enhancements</h3>
                      <p className="text-slate-600 dark:text-slate-300">
                        As WhisprLog grows, we plan to implement industry-standard encryption and secure authentication to protect your data.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Questions About Privacy?</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Contact our support team at{' '}
                    <a href="mailto:support@whisprlog.com" className="underline hover:text-slate-900 dark:hover:text-white">
                      support@whisprlog.com
                    </a>{' '}
                    or review our Privacy Policy (coming soon).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;