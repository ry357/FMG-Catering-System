import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

export default function EmailManagement() {
  const [activeTab, setActiveTab] = useState('settings');
  
  // Settings State
  const [settings, setSettings] = useState({ host: '', port: '', user: '', pass: '', from: '' });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  
  // Campaign State
  const [campaign, setCampaign] = useState({ subject: '', message: '' });
  const [campaignSending, setCampaignSending] = useState(false);
  const [campaignResult, setCampaignResult] = useState(null);
  
  // Logs State
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);

  // Anniversary Reminders State
  const [anniversaries, setAnniversaries] = useState([]);
  const [anniversarySummary, setAnniversarySummary] = useState(null);
  const [anniversaryLoading, setAnniversaryLoading] = useState(false);
  const [anniversaryTriggering, setAnniversaryTriggering] = useState(false);
  const [anniversaryResult, setAnniversaryResult] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'anniversaries') {
      fetchAnniversaries();
    }
  }, [activeTab, logsPage]);

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
  });

  const fetchAnniversaries = async () => {
    setAnniversaryLoading(true);
    try {
      const res = await axios.get('/api/email/anniversaries', authHeader());
      if (res.data.success) {
        setAnniversaries(res.data.candidates || []);
        setAnniversarySummary(res.data.summary || null);
      }
    } catch (err) {
      console.error('Failed to fetch anniversary candidates:', err);
    } finally {
      setAnniversaryLoading(false);
    }
  };

  const handleTriggerAnniversaries = async () => {
    if (!window.confirm('Check and send anniversary reminder emails to all eligible customers right now?')) {
      return;
    }
    setAnniversaryTriggering(true);
    setAnniversaryResult(null);
    try {
      const res = await axios.post('/api/email/anniversaries/trigger', {}, authHeader());
      if (res.data.success) {
        setAnniversaryResult(res.data);
        fetchAnniversaries();
      }
    } catch (err) {
      console.error('Failed to trigger anniversary process:', err);
      alert(err.response?.data?.error || 'Failed to trigger anniversary process');
    } finally {
      setAnniversaryTriggering(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/email/settings', authHeader());
      if (res.data.success && res.data.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch email settings:', err);
    }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess('');
    try {
      await axios.put('/api/email/settings', settings, authHeader());
      setSettingsSuccess('SMTP settings saved successfully.');
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    if (!campaign.subject || !campaign.message) return alert('Subject and message are required.');
    
    if (!window.confirm('Are you sure you want to send this email broadcast to all past customers? This action cannot be undone.')) {
      return;
    }
    
    setCampaignSending(true);
    setCampaignResult(null);
    try {
      const res = await axios.post('/api/email/campaign', campaign, authHeader());
      if (res.data.success) {
        setCampaignResult(res.data.data);
        setCampaign({ subject: '', message: '' });
      }
    } catch (err) {
      console.error('Failed to send campaign:', err);
      alert(err.response?.data?.error || 'Failed to send campaign');
    } finally {
      setCampaignSending(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await axios.get(`/api/email/logs?page=${logsPage}&limit=20`, authHeader());
      if (res.data.success) {
        setLogs(res.data.logs);
        setLogsTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <div className="bg-[#101A2E] rounded-xl border border-[#1E2A45] shadow-lg overflow-hidden min-h-[600px]">
      <div className="border-b border-[#1E2A45] px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Email Configuration & Campaigns</h2>
        <p className="text-sm text-white mt-1">Configure SMTP, send broadcast emails, and view delivery logs.</p>
      </div>
      
      <div className="flex border-b border-[#1E2A45] bg-[#0B1220]">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'settings' ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          SMTP Settings
        </button>
        <button
          onClick={() => setActiveTab('campaign')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'campaign' ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          Send Campaign
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'logs' ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          Delivery Logs
        </button>
        <button
          onClick={() => setActiveTab('anniversaries')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'anniversaries' ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          Anniversary Reminders
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
              <strong className="block mb-1 text-amber-300">Note on SMTP Settings</strong>
              If you use Gmail, ensure you have enabled 2-Step Verification and generated an <strong>App Password</strong>. Use the App Password here instead of your actual Gmail password.
            </div>
            
            <form onSubmit={handleSettingsSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">SMTP Host</label>
                  <input type="text" value={settings.host || ''} onChange={e => setSettings({...settings, host: e.target.value})} className="w-full bg-[#0B1220] border border-[#1E2A45] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" placeholder="smtp.gmail.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">SMTP Port</label>
                  <input type="number" value={settings.port || ''} onChange={e => setSettings({...settings, port: e.target.value})} className="w-full bg-[#0B1220] border border-[#1E2A45] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" placeholder="465" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">From Address</label>
                <input type="email" value={settings.from || ''} onChange={e => setSettings({...settings, from: e.target.value})} className="w-full bg-[#0B1220] border border-[#1E2A45] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" placeholder="noreply@fmgcatering.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Auth Username</label>
                  <input type="text" value={settings.user || ''} onChange={e => setSettings({...settings, user: e.target.value})} className="w-full bg-[#0B1220] border border-[#1E2A45] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" placeholder="your-email@gmail.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Auth Password (App Password)</label>
                  <input type="password" value={settings.pass || ''} onChange={e => setSettings({...settings, pass: e.target.value})} className="w-full bg-[#0B1220] border border-[#1E2A45] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" placeholder="••••••••••••" />
                </div>
              </div>
              
              <div className="pt-4 flex items-center gap-4">
                <button type="submit" disabled={settingsLoading} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                  {settingsLoading ? 'Saving...' : 'Save Configuration'}
                </button>
                {settingsSuccess && <span className="text-emerald-400 text-sm">{settingsSuccess}</span>}
              </div>
            </form>
          </div>
        )}

        {activeTab === 'campaign' && (
          <div className="max-w-3xl">
            {campaignResult ? (
              <div className="mb-6 p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <h3 className="text-emerald-400 font-semibold mb-2">Campaign Broadcast Complete</h3>
                <p className="text-white text-sm mb-4">Successfully delivered to {campaignResult.sentCount} recipients. Failed deliveries: {campaignResult.failedCount}.</p>
                <button onClick={() => setCampaignResult(null)} className="text-sm bg-[#1E2A45] text-white px-4 py-2 rounded-lg hover:bg-cyan-500/20 transition-colors">
                  Compose New Campaign
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendCampaign} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email Subject</label>
                  <input 
                    type="text" 
                    required 
                    value={campaign.subject} 
                    onChange={e => setCampaign({...campaign, subject: e.target.value})} 
                    className="w-full bg-[#0B1220] border border-[#1E2A45] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 text-lg" 
                    placeholder="e.g. Special Holiday Promo from FMG Catering!" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Message Body (Text/Plain)</label>
                  <textarea 
                    required 
                    rows={8}
                    value={campaign.message} 
                    onChange={e => setCampaign({...campaign, message: e.target.value})} 
                    className="w-full bg-[#0B1220] border border-[#1E2A45] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 font-sans" 
                    placeholder="Write your promotional message here..." 
                  />
                  <p className="text-xs text-white mt-2">This message will be wrapped in FMG Catering's branded HTML email template automatically.</p>
                </div>
                
                <div className="pt-2">
                  <button type="submit" disabled={campaignSending} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                    {campaignSending ? 'Sending Broadcast...' : 'Broadcast to All Customers'}
                    {!campaignSending && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">Recipient</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Subject</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logsLoading ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">Loading logs...</td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No email logs found.</td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600">{format(new Date(log.sent_at), 'MMM d, yyyy h:mm a')}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{log.recipient_email}</td>
                        <td className="px-4 py-3 text-gray-600">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200">{log.email_type}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]" title={log.subject}>{log.subject}</td>
                        <td className="px-4 py-3">
                          {log.status === 'sent' ? (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs font-medium">Sent</span>
                          ) : (
                            <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs font-medium" title={log.error_message}>Failed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {logsTotalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  disabled={logsPage === 1}
                  onClick={() => setLogsPage(p => p - 1)}
                  className="px-3 py-1.5 rounded bg-[#1E2A45] text-white hover:text-white disabled:opacity-30 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-white">Page {logsPage} of {logsTotalPages}</span>
                <button
                  disabled={logsPage === logsTotalPages}
                  onClick={() => setLogsPage(p => p + 1)}
                  className="px-3 py-1.5 rounded bg-[#1E2A45] text-white hover:text-white disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'anniversaries' && (
          <div className="space-y-6 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1E2A45]">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Automated Cron Schedule</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <p className="text-base font-semibold text-white">Daily at 01:00 UTC</p>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">path: /api/cron/anniversary-emails</p>
              </div>

              <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1E2A45]">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Target Policy Window</p>
                <p className="mt-2 text-base font-semibold text-white">~30 Days Prior</p>
                <p className="text-xs text-slate-400 mt-1">Sends 1-year event retention email with personalized greeting & promo offer</p>
              </div>

              <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1E2A45] flex flex-col justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Manual Trigger</p>
                  <p className="text-xs text-slate-400 mt-1">Run immediate check & send to all eligible customers right now</p>
                </div>
                <button
                  onClick={handleTriggerAnniversaries}
                  disabled={anniversaryTriggering}
                  className="mt-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {anniversaryTriggering ? 'Checking & Sending...' : '⚡ Run Check & Send Now'}
                </button>
              </div>
            </div>

            {anniversaryResult && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm">
                <p className="font-semibold text-emerald-300">Anniversary Check Complete</p>
                <p className="text-slate-300 mt-1">
                  Checked: {anniversaryResult.totalChecked} · Eligible: {anniversaryResult.eligibleCount} · Sent: {anniversaryResult.sentCount} · Failed: {anniversaryResult.failedCount}
                </p>
              </div>
            )}

            <div className="bg-[#0B1220] rounded-xl border border-[#1E2A45] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Upcoming Anniversary Retention Queue</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Completed bookings tracked for annual retention email dispatch.
                  </p>
                </div>
                {anniversarySummary && (
                  <div className="flex gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      Ready to Send: {anniversarySummary.readyToSend}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      Already Sent: {anniversarySummary.alreadySent}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-700/40 text-slate-300 border border-slate-600/30">
                      Upcoming: {anniversarySummary.upcoming}
                    </span>
                  </div>
                )}
              </div>

              {anniversaryLoading ? (
                <p className="py-8 text-center text-sm text-slate-400">Loading anniversary queue...</p>
              ) : anniversaries.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">No completed bookings found for anniversary tracking.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1E2A45] text-slate-400 uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-3">Customer</th>
                        <th className="py-3 px-3">Event Type</th>
                        <th className="py-3 px-3">Original Event</th>
                        <th className="py-3 px-3">Next Anniversary</th>
                        <th className="py-3 px-3">Target Send Date</th>
                        <th className="py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2A45]/50">
                      {anniversaries.map((c) => (
                        <tr key={c.bookingId} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3">
                            <p className="font-medium text-white">{c.customerName}</p>
                            <p className="text-slate-400 text-[11px]">{c.customerEmail}</p>
                          </td>
                          <td className="py-3 px-3 text-slate-300 capitalize">{c.eventType}</td>
                          <td className="py-3 px-3 text-slate-400">{c.originalEventDate}</td>
                          <td className="py-3 px-3 text-slate-300">
                            {c.nextAnniversaryDate}
                            <span className="text-[10px] text-slate-500 ml-1">({c.daysUntilAnniversary}d)</span>
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {c.recommendedSendDate}
                            <span className="text-[10px] text-slate-500 ml-1">({c.daysUntilSend > 0 ? `in ${c.daysUntilSend}d` : `${Math.abs(c.daysUntilSend)}d ago`})</span>
                          </td>
                          <td className="py-3 px-3">
                            {c.status === 'ready_to_send' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">
                                Ready to Send
                              </span>
                            )}
                            {c.status === 'already_sent' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-400/10 text-emerald-300 border border-emerald-400/30">
                                Sent
                              </span>
                            )}
                            {c.status === 'upcoming' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700/40 text-slate-300 border border-slate-600/30">
                                Upcoming
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
