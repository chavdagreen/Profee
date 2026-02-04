
import React, { useState, useRef } from 'react';
import { Sparkles, Image as ImageIcon, Wand2, RefreshCcw, Download, Upload, AlertCircle } from 'lucide-react';
import { editImageWithAI } from '../services/geminiService';

const AIEditorView: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setResultImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt) return;
    
    setIsProcessing(true);
    setError(null);
    try {
      const edited = await editImageWithAI(image, mimeType, prompt);
      if (edited) {
        setResultImage(edited);
      } else {
        setError("AI couldn't process the request. Try a different prompt.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong during AI processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const prompts = [
    "Make it brighter and clearer",
    "Remove the background shadows",
    "Add a vintage professional look",
    "Convert to high contrast scan style",
    "Remove handwritten marks"
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="clay-card bg-indigo-600 text-white p-8 border-none flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-yellow-300 fill-yellow-300" size={24} />
            <h3 className="text-2xl font-bold">Smart Document Optimizer</h3>
          </div>
          <p className="text-indigo-100 max-w-xl">
            Clean up scanned documents, improve lighting on profile photos, or remove unwanted artifacts from evidence photos using Gemini 2.5 AI.
          </p>
        </div>
        <div className="hidden md:block">
          <ImageIcon size={64} className="text-white/20" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload & Preview */}
        <div className="space-y-6">
          <div className="clay-card p-6 border-none min-h-[400px] flex flex-col">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Upload size={18} className="text-indigo-600" />
              Source Image
            </h4>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all cursor-pointer hover:bg-slate-50 ${
                image ? 'border-transparent bg-slate-50' : 'border-slate-300'
              }`}
            >
              {image ? (
                <img src={image} alt="Preview" className="max-h-64 rounded-2xl shadow-lg object-contain" />
              ) : (
                <>
                  <div className="p-4 bg-indigo-50 rounded-full mb-4">
                    <Upload className="text-indigo-600" size={32} />
                  </div>
                  <p className="font-bold text-slate-600">Click to upload image</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG or JPEG</p>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          <div className="clay-card p-6 border-none space-y-4">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <Wand2 size={18} className="text-indigo-600" />
              AI Prompt
            </h4>
            <textarea 
              className="clay-input w-full p-4 min-h-[100px] text-sm"
              placeholder="E.g. 'Brighten this image and remove the shadows' or 'Make it look like a scanned document'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {prompts.map(p => (
                <button 
                  key={p} 
                  onClick={() => setPrompt(p)}
                  className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full hover:bg-indigo-100"
                >
                  {p}
                </button>
              ))}
            </div>
            <button 
              onClick={handleEdit}
              disabled={!image || !prompt || isProcessing}
              className={`clay-button w-full py-4 flex items-center justify-center gap-2 font-bold ${
                isProcessing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCcw className="animate-spin" size={20} />
                  Thinking...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Magic
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result Area */}
        <div className="clay-card p-6 border-none min-h-[600px] flex flex-col bg-slate-50/50">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-yellow-500" />
            AI Output
          </h4>

          <div className="flex-1 rounded-3xl bg-white border border-slate-200 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {isProcessing && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="relative">
                   <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                   <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={24} />
                </div>
                <p className="mt-4 font-bold text-slate-600">Refining document...</p>
                <p className="text-xs text-slate-400">Gemini is working its magic</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center text-red-500 text-center px-4">
                <AlertCircle size={48} className="mb-4" />
                <p className="font-bold">{error}</p>
              </div>
            )}

            {resultImage ? (
              <div className="flex flex-col items-center">
                <img src={resultImage} alt="AI Result" className="max-h-96 rounded-2xl shadow-2xl border-4 border-white" />
                <a 
                  href={resultImage} 
                  download="taxpro-edited-doc.png"
                  className="mt-8 clay-button px-8 py-3 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Download size={20} />
                  Download Optimized Image
                </a>
              </div>
            ) : !isProcessing && !error && (
              <div className="text-center text-slate-400">
                <Sparkles size={48} className="mx-auto mb-4 opacity-10" />
                <p>Click "Generate Magic" to see results</p>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex gap-3">
             <div className="p-2 bg-white rounded-xl text-indigo-600 h-fit">
               <AlertCircle size={20} />
             </div>
             <p className="text-xs text-indigo-700 leading-relaxed">
               <strong>Tip:</strong> Be specific. Instead of "Fix it", try "Brighten the top half and remove the watermark on the bottom right". The AI works best with descriptive visual instructions.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIEditorView;
