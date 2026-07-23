import React, { useState } from 'react';
import { Story, StoryLength } from '../../types';
import { notifyApiCallStart, handleApiResponseUsage } from '../../lib/apiUsage';
import { Sparkles, FileText, Compass, BookOpen, Layers, X, Loader2, Film, Clapperboard, AlignLeft } from 'lucide-react';

interface StoryConceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: (newStory: Story) => void;
}

const GENRE_OPTIONS = [
  'Phiêu lưu',
  'Fantasy',
  'Kinh dị',
  'Trinh thám',
  'Sci-Fi',
  'Văn học',
  'Điện ảnh',
  'Hài',
  'Kiếm hiệp',
  'Tiên hiệp',
  'Ngôn tình',
];

export const StoryConceptModal: React.FC<StoryConceptModalProps> = ({ isOpen, onClose, onStoryCreated }) => {
  const [activeTab, setActiveTab] = useState<'idea' | 'outline' | 'script' | 'paragraph'>('idea');
  const [ideaText, setIdeaText] = useState('');
  const [outlineText, setOutlineText] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [paragraphText, setParagraphText] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [targetTone, setTargetTone] = useState('');
  const [lengthOption, setLengthOption] = useState<StoryLength>('Dài');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleGenerateFromIdea = async () => {
    if (!ideaText.trim()) {
      setError('Vui lòng nhập ý tưởng cốt truyện.');
      return;
    }
    setLoading(true);
    setError(null);
    notifyApiCallStart();

    try {
      const response = await fetch('/api/ai/generate-story-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: ideaText,
          genres: selectedGenres,
          targetTone,
        }),
      });

      const resData = await response.json();
      handleApiResponseUsage(resData);

      if (!resData.success) {
        throw new Error(resData.error || 'Khởi tạo cốt truyện thất bại.');
      }

      const generatedData = resData.data;
      const now = new Date().toISOString();

      const newStory: Story = {
        id: `story-${Date.now()}`,
        title: generatedData.title || 'Bộ Truyện Mới',
        author: authorName || 'Văn Nhân AI',
        pitch: generatedData.pitch || ideaText,
        genres: generatedData.genres || selectedGenres,
        targetTone,
        lengthOption,
        worldRules: generatedData.worldRules || {
          setting: 'Thế giới huyền bí chứa đựng nhiều bí mật chưa lời giải.',
          magicOrTech: 'Không xác định',
          historyAndFactions: 'Chưa có',
        },
        characters: (generatedData.characters || []).map((c: any, idx: number) => ({
          id: `char-${idx + 1}`,
          name: c.name || `Nhân vật ${idx + 1}`,
          role: c.role || 'Chính',
          age: c.age || '?',
          appearance: c.appearance || '',
          personality: c.personality || '',
          goals: c.goals || '',
          strengths: c.strengths || '',
          weaknesses: c.weaknesses || '',
          items: c.items || [],
          skills: c.skills || [],
        })),
        relationships: (generatedData.relationships || []).map((r: any, idx: number) => ({
          id: `rel-${idx + 1}`,
          from: r.from || '',
          to: r.to || '',
          relation: r.relation || 'Đồng hành',
        })),
        outlineNodes: (generatedData.outlineNodes || []).map((o: any, idx: number) => ({
          id: `node-${idx + 1}`,
          title: o.title || `Mốc ${idx + 1}`,
          description: o.description || '',
          expandedScenes: o.expandedScenes || [],
          completed: false,
        })),
        timeline: (generatedData.initialTimeline || []).map((t: any, idx: number) => ({
          id: `tl-${idx + 1}`,
          day: t.day || `Ngày ${idx + 1}`,
          event: t.event || '',
        })),
        chapters: [],
        status: 'ongoing',
        createdAt: now,
        updatedAt: now,
      };

      onStoryCreated(newStory);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Có lỗi xảy ra khi gọi AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromScript = async () => {
    if (!scriptText.trim()) {
      setError('Vui lòng nhập kịch bản của bạn.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-story-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptText,
          isScriptMode: true,
          genres: selectedGenres,
          targetTone,
        }),
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Khởi tạo cốt truyện từ kịch bản thất bại.');
      }

      const generatedData = resData.data;
      const now = new Date().toISOString();

      const newStory: Story = {
        id: `story-${Date.now()}`,
        title: generatedData.title || 'Bộ Truyện Chuyển Thể Từ Kịch Bản',
        author: authorName || 'Văn Nhân AI',
        pitch: generatedData.pitch || 'Bộ truyện được xây dựng và chuyển thể từ kịch bản gốc.',
        genres: generatedData.genres || selectedGenres,
        targetTone,
        lengthOption,
        worldRules: generatedData.worldRules || {
          setting: 'Bối cảnh được xây dựng theo kịch bản.',
          magicOrTech: 'Hệ thống sức mạnh/công nghệ theo kịch bản',
          historyAndFactions: 'Lịch sử và các phe phái trong kịch bản',
        },
        characters: (generatedData.characters || []).map((c: any, idx: number) => ({
          id: `char-${idx + 1}`,
          name: c.name || `Nhân vật ${idx + 1}`,
          role: c.role || 'Chính',
          age: c.age || '?',
          appearance: c.appearance || '',
          personality: c.personality || '',
          goals: c.goals || '',
          strengths: c.strengths || '',
          weaknesses: c.weaknesses || '',
          items: c.items || [],
          skills: c.skills || [],
        })),
        relationships: (generatedData.relationships || []).map((r: any, idx: number) => ({
          id: `rel-${idx + 1}`,
          from: r.from || '',
          to: r.to || '',
          relation: r.relation || 'Mối quan hệ',
        })),
        outlineNodes: (generatedData.outlineNodes || []).map((o: any, idx: number) => ({
          id: `node-${idx + 1}`,
          title: o.title || `Cảnh ${idx + 1}`,
          description: o.description || '',
          expandedScenes: o.expandedScenes || [],
          completed: false,
        })),
        timeline: (generatedData.initialTimeline || []).map((t: any, idx: number) => ({
          id: `tl-${idx + 1}`,
          day: t.day || `Mốc ${idx + 1}`,
          event: t.event || '',
        })),
        chapters: [],
        status: 'ongoing',
        createdAt: now,
        updatedAt: now,
      };

      onStoryCreated(newStory);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Có lỗi xảy ra khi phân tích kịch bản.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromParagraph = async () => {
    if (!paragraphText.trim()) {
      setError('Vui lòng nhập đoạn văn hoặc đoạn trích của bạn.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-story-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paragraph: paragraphText,
          isParagraphMode: true,
          genres: selectedGenres,
          targetTone,
        }),
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Khởi tạo cốt truyện từ đoạn văn thất bại.');
      }

      const generatedData = resData.data;
      const now = new Date().toISOString();

      const newStory: Story = {
        id: `story-${Date.now()}`,
        title: generatedData.title || 'Bộ Truyện Mở Rộng Từ Đoạn Văn',
        author: authorName || 'Văn Nhân AI',
        pitch: generatedData.pitch || 'Bộ truyện được xây dựng và phóng tác từ đoạn văn gốc.',
        genres: generatedData.genres || selectedGenres,
        targetTone,
        lengthOption,
        worldRules: generatedData.worldRules || {
          setting: 'Bối cảnh được phóng tác từ đoạn văn gốc.',
          magicOrTech: 'Hệ thống sức mạnh/phép thuật mở rộng',
          historyAndFactions: 'Lịch sử và phe phái mở rộng',
        },
        characters: (generatedData.characters || []).map((c: any, idx: number) => ({
          id: `char-${idx + 1}`,
          name: c.name || `Nhân vật ${idx + 1}`,
          role: c.role || 'Chính',
          age: c.age || '?',
          appearance: c.appearance || '',
          personality: c.personality || '',
          goals: c.goals || '',
          strengths: c.strengths || '',
          weaknesses: c.weaknesses || '',
          items: c.items || [],
          skills: c.skills || [],
        })),
        relationships: (generatedData.relationships || []).map((r: any, idx: number) => ({
          id: `rel-${idx + 1}`,
          from: r.from || '',
          to: r.to || '',
          relation: r.relation || 'Mối quan hệ',
        })),
        outlineNodes: (generatedData.outlineNodes || []).map((o: any, idx: number) => ({
          id: `node-${idx + 1}`,
          title: o.title || `Mốc ${idx + 1}`,
          description: o.description || '',
          expandedScenes: o.expandedScenes || [],
          completed: false,
        })),
        timeline: (generatedData.initialTimeline || []).map((t: any, idx: number) => ({
          id: `tl-${idx + 1}`,
          day: t.day || `Mốc ${idx + 1}`,
          event: t.event || '',
        })),
        chapters: [],
        status: 'ongoing',
        createdAt: now,
        updatedAt: now,
      };

      onStoryCreated(newStory);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Có lỗi xảy ra khi phân tích đoạn văn.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromOutline = async () => {
    if (!outlineText.trim()) {
      setError('Vui lòng nhập dàn ý.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const steps = outlineText
        .split('\n')
        .map((s) => s.replace(/^[↓\-*•\d.\s]+/, '').trim())
        .filter((s) => s.length > 0 && s !== '↓');

      const response = await fetch('/api/ai/generate-story-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: `Dàn ý cốt truyện gồm các mốc: ${steps.join(' -> ')}`,
          genres: selectedGenres,
          targetTone,
        }),
      });

      const resData = await response.json();
      const generatedData = resData.data || {};
      const now = new Date().toISOString();

      const outlineNodes = steps.map((step, idx) => ({
        id: `node-${idx + 1}`,
        title: `Mốc ${idx + 1}: ${step}`,
        description: `Triển khai tình tiết sâu sắc cho sự kiện "${step}"`,
        expandedScenes: [
          `Nguồn gốc & phát hiện sự kiện "${step}"`,
          `Xung đột kịch tính, cảm xúc và hành động khi gặp "${step}"`,
          `Giải quyết hậu quả và để lại manh mối mở ra mốc tiếp theo.`,
        ],
        completed: false,
      }));

      const newStory: Story = {
        id: `story-${Date.now()}`,
        title: generatedData.title || steps[0] || 'Bộ Truyện Từ Dàn Ý',
        author: authorName || 'Văn Nhân AI',
        pitch: generatedData.pitch || `Cốt truyện diễn tiến qua các mốc: ${steps.slice(0, 4).join(', ')}...`,
        genres: selectedGenres,
        targetTone,
        lengthOption,
        worldRules: generatedData.worldRules || {
          setting: 'Thế giới chi tiết theo dàn ý.',
          magicOrTech: 'Hệ thống sức mạnh phù hợp',
          historyAndFactions: 'Lịch sử và bối cảnh các phe phái',
        },
        characters: generatedData.characters || [
          {
            id: 'char-1',
            name: 'Lâm Bách',
            role: 'Nam chính',
            age: '28',
            appearance: 'Kiên định, gan dạ',
            personality: 'Quả cảm',
            goals: 'Chinh phục cuộc thám hiểm',
            strengths: 'Kỹ năng sinh tồn',
            weaknesses: 'Thương người',
            items: ['Bản đồ cổ', 'Dao thám hiểm'],
            skills: ['Sinh tồn'],
          },
        ],
        relationships: generatedData.relationships || [],
        outlineNodes: outlineNodes.length > 0 ? outlineNodes : generatedData.outlineNodes || [],
        timeline: steps.map((st, i) => ({ id: `tl-${i + 1}`, day: `Ngày ${i + 1}`, event: st })),
        chapters: [],
        status: 'ongoing',
        createdAt: now,
        updatedAt: now,
      };

      onStoryCreated(newStory);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Có lỗi xảy ra khi tạo từ dàn ý.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0F0F12] border border-slate-800 rounded-xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Tạo Tác Phẩm Truyện Mới Với AI</h2>
            <p className="text-xs text-slate-400">Chọn chế độ khởi tạo: Ý tưởng, Dàn ý, Đoạn văn trích dẫn, hoặc Kịch bản phim</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-[#0A0A0B] p-1 rounded-lg border border-slate-800 mb-5 gap-1">
          <button
            onClick={() => setActiveTab('idea')}
            className={`py-2 px-2 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'idea' ? 'bg-slate-800 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" /> 1. Ý Tưởng
          </button>
          <button
            onClick={() => setActiveTab('outline')}
            className={`py-2 px-2 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'outline' ? 'bg-slate-800 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" /> 2. Dàn Ý
          </button>
          <button
            onClick={() => setActiveTab('paragraph')}
            className={`py-2 px-2 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'paragraph' ? 'bg-slate-800 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5 text-emerald-400" /> 3. Đoạn Văn
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`py-2 px-2 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'script' ? 'bg-slate-800 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5 text-emerald-400" /> 4. Kịch Bản
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-md text-xs flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {/* Tab 1: Idea Mode */}
        {activeTab === 'idea' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Ý tưởng / Cốt truyện ban đầu của bạn
              </label>
              <textarea
                rows={3}
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                placeholder="Ví dụ: Đoàn thám hiểm đi xuyên rừng nguyên sinh Phong Sơn tìm kiếm di tích thành phố cổ đã mất..."
                className="w-full bg-[#0A0A0B] border border-slate-800 rounded-md p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all text-xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                💡 Chỉ cần 1-2 câu ngắn, AI sẽ tự động phân tích sáng tạo thêm Nhân vật, Bối cảnh, Bí ẩn & Mốc sự kiện.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Outline Flow Mode */}
        {activeTab === 'outline' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Dàn ý diễn tiến các mốc truyện (Mỗi dòng là một mốc)
              </label>
              <textarea
                rows={5}
                value={outlineText}
                onChange={(e) => setOutlineText(e.target.value)}
                placeholder="Nhập các mốc cách nhau bằng dấu xuống dòng hoặc mũi tên ↓..."
                className="w-full bg-[#0A0A0B] border border-slate-800 rounded-md p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                💡 AI sẽ biến từng mốc trên thành các phân cảnh kịch tính đầy đủ cảm xúc, hành động và hội thoại.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Paragraph Excerpt Mode */}
        {activeTab === 'paragraph' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Dán Đoạn Văn / Đoạn Trích Văn Học / Câu Chuyện Ngắn</span>
                <span className="text-[10px] text-emerald-400 font-mono">Dạng Văn Xuôi (Paragraph)</span>
              </label>
              <textarea
                rows={6}
                value={paragraphText}
                onChange={(e) => setParagraphText(e.target.value)}
                placeholder="Dán một đoạn văn miêu tả cảnh, trích đoạn truyện ngắn, hoặc mẫu truyện văn xuôi..."
                className="w-full bg-[#0A0A0B] border border-slate-800 rounded-md p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all text-xs leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                📖 AI sẽ đọc sâu đoạn văn của bạn, bóc tách <strong>Nhân vật & Ngoại hình</strong>, <strong>Đồ vật/Manh mối</strong>, <strong>Bối cảnh & Quy tắc thế giới</strong> để tự động phóng tác thành bộ tiểu thuyết dài hoàn chỉnh.
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Script Conversion Mode */}
        {activeTab === 'script' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Dán Kịch Bản Phim / Kịch Bản Điện Ảnh / Kịch Bản Truyện</span>
                <span className="text-[10px] text-emerald-400 font-mono">Dạng Script / Dialogue</span>
              </label>
              <textarea
                rows={6}
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="CẢNH 1: HANG ĐÁ - ĐÊM&#10;Lâm Bách bước vào...&#10;LÂM BÁCH: Cẩn thận!..."
                className="w-full bg-[#0A0A0B] border border-slate-800 rounded-md p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all text-xs font-mono leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                🎬 AI sẽ tự động phân tích bóc tách <strong>Nhân vật</strong>, <strong>Bối cảnh & Quy tắc thế giới</strong>, <strong>Phân cảnh thành Mốc dàn ý</strong> và <strong>Tình tiết câu chuyện</strong> từ kịch bản của bạn.
              </p>
            </div>
          </div>
        )}

        {/* Common Settings: Genres, Tone, Length */}
        <div className="mt-5 pt-4 border-t border-slate-800 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Kết hợp thể loại (Có thể chọn nhiều):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GENRE_OPTIONS.map((genre) => {
                const active = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                      active
                        ? 'bg-emerald-500/10 border-emerald-500/80 text-emerald-300 shadow-xs'
                        : 'bg-[#0A0A0B] border-slate-800 text-slate-400 hover:border-slate-700/80'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tông giọng chủ đạo</label>
              <input
                type="text"
                value={targetTone}
                onChange={(e) => setTargetTone(e.target.value)}
                placeholder="Kịch tính, u uất, hào hùng, hài hước..."
                className="w-full bg-[#0A0A0B] border border-slate-800 rounded-md p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Độ dài dự kiến mỗi chương</label>
              <select
                value={lengthOption}
                onChange={(e) => setLengthOption(e.target.value as StoryLength)}
                className="w-full bg-[#0A0A0B] border border-slate-800 rounded-md p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="Ngắn">Ngắn (~1,000 - 1,500 từ)</option>
                <option value="Trung bình">Trung bình (~2,000 - 3,000 từ)</option>
                <option value="Dài">Dài (~3,500 - 5,000 từ)</option>
                <option value="Siêu dài">Siêu dài (~5,000 - 8,000 từ)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Bút danh tác giả</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Tên hoặc bút danh của bạn (để trống nếu muốn sử dụng tên mặc định)..."
              className="w-full bg-[#0A0A0B] border border-slate-800 rounded-md p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-600"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            disabled={loading}
            onClick={
              activeTab === 'idea'
                ? handleGenerateFromIdea
                : activeTab === 'outline'
                ? handleGenerateFromOutline
                : activeTab === 'script'
                ? handleGenerateFromScript
                : handleGenerateFromParagraph
            }
            className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> AI Đang Sáng Tạo Truyện...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Bắt Đầu Xây Dựng Cốt Truyện
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
