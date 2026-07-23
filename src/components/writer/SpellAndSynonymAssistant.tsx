import React, { useState, useEffect } from 'react';
import { checkVietnameseTypos, getSynonymsForWord, TypoItem, VIETNAMESE_SYNONYMS } from '../../lib/vietnameseSpellCheck';
import { SpellCheck, BookOpen, CheckCircle2, Sparkles, Wand2, RefreshCw, X, ArrowRight, Copy, Check } from 'lucide-react';

interface SpellAndSynonymAssistantProps {
  content: string;
  onReplaceText: (oldText: string, newText: string) => void;
  onReplaceAllTypos: (typos: TypoItem[]) => void;
  onClose: () => void;
}

export const SpellAndSynonymAssistant: React.FC<SpellAndSynonymAssistantProps> = ({
  content,
  onReplaceText,
  onReplaceAllTypos,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'typos' | 'synonyms'>('typos');
  const [detectedTypos, setDetectedTypos] = useState<TypoItem[]>([]);
  
  // Synonym search states
  const [searchTerm, setSearchTerm] = useState('');
  const [synonymResults, setSynonymResults] = useState<string[]>([]);
  const [aiSynonyms, setAiSynonyms] = useState<{ term: string; nuance: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copiedTerm, setCopiedTerm] = useState<string | null>(null);

  useEffect(() => {
    // Scan for typos whenever content changes
    const typos = checkVietnameseTypos(content);
    setDetectedTypos(typos);
  }, [content]);

  const handleSearchSynonyms = (term: string) => {
    setSearchTerm(term);
    const results = getSynonymsForWord(term);
    setSynonymResults(results);
    setAiSynonyms([]);
  };

  const fetchAiSynonyms = async () => {
    if (!searchTerm.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/synonyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: searchTerm.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data?.synonyms) {
        setAiSynonyms(json.data.synonyms);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopy = (term: string) => {
    navigator.clipboard.writeText(term);
    setCopiedTerm(term);
    setTimeout(() => setCopiedTerm(null), 1500);
  };

  return (
    <div className="bg-[#0B0B0E] border border-emerald-500/30 rounded-xl p-4 shadow-2xl text-slate-200 space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <SpellCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Trợ Lý Chính Tả & Từ Đồng Nghĩa</h3>
            <p className="text-[11px] text-slate-400">Tự động bắt lỗi gõ, teen-code & gợi ý từ văn học phong phú</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-[#131318] p-1 rounded-lg border border-slate-800/80 text-xs font-medium">
        <button
          onClick={() => setActiveTab('typos')}
          className={`flex-1 py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'typos'
              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <SpellCheck className="w-3.5 h-3.5" />
          <span>Bắt Lỗi Chính Tả</span>
          {detectedTypos.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-rose-500/80 text-white rounded-full font-bold">
              {detectedTypos.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('synonyms')}
          className={`flex-1 py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'synonyms'
              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Gợi Ý Từ Đồng Nghĩa</span>
        </button>
      </div>

      {/* Tab 1: Typos */}
      {activeTab === 'typos' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {detectedTypos.length > 0
                ? `Phát hiện ${detectedTypos.length} điểm cần sửa đổi:`
                : '✅ Văn bản sạch sẽ, không phát hiện lỗi chính tả hoặc teen-code!'}
            </span>

            {detectedTypos.length > 0 && (
              <button
                onClick={() => onReplaceAllTypos(detectedTypos)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-md shadow-xs flex items-center gap-1 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Sửa Tất Cả ({detectedTypos.length})
              </button>
            )}
          </div>

          {detectedTypos.length > 0 && (
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {detectedTypos.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-[#141419] border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs hover:border-slate-700/80 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono font-bold line-through border border-rose-500/20 truncate">
                      {item.word}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20 truncate">
                      {item.suggestion}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
                      ({item.reason})
                    </span>
                  </div>

                  <button
                    onClick={() => onReplaceText(item.word, item.suggestion)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium shrink-0 transition-colors border border-slate-700/60"
                  >
                    Sửa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Synonyms */}
      {activeTab === 'synonyms' && (
        <div className="space-y-3">
          {/* Search box & presets */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchSynonyms(e.target.value)}
              placeholder="Nhập từ cần tìm từ đồng nghĩa (VD: đẹp, buồn, nói, nhìn, chạy...)"
              className="flex-1 bg-[#141419] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
            />
            {searchTerm && (
              <button
                onClick={fetchAiSynonyms}
                disabled={isAiLoading}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 disabled:opacity-50 transition-all shadow-xs"
                title="Sử dụng Gemini AI tìm từ đồng nghĩa văn học nâng cao"
              >
                {isAiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>AI Tra Nâng Cao</span>
              </button>
            )}
          </div>

          {/* Quick presets */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Gợi ý từ phổ biến:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['nói', 'nghĩ', 'nhìn', 'đi', 'chạy', 'đẹp', 'buồn', 'vui', 'tức giận', 'sợ', 'yêu', 'khóc', 'mạnh', 'nhanh'].map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => handleSearchSynonyms(preset)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      searchTerm.toLowerCase() === preset
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                        : 'bg-[#141419] text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {preset}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Offline Synonym Results */}
          {synonymResults.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-emerald-400 block">
                Từ đồng nghĩa cho "{searchTerm}":
              </span>
              <div className="flex flex-wrap gap-1.5">
                {synonymResults.map((syn, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCopy(syn)}
                    className="px-2.5 py-1 bg-[#141419] hover:bg-slate-800 text-slate-200 rounded border border-slate-800 hover:border-slate-700 text-xs flex items-center gap-1.5 transition-all group"
                    title="Nhấn để sao chép từ này"
                  >
                    <span>{syn}</span>
                    {copiedTerm === syn ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Gemini Synonym Results */}
          {aiSynonyms.length > 0 && (
            <div className="p-3 bg-[#131318] border border-emerald-500/20 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <Wand2 className="w-3.5 h-3.5" />
                <span>Gợi Ý Văn Học Nâng Cao Từ Gemini AI:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {aiSynonyms.map((aiSyn, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleCopy(aiSyn.term)}
                    className="p-2 bg-[#0B0B0E] border border-slate-800 hover:border-emerald-500/40 rounded cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">{aiSyn.term}</span>
                      <span className="text-[10px] text-slate-400">{aiSyn.nuance}</span>
                    </div>
                    {copiedTerm === aiSyn.term ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!searchTerm && (
            <p className="text-xs text-slate-500 text-center py-2 italic">
              Chọn từ mẫu ở trên hoặc gõ từ bất kỳ để tra cứu từ đồng nghĩa phong phú giúp nâng tầm văn phong.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
