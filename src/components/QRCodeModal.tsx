import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, X, Copy, Check, Smartphone, Download, Share2, Sparkles, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string | null;
  roomTitle?: string;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  roomCode,
  roomTitle,
  addToast
}: QRCodeModalProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = roomCode
    ? `${currentOrigin}/?room=${encodeURIComponent(roomCode)}`
    : typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setHasCopied(true);
      addToast('success', 'Room join link copied to clipboard!');
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      addToast('error', 'Failed to copy link to clipboard.');
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = window.URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, 400, 400);
      context.drawImage(image, 20, 20, 360, 360);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      const safeCode = (roomCode || 'livepad').toLowerCase();
      downloadLink.href = pngUrl;
      downloadLink.download = `LivePad-QR-${safeCode}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      addToast('success', 'QR code saved as PNG image.');
    };
    image.src = blobURL;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-sm bg-white dark:bg-zinc-950 border border-teal-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-800 dark:text-zinc-100"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR Code Modal"
            className="absolute top-4 right-4 p-1.5 text-slate-400 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-500/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Container */}
          <div className="flex items-center gap-3.5 mb-5 pb-3.5 border-b border-slate-100 dark:border-zinc-900/80">
            <div className="p-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>Share via QR Code</span>
                <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Scan with mobile camera to join instantly
              </p>
            </div>
          </div>

          {/* QR Container Card & Branding Elements */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50/90 dark:bg-zinc-900/90 border border-teal-500/25 rounded-2xl mb-5 text-center shadow-inner gap-4">
            <div ref={qrRef} className="p-4 bg-white rounded-2xl shadow-md border border-teal-500/30 dark:border-teal-500/30 flex flex-col items-center">
              <QRCodeSVG
                value={shareUrl}
                size={180}
                level="H"
                includeMargin={false}
                fgColor="#0f172a"
                bgColor="#ffffff"
              />
              {/* Scan to Join Caption */}
              <div className="mt-3.5 flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/20 text-teal-700 dark:text-teal-300 text-[11px] font-bold tracking-wider uppercase">
                <Smartphone className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
                <span>Scan to Join</span>
              </div>
            </div>

            {/* Branding Elements & Metadata */}
            <div className="flex flex-col items-center gap-2 pt-0.5">
              {roomCode && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-mono text-xs font-bold shadow-2xs">
                  <span className="text-slate-500 dark:text-zinc-400 font-sans font-medium text-[11px]">Room Code:</span>
                  <span className="tracking-wider">#{roomCode}</span>
                </div>
              )}
              {roomTitle && (
                <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 truncate max-w-[250px]">
                  {roomTitle}
                </p>
              )}
              <div className="text-[10px] uppercase font-black tracking-widest text-teal-600/70 dark:text-teal-400/70">
                LivePad Workspace
              </div>
            </div>
          </div>

          {/* Link Preview input */}
          <div className="mb-4">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Direct Join Link
            </label>
            <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-mono">
              <span className="truncate flex-1 text-slate-600 dark:text-zinc-400">
                {shareUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-md bg-teal-500 text-white font-sans font-bold text-[11px] hover:bg-teal-600 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {hasCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{hasCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-900">
            <button
              type="button"
              onClick={handleDownloadQR}
              className="flex-1 py-2 px-3 rounded-lg border border-teal-500/30 hover:bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Image</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-lg bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
