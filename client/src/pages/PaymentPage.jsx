import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { siteConfig } from '../config/siteConfig';
import { createPaymentRequest, getProjects, getSettings } from '../services/api';

export default function PaymentPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    Promise.all([getProjects(), getSettings()])
      .then(([projectsData, settingsData]) => {
        const found = projectsData.find(p => p.slug === slug);
        setProject(found || null);
        setSettings(settingsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-12 text-center text-white">Loading...</div>;
  if (!project) return <Navigate to="/" />;

  const handlePaid = async () => {
    try {
      setSubmitting(true);
      setError('');
      const request = await createPaymentRequest(project.id, project.title, project.price);
      navigate(`/waiting/${request.id}`, { replace: true });
    } catch (err) {
      setError('Failed to create payment request. Please try again.');
      setLoading(false);
    }
  };

  const upiIdsString = settings?.upiId || siteConfig.upiId || '';
  const upiIds = upiIdsString.split(',').map(id => id.trim()).filter(id => id.length > 0);

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Complete Your Purchase</h1>
        <p className="text-slate-400">Scan the QR code or use the UPI ID to pay securely.</p>
      </div>

      <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
        {/* Project Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-8 border-b border-slate-700 gap-4">
          <div>
            <div className="text-sm text-slate-400 mb-1">Project</div>
            <div className="font-bold text-white text-lg">{project.title}</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-sm text-slate-400 mb-1">Amount</div>
            <div className="font-bold text-blue-400 text-2xl">₹{project.price}</div>
          </div>
        </div>

        {/* UPI Details */}
        <div className="flex flex-col items-center mb-8 space-y-3 w-full">
          {upiIds.map((id, index) => (
            <div key={index} className="w-full bg-slate-900 rounded-xl p-4 flex justify-between items-center border border-slate-700">
              <div>
                <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">UPI ID {upiIds.length > 1 ? index + 1 : ''}</div>
                <div className="font-mono text-slate-200 text-lg">{id}</div>
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(id)}
                className="text-blue-400 hover:text-blue-300 p-3 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                title="Copy UPI ID"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            </div>
          ))}
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-xl text-sm text-center mb-8">
          Complete the payment by sending the exact amount to {upiIds.length > 1 ? <strong>ANY ONE of the UPI IDs</strong> : <strong>the UPI ID</strong>} above to get your project. After payment is completed, click <strong>I HAVE PAID</strong>.
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center mb-6">
            {error}
          </div>
        )}

        <div className="mb-6 flex items-start gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
          <input 
            type="checkbox" 
            id="terms" 
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-slate-600 text-blue-500 focus:ring-blue-500 bg-slate-800"
          />
          <label htmlFor="terms" className="text-xs text-slate-400 leading-relaxed cursor-pointer select-none">
            I understand that payments are <strong>strictly non-refundable</strong>. 
            Once payment is verified, I will receive a one-time download link valid for exactly <strong>5 minutes</strong>. 
            If I fail to download the project within this time frame, access will be permanently revoked.
          </label>
        </div>

        <button 
          onClick={handlePaid}
          disabled={submitting || !termsAccepted}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {submitting ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : 'I HAVE PAID'}
        </button>
      </div>
    </div>
  );
}
