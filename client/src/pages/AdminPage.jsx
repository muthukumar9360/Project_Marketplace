import { useState, useEffect } from 'react';
import { adminGetRequests, adminAcceptPayment, adminDeclinePayment, getSettings, adminUpdateSettings, adminSaveFcmToken } from '../services/api';
import { socket, connectSocket, disconnectSocket } from '../services/socket';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);

  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'sync'
  const [githubRepos, setGithubRepos] = useState([]);
  const [syncing, setSyncing] = useState(false);
  
  // State for the forms of each repo
  const [repoConfigs, setRepoConfigs] = useState({});
  
  // Settings state
  const [settings, setSettings] = useState({
    upiId: '',
    sellerName: '',
    developerTitle: '',
    githubProfile: '',
    linkedinProfile: '',
    leetcodeProfile: '',
    portfolioUrl: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await adminGetRequests(credentials);
      setRequests(data);
      setIsAuthenticated(true);
      
      // Also connect to admin socket
      connectSocket();
      socket.emit('join_admin_room', credentials);
      
      // Fetch settings
      try {
        const s = await getSettings();
        setSettings({
          upiId: s.upiId || import.meta.env.VITE_UPI_ID || '',
          sellerName: s.sellerName || import.meta.env.VITE_SELLER_NAME || '',
          developerTitle: s.developerTitle || import.meta.env.VITE_DEVELOPER_TITLE || '',
          githubProfile: s.githubProfile || import.meta.env.VITE_GITHUB_PROFILE || '',
          linkedinProfile: s.linkedinProfile || import.meta.env.VITE_LINKEDIN_PROFILE || '',
          leetcodeProfile: s.leetcodeProfile || import.meta.env.VITE_LEETCODE_PROFILE || '',
          portfolioUrl: s.portfolioUrl || import.meta.env.VITE_PORTFOLIO_URL || ''
        });
      } catch (e) {
        console.error('Failed to load settings');
      }
      
      // STRICTLY request notification ONLY after successful login!
      if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
          await Notification.requestPermission();
        }
        if (Notification.permission === "granted") {
          const { requestFirebaseToken } = await import('../firebase');
          const token = await requestFirebaseToken();
          if (token) {
            await adminSaveFcmToken(token, credentials).catch(e => console.error("Failed to save FCM token", e));
          }
        }
      }

      connectSocket();
      socket.emit('join_admin_room', credentials);

      socket.on('new_payment_request', (req) => {
        setRequests(prev => [req, ...prev]);
        setNotification(req);
        
        // Auto-hide the in-app toast after 10 seconds
        setTimeout(() => {
          setNotification(prev => prev?.id === req.id ? null : prev);
        }, 10000);

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("New Payment Verification Request!", {
            body: `Verify payment of ₹${req.amount} for ${req.projectName}`,
            icon: "/favicon.ico"
          });
        }
      });
      
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (isAuthenticated) {
        socket.off('new_payment_request');
        disconnectSocket();
      }
    };
  }, [isAuthenticated]);

  const handleAccept = async (requestId) => {
    try {
      await adminAcceptPayment(requestId, credentials);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      if (notification?.id === requestId) setNotification(null);
    } catch (err) {
      alert('Failed to accept request');
    }
  };

  const handleDecline = async (requestId) => {
    if (!window.confirm('Are you sure you want to decline this payment?')) return;
    try {
      await adminDeclinePayment(requestId, credentials);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      if (notification?.id === requestId) setNotification(null);
    } catch (err) {
      alert('Failed to decline request');
    }
  };

  const handleFetchRepos = async () => {
    setSyncing(true);
    try {
      const { adminGetGithubRepos, getProjects } = await import('../services/api');
      
      const [repos, existingProjects] = await Promise.all([
        adminGetGithubRepos(credentials),
        getProjects()
      ]);
      
      setGithubRepos(repos);
      
      // Initialize forms with existing data if the project is already published
      const initialConfigs = {};
      repos.forEach(r => {
        const existing = existingProjects.find(p => p.id === r.name);
        
        if (existing) {
          initialConfigs[r.id] = {
            title: existing.title || r.name,
            price: existing.price || 0,
            zipPath: existing.zipPath || `${r.name}.zip`,
            shortDescription: existing.shortDescription || r.description || 'No description provided.',
            category: existing.category || 'Software',
            technologies: existing.technologies?.length ? existing.technologies : (r.language ? [r.language] : [])
          };
        } else {
          initialConfigs[r.id] = {
            title: r.name,
            price: 0,
            zipPath: `${r.name}.zip`,
            shortDescription: r.description || 'No description provided.',
            category: 'Software',
            technologies: r.language ? [r.language] : []
          };
        }
      });
      setRepoConfigs(initialConfigs);
    } catch (err) {
      alert('Failed to fetch github repos. Ensure VITE_GITHUB_PROFILE is set correctly in .env');
    } finally {
      setSyncing(false);
    }
  };

  const handlePublish = async (repo) => {
    const config = repoConfigs[repo.id];
    const newProject = {
      id: repo.name,
      slug: repo.name.toLowerCase(),
      title: config.title || repo.name,
      shortDescription: config.shortDescription,
      fullDescription: repo.description || 'No description provided.',
      price: Number(config.price),
      category: config.category,
      technologies: config.technologies,
      features: ['Source Code', 'Direct Download'],
      tags: [],
      keywords: [],
      screenshots: [],
      github: {
        owner: repo.owner.login,
        repository: repo.name,
        languages: repo.language ? [repo.language] : [],
        lastUpdate: new Date(repo.updated_at).toISOString().split('T')[0]
      },
      zipPath: config.zipPath
    };
    
    try {
      const { adminPublishProject } = await import('../services/api');
      await adminPublishProject(newProject, credentials);
      alert(`${repo.name} has been published successfully!`);
    } catch (err) {
      alert('Failed to publish project');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Login</h1>
          {error && <div className="text-red-400 text-sm mb-4 text-center">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Username</label>
              <input 
                type="text" 
                value={credentials.username}
                onChange={e => setCredentials({...credentials, username: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Password</label>
              <input 
                type="password" 
                value={credentials.password}
                onChange={e => setCredentials({...credentials, password: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-4"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 py-12">
      {/* In-App Toast Notification */}
      {notification && (
        <div className="fixed bottom-8 right-8 z-50 bg-blue-600 text-white p-6 rounded-2xl shadow-2xl border border-blue-400/50 flex flex-col gap-2 max-w-sm animate-bounce-short">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="font-bold text-lg leading-tight">New Payment Request!</h3>
              <p className="text-blue-100 text-sm mt-1">
                <strong>{notification.projectName}</strong>
              </p>
            </div>
            <button onClick={() => setNotification(null)} className="text-blue-200 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="text-2xl font-black mt-2">₹{notification.amount}</div>
          <div className="flex gap-2 mt-3">
            <button 
              onClick={() => { handleAccept(notification.id); setActiveTab('requests'); }}
              className="flex-1 bg-white text-blue-600 font-bold py-2 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
            >
              ACCEPT
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 w-full md:w-fit overflow-x-auto scrollbar-hide whitespace-nowrap">
          <button 
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'requests' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Verifications
            {requests.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{requests.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('sync')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'sync' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            GitHub Sync
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Settings
          </button>
        </div>
      </div>

      {activeTab === 'requests' && (
        <>
          {requests.length === 0 ? (
            <div className="bg-slate-800/50 p-12 rounded-3xl border border-slate-700 text-center">
              <div className="text-slate-500 mb-2">No pending requests</div>
              <div className="text-sm text-slate-600">New requests will appear here automatically.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <div>
                    <div className="text-xs text-blue-400 font-bold tracking-wider mb-1">NEW PAYMENT VERIFICATION REQUEST</div>
                    <div className="text-xl font-bold text-white mb-1">{req.projectName}</div>
                    <div className="text-slate-400 text-sm">
                      Amount: <strong className="text-white">₹{req.amount}</strong> &bull; Expires: {new Date(req.expiresAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button 
                      onClick={() => handleAccept(req.id)}
                      className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-green-500/20"
                    >
                      ACCEPT
                    </button>
                    <button 
                      onClick={() => handleDecline(req.id)}
                      className="flex-1 md:flex-none bg-slate-700 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors border border-slate-600 hover:border-red-500"
                    >
                      DECLINE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'sync' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Sync from GitHub</h2>
              <p className="text-slate-400 text-sm">Fetch public repositories and publish them to your marketplace.</p>
            </div>
            <button 
              onClick={handleFetchRepos}
              disabled={syncing}
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl transition-colors font-medium border border-slate-600 flex items-center gap-2"
            >
              {syncing ? 'Fetching...' : 'Fetch Repositories'}
            </button>
          </div>

          {githubRepos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {githubRepos.map(repo => (
                <div key={repo.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2">{repo.name}</h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {repo.description || 'No description available'}
                  </p>
                  
                  <div className="space-y-4 mb-6 flex-grow">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">Price (₹)</label>
                      <input 
                        type="number" 
                        value={repoConfigs[repo.id]?.price || 0}
                        onChange={e => setRepoConfigs(prev => ({...prev, [repo.id]: {...prev[repo.id], price: e.target.value.replace(/^0+(?=\d)/, '')}}))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">Title</label>
                      <input 
                        type="text" 
                        value={repoConfigs[repo.id]?.title || ''}
                        onChange={e => setRepoConfigs(prev => ({...prev, [repo.id]: {...prev[repo.id], title: e.target.value}}))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">Short Description</label>
                      <textarea 
                        value={repoConfigs[repo.id]?.shortDescription || ''}
                        onChange={e => setRepoConfigs(prev => ({...prev, [repo.id]: {...prev[repo.id], shortDescription: e.target.value}}))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none h-16 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">Technologies (comma separated)</label>
                      <input 
                        type="text" 
                        value={(repoConfigs[repo.id]?.technologies || []).join(', ')}
                        onChange={e => setRepoConfigs(prev => ({...prev, [repo.id]: {...prev[repo.id], technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean)}}))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">ZIP Filename</label>
                      <input 
                        type="text" 
                        value={repoConfigs[repo.id]?.zipPath || ''}
                        onChange={e => setRepoConfigs(prev => ({...prev, [repo.id]: {...prev[repo.id], zipPath: e.target.value}}))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Must be inside protected-files/</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handlePublish(repo)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors mt-auto"
                  >
                    Publish to Marketplace
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'settings' && (
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6">Site Settings</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setSavingSettings(true);
            try {
              const res = await adminUpdateSettings(settings, credentials);
              setSettings(res.settings);
              alert('Settings saved successfully!');
            } catch(e) {
              alert('Failed to save settings');
            } finally {
              setSavingSettings(false);
            }
          }} className="space-y-6">
            <div>
              <label className="block text-sm text-slate-400 mb-1 uppercase tracking-wider">UPI ID</label>
              <input 
                type="text" 
                value={settings?.upiId || ''}
                onChange={e => setSettings({...settings, upiId: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                required
              />
              <p className="text-xs text-slate-500 mt-1">This is where customer payments will be directed. You can enter multiple UPI IDs separated by commas.</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1 uppercase tracking-wider">Seller Name</label>
              <input 
                type="text" 
                value={settings?.sellerName || ''}
                onChange={e => setSettings({...settings, sellerName: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1 uppercase tracking-wider">Developer Title</label>
              <input 
                type="text" 
                value={settings?.developerTitle || ''}
                onChange={e => setSettings({...settings, developerTitle: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <h3 className="text-lg font-bold text-white pt-4 border-t border-slate-700">Social Links</h3>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1 uppercase tracking-wider">GitHub Profile URL</label>
              <input 
                type="url" 
                value={settings?.githubProfile || ''}
                onChange={e => setSettings({...settings, githubProfile: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1 uppercase tracking-wider">LinkedIn Profile URL</label>
              <input 
                type="url" 
                value={settings?.linkedinProfile || ''}
                onChange={e => setSettings({...settings, linkedinProfile: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1 uppercase tracking-wider">LeetCode Profile URL</label>
              <input 
                type="url" 
                value={settings?.leetcodeProfile || ''}
                onChange={e => setSettings({...settings, leetcodeProfile: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1 uppercase tracking-wider">Portfolio URL</label>
              <input 
                type="url" 
                value={settings?.portfolioUrl || ''}
                onChange={e => setSettings({...settings, portfolioUrl: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={savingSettings}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/25"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
