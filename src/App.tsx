import React, { useState, useEffect } from 'react';
import { Download, FileText, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';

// Use environment variable or fallback to your backend URL
const RENDER_URL = import.meta.env.VITE_API_URL || 'https://printsync-backend.onrender.com';

export default function App() {
  const [files, setFiles] = useState<any[]>([]);
  const [live, setLive] = useState(false);
  const [merchantId, setMerchantId] = useState<string>('');

  // 1. Initialize Merchant ID from localStorage or generate a new one
  useEffect(() => {
    const savedId = localStorage.getItem('printsync_merchant_id');
    if (savedId) {
      setMerchantId(savedId);
    } else {
      const newId = `store_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('printsync_merchant_id', newId);
      setMerchantId(newId);
    }
  }, []);

  // 2. Poll the backend only after merchantId is set
  useEffect(() => {
    if (!merchantId) return;

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${RENDER_URL}/api/documents/merchant-status/${merchantId}`);
        if (res.ok) {
          const data = await res.json();
          
          if (data.ready && data.sessionId) {
            setFiles([{
              id: data.sessionId,
              name: `Incoming_Print_${data.sessionId.substring(0, 5)}.pdf`
            }]);
          } else {
            setFiles([]);
          }
          setLive(true);
        } else {
          setLive(false);
        }
      } catch (e) { 
        setLive(false); 
      }
    }, 3000);
    
    return () => clearInterval(poll);
  }, [merchantId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-black tracking-tighter text-blue-400">PRINTSYNC <span className="text-white">PRO</span></h1>
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
          <div className={`w-2 h-2 rounded-full ${live ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{live ? 'Global Live' : 'Offline'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* QR Section */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col items-center h-fit">
          <div className="bg-white p-3 rounded-xl mb-4 shadow-[0_0_30px_-5px_rgba(59,130,246,0.6)]">
            {merchantId && <QRCodeCanvas value={merchantId} size={150} />}
          </div>
          <p className="text-xs text-slate-500 uppercase font-bold">
            Terminal ID: {merchantId || 'Generating...'}
          </p>
        </div>

        {/* Queue Section */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Incoming Documents</h2>
          <AnimatePresence>
            {files.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-slate-800 rounded-3xl text-slate-600">
                Waiting for global sync...
              </div>
            ) : (
              files.map((file, index) => (
                <motion.div 
                  key={file.id || index}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                      {file.name?.endsWith('.pdf') ? <FileText size={20} /> : <File size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold truncate max-w-[200px]">{file.name || 'Document'}</p>
                      <p className="text-[10px] text-slate-500 uppercase">Just now</p>
                    </div>
                  </div>
                  <a href={`${RENDER_URL}/api/documents/download/${file.id}`} className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">
                    <Download size={18} />
                  </a>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}