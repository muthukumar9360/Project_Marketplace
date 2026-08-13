import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { validateDownloadToken, getDownloadUrl } from '../services/api';

export default function DownloadPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(null);
  const [status, setStatus] = useState('VALIDATING'); // VALIDATING, READY, EXPIRED, USED, DOWNLOADING
  const [error, setError] = useState('');
  
  useEffect(() => {
    let intervalId;
    
    const init = async () => {
      try {
        const data = await validateDownloadToken(token);
        
        // Calculate remaining time
        const updateTimer = () => {
          const remaining = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
          setTimeLeft(remaining);
          
          if (remaining <= 0) {
            setStatus('EXPIRED');
            clearInterval(intervalId);
            localStorage.removeItem('downloadSession');
          }
        };
        
        updateTimer();
        intervalId = setInterval(updateTimer, 1000);
        setStatus('READY');
        
      } catch (err) {
        setStatus(err.status === 'USED' ? 'USED' : 'EXPIRED');
        setError(err.error || 'Invalid or expired token.');
        localStorage.removeItem('downloadSession');
      }
    };
    
    init();
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [token]);

  const handleDownload = () => {
    if (status !== 'READY') return;
    
    setStatus('DOWNLOADING');
    localStorage.removeItem('downloadSession');
    
    // Create an invisible iframe/link to trigger the download
    const link = document.createElement('a');
    link.href = getDownloadUrl(token);
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Assume USED after click. Server will enforce.
    setTimeout(() => {
      setStatus('USED');
    }, 1000);
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (status === 'VALIDATING') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="animate-pulse text-blue-500 mb-4">Validating your access...</div>
      </div>
    );
  }

  if (status === 'EXPIRED' || status === 'USED') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-red-500/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Access {status === 'USED' ? 'Used' : 'Expired'}</h1>
        <p className="text-slate-400 mb-8">
          {status === 'USED' 
            ? 'This one-time download link has already been used.' 
            : 'The 5-minute download window has expired.'}
        </p>
        <button onClick={() => navigate('/')} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <div className="bg-green-500/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">PAYMENT VERIFIED ✓</h1>
      <p className="text-slate-400 mb-10">Your project is ready to download.</p>

      <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl relative overflow-hidden mb-8">
        <div className="text-sm text-slate-400 mb-2 uppercase tracking-wider font-bold">Download Access Expires In:</div>
        <div className={`text-6xl font-bold font-mono mb-8 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
          {formatTime(timeLeft)}
        </div>
        
        <button 
          onClick={handleDownload}
          disabled={status !== 'READY'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          DOWNLOAD PROJECT ZIP
        </button>
      </div>
      
      <p className="text-xs text-slate-500 max-w-sm mx-auto">
        Important: You can only download this file once. Do not close this page or refresh until your download is complete.
      </p>
    </div>
  );
}
