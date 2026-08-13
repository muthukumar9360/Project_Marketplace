import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket, connectSocket, disconnectSocket } from '../services/socket';
import { siteConfig } from '../config/siteConfig';
import { getPaymentRequest } from '../services/api';

export default function WaitingPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('PENDING');

  useEffect(() => {
    connectSocket();
    
    // Join the specific room for this request
    socket.emit('join_request_room', requestId);

    // Listen for updates
    const handleStatusUpdate = (data) => {
      setStatus(data.status);
      
      if (data.status === 'ACCEPTED') {
        // Save session locally so user can refresh the download page
        localStorage.setItem('downloadSession', JSON.stringify({
          token: data.downloadToken,
          expiresAt: data.expiresAt
        }));
        
        // Navigate to download page
        navigate(`/download/${data.downloadToken}`, { replace: true });
      }
    };

    socket.on('payment_status_update', handleStatusUpdate);

    return () => {
      socket.off('payment_status_update', handleStatusUpdate);
      disconnectSocket();
    };
  }, [requestId, navigate]);

  if (status === 'DECLINED') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-red-500/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Payment Not Verified</h1>
        <p className="text-slate-400 mb-8">We could not verify your payment. Please check your payment and contact the seller if you need help.</p>
        <div className="flex gap-4 justify-center">
          <a href={`https://wa.me/${siteConfig.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
            WhatsApp
          </a>
          <a href={`mailto:${siteConfig.email}`} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-medium transition-colors">
            Email
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="relative w-24 h-24 mx-auto mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">Payment Verification Pending</h1>
      <p className="text-slate-400">Waiting for seller verification...</p>
      <div className="mt-8 bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-sm text-slate-400">
        Please do not close this page. You will be redirected automatically once the payment is verified.
      </div>
    </div>
  );
}
