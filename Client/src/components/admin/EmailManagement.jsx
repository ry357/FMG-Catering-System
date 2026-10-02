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

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, logsPage]);

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
  });

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
      </div>
    </div>
  );
}
