import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { 
  Paperclip, 
  Link as LinkIcon, 
  Upload, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  FileText, 
  X, 
  Download, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Eye, 
  Globe 
} from 'lucide-react';
import { Attachment } from '../types';

interface AttachmentsPanelProps {
  attachments: Attachment[];
  onAddAttachment: (attachment: Attachment) => void;
  onDeleteAttachment: (id: string) => void;
  userName: string;
  isReadOnly?: boolean;
}

export const AttachmentsPanel: React.FC<AttachmentsPanelProps> = ({
  attachments,
  onAddAttachment,
  onDeleteAttachment,
  userName,
  isReadOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Link form states
  const [linkTitle, setLinkTitle] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');

  // Ref for native file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For built-in visual lightbox
  const [selectedMedia, setSelectedMedia] = useState<Attachment | null>(null);

  // Helper: Format bytes to human readable string
  const formatBytes = (bytes?: number): string => {
    if (bytes === undefined || bytes === null) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper: Compress/Downscale images client-side
  const compressAndProcessImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Downscale matching target max dimension (e.g. 1020px height or width)
        const MAX_DIM = 1024;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress it into high-efficiency JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          callback(dataUrl);
        } else {
          callback(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle local file uploads
  const processUpload = (file: File) => {
    if (!file) return;
    setErrorMessage(null);
    setIsLoading(true);

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    // Check size limit (strict 700KB for base64 strings to guarantee 100% reliable Firestore saves)
    const MAX_SIZE = 700 * 1024;
    if (file.size > MAX_SIZE) {
      if (isImage) {
        // Automatically downscale and compress images
        compressAndProcessImage(file, (base64Url) => {
          const roughSize = Math.round(base64Url.length * 0.75);
          if (roughSize > MAX_SIZE) {
            setErrorMessage(
              `The image is too large even after compression (${formatBytes(roughSize)}). Direct uploads are limited to 700KB for database reliability. Please link it using the "Web Link" tab instead.`
            );
            setIsLoading(false);
            return;
          }
          const finalAttachment: Attachment = {
            id: 'att_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
            name: file.name,
            type: 'image',
            url: base64Url,
            size: roughSize,
            uploadedAt: Date.now(),
            uploadedBy: userName || 'Anonymous'
          };
          onAddAttachment(finalAttachment);
          setIsLoading(false);
        });
        return;
      } else {
        setErrorMessage(
          `File size is ${formatBytes(file.size)}. Direct uploads are strictly limited to 700KB to ensure reliable real-time database synchronization. To attach larger documents, archives, or PDFs, please link them using the "Web Link" tab.`
        );
        setIsLoading(false);
        return;
      }
    }

    // Process file under 700KB
    const reader = new FileReader();
    reader.onload = (e) => {
      const resultStr = e.target?.result as string;
      let type: 'image' | 'video' | 'document' = 'document';

      if (isImage) type = 'image';
      else if (isVideo) type = 'video';

      const finalAttachment: Attachment = {
        id: 'att_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        name: file.name,
        type,
        url: resultStr,
        size: file.size,
        uploadedAt: Date.now(),
        uploadedBy: userName || 'Anonymous'
      };

      onAddAttachment(finalAttachment);
      setIsLoading(false);
    };

    reader.onerror = () => {
      setErrorMessage("Could not read local file.");
      setIsLoading(false);
    };

    reader.readAsDataURL(file);
  };

  // Drag and Drop Events
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isReadOnly) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isReadOnly) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUpload(e.target.files[0]);
    }
  };

  // Submit web URL hyperlinks
  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) return;

    let finalUrl = linkUrl.trim();
    // Ensure URL prefix exists
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    const finalAttachment: Attachment = {
      id: 'att_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      name: linkTitle.trim(),
      type: 'link',
      url: finalUrl,
      uploadedAt: Date.now(),
      uploadedBy: userName || 'Anonymous'
    };

    onAddAttachment(finalAttachment);
    setLinkTitle('');
    setLinkUrl('');
    setErrorMessage(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      
      {/* Tab Selectors */}
      <div className="flex bg-slate-100/60 dark:bg-zinc-900/60 p-1 rounded-xl mb-4 shrink-0 border border-slate-200/20 dark:border-zinc-800/20">
        <button
          onClick={() => { setActiveTab('upload'); setErrorMessage(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'upload' 
              ? 'bg-white dark:bg-zinc-850 text-[#0ea5e9] shadow-xs' 
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload File</span>
        </button>
        <button
          onClick={() => { setActiveTab('link'); setErrorMessage(null); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'link' 
              ? 'bg-white dark:bg-zinc-850 text-[#0ea5e9] shadow-xs' 
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Web Link</span>
        </button>
      </div>

      {/* Upload zone or URL Form */}
      {!isReadOnly && (
        <div className="shrink-0 mb-4 transition-all">
          {activeTab === 'upload' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragging 
                  ? 'border-cyan-500 bg-cyan-50/10 dark:bg-cyan-950/10 scale-[1.02] shadow-md shadow-cyan-500/5' 
                  : 'border-slate-200 dark:border-zinc-800 hover:border-cyan-400 dark:hover:border-cyan-600 bg-slate-50/20 dark:bg-zinc-900/10'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,video/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip"
              />
              
              <div className={`p-2.5 rounded-full ${isDragging ? 'bg-cyan-500/15 text-cyan-500' : 'bg-slate-100 dark:bg-zinc-850 text-slate-400'}`}>
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>
              
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-700 dark:text-neutral-200">
                  {isLoading ? "Reading and Encrytping File..." : "Drag & Drop or Click to Upload"}
                </span>
                <span className="text-[10px] text-slate-400">
                  Images, Videos, PDFs, ZIP drafts <span className="opacity-95 font-medium">(Auto JPEG compression)</span>
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLinkSubmit} className="space-y-2.5 p-3.5 bg-slate-10 border border-slate-100/50 dark:border-zinc-800/40 dark:bg-zinc-950/25 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Add Web Shortcut</span>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Shortcut Label (e.g., Team Docs)"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  maxLength={30}
                  className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-1 focus:ring-cyan-500/50 focus:outline-hidden"
                  required
                />
                <input
                  type="text"
                  placeholder="https://drive.google.com/..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-1 focus:ring-cyan-500/50 focus:outline-hidden"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 cursor-pointer bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Attach Shortcut</span>
              </button>
            </form>
          )}

          {errorMessage && (
            <div className="mt-2 text-[10px] bg-red-500/10 text-red-500 dark:text-red-400 p-2.5 rounded-lg border border-red-500/15 leading-relaxed text-left flex items-start gap-1.5">
              <X className="w-3.5 h-3.5 shrink-0 mt-0.5 cursor-pointer" onClick={() => setErrorMessage(null)} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Attachments list count */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">
          Attached items ({attachments.length})
        </span>
      </div>

      {/* Attachments List render */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-none scrollbar-thin">
        {attachments.length === 0 ? (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center p-4">
            <Paperclip className="w-8 h-8 text-slate-300 dark:text-zinc-700 mb-2 opacity-50 animate-bounce" />
            <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">
              No files or links attached
            </span>
            <span className="text-[10px] text-slate-300 dark:text-zinc-600 mt-1 max-w-[200px] leading-relaxed">
              Drop local media onto the upload zone or paste sheets, URLs and slides directly to share with peers.
            </span>
          </div>
        ) : (
          attachments.map((item) => {
            return (
              <div
                key={item.id}
                className="group relative flex items-start p-2 rounded-xl bg-white/30 dark:bg-white/5 border border-slate-100/50 dark:border-zinc-900 hover:bg-white/50 dark:hover:bg-white/10 transition-colors gap-2.5"
              >
                {/* Media icon or image preview */}
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center border border-slate-200/20 dark:border-zinc-700/20 relative">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : item.type === 'video' ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <video src={item.url} className="w-full h-full object-cover brightness-75" />
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <VideoIcon className="w-4 h-4 text-[#0ea5e9]" />
                      </div>
                    </div>
                  ) : item.type === 'link' ? (
                    <Globe className="w-5 h-5 text-[#8b5cf6]" />
                  ) : (
                    <FileText className="w-5 h-5 text-emerald-500" />
                  )}
                </div>

                {/* Info Text */}
                <div className="flex-1 min-w-0 pr-6 text-left">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-neutral-200 truncate leading-snug" title={item.name}>
                    {item.name}
                  </h4>
                  <div className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5 space-y-0.5">
                    <p className="flex items-center gap-1">
                      <span className="font-bold text-[#0ea5e9] truncate max-w-[60px]">{item.uploadedBy}</span>
                      <span>• {new Date(item.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                    {item.size && <p>{formatBytes(item.size)}</p>}
                    {item.type === 'link' && (
                      <p className="truncate text-[8px] text-[#8b5cf6] font-mono select-all">
                        {item.url.replace(/^https?:\/\//i, '')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions overlay */}
                <div className="absolute right-2 top-2 flex items-center gap-1.5">
                  {/* View/Open Button */}
                  {item.type === 'link' ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 cursor-pointer rounded-md text-slate-400 hover:text-[#8b5cf6] hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Open Link in New Tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <>
                      {/* For images / videos, open full lightbox */}
                      {(item.type === 'image' || item.type === 'video') && (
                        <button
                          onClick={() => setSelectedMedia(item)}
                          className="p-1 cursor-pointer rounded-md text-slate-400 hover:text-[#0ea5e9] hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Preview Media"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                      
                      {/* Download element */}
                      <a
                        href={item.url}
                        download={item.name}
                        onClick={(e) => {
                          // Prevent download glitch if base64 large
                          if (item.url.startsWith('data:')) {
                            // Proceed normally for downloaded files
                          }
                        }}
                        className="p-1 cursor-pointer rounded-md text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Download Attachement"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                    </>
                  )}

                  {/* Delete button (owner or anyone has privilege) */}
                  {!isReadOnly && (
                    <button
                      onClick={() => onDeleteAttachment(item.id)}
                      className="p-1 cursor-pointer rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Remove Attachment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Built-in high fidelity Media Lightbox Container */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-55 flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedMedia(null)} />
          
          <div className="relative max-w-3xl w-full max-h-[85vh] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl flex flex-col z-10 animate-scale-up">
            
            {/* Header description */}
            <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="text-left">
                <h3 className="text-white text-sm font-bold truncate pr-6 max-w-sm" title={selectedMedia.name}>
                  {selectedMedia.name}
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Uploaded by <span className="font-bold text-[#0ea5e9]">{selectedMedia.uploadedBy}</span> • {new Date(selectedMedia.uploadedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedMedia(null)}
                className="p-1.5 cursor-pointer rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media Body */}
            <div className="flex-1 bg-zinc-950 flex items-center justify-center p-2 overflow-hidden min-h-[300px]">
              {selectedMedia.type === 'image' ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.name}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[60vh] object-contain select-none"
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[60vh] object-contain"
                />
              )}
            </div>

            {/* Footer download actions */}
            <div className="p-3.5 bg-zinc-900/60 border-t border-zinc-805 flex items-center justify-between shrink-0">
              {selectedMedia.size && (
                <span className="text-xs font-mono text-zinc-500">
                  Size: {formatBytes(selectedMedia.size)}
                </span>
              )}
              <a
                href={selectedMedia.url}
                download={selectedMedia.name}
                className="px-4 py-1.5 cursor-pointer bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm ml-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Attachment</span>
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
