import React, { useState, useEffect } from 'react';
import { Story, StyleProfile } from '../../types';
import { extractTextFromEpub } from '../../lib/epubParser';
import {
  PRESET_STYLE_PROFILES,
  getGlobalSavedStyles,
  saveGlobalStyle,
  deleteGlobalStyle,
} from '../../lib/presetStyles';
import {
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  BookOpen,
  BookmarkPlus,
  Trash2,
  Bookmark,
  Check,
  Zap,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Pencil,
  X,
} from 'lucide-react';

interface StyleAnalyzerProps {
  story: Story;
  onUpdateStory: (updatedStory: Story) => void;
}

const CATEGORIES = [
  'Tất cả',
  'Kiếm Hiệp & Tu Tiên',
  'Ngôn Tình & Lãng Mạn',
  'Trinh Thám & Kinh Dị',
  'Đô Thị & Sảng Văn',
  'Viễn Tưởng & Mạt Thế',
  'Hài Hước & Đời Thường',
  'Văn Học & Lịch Sử',
];

export const StyleAnalyzer: React.FC<StyleAnalyzerProps> = ({ story, onUpdateStory }) => {
  const [sampleText, setSampleText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Saved library state
  const [globalSaved, setGlobalSaved] = useState<StyleProfile[]>([]);
  const [customName, setCustomName] = useState('');
  const [showSaveBox, setShowSaveBox] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Rename state
  const [editingStyleId, setEditingStyleId] = useState<string | null>(null);
  const [editingStyleName, setEditingStyleName] = useState<string>('');

  const handleStartRename = (styleId: string, currentName: string) => {
    setEditingStyleId(styleId);
    setEditingStyleName(currentName || '');
  };

  const handleSaveRename = (styleId: string) => {
    const trimmed = editingStyleName.trim();
    if (!trimmed) {
      setEditingStyleId(null);
      return;
    }

    // Find style in all custom saved styles, presets, or active styleProfile
    let targetProfile: StyleProfile | undefined;
    const globalStyles = getGlobalSavedStyles();
    targetProfile = globalStyles.find((s) => s.id === styleId);

    if (!targetProfile && story.savedStyleProfiles) {
      targetProfile = story.savedStyleProfiles.find((s) => s.id === styleId);
    }

    if (!targetProfile && story.styleProfile?.id === styleId) {
      targetProfile = story.styleProfile;
    }

    if (!targetProfile) {
      targetProfile = PRESET_STYLE_PROFILES.find((s) => s.id === styleId);
    }

    if (!targetProfile) {
      setEditingStyleId(null);
      return;
    }

    const updatedProfile: StyleProfile = {
      ...targetProfile,
      id: targetProfile.id || `style-${Date.now()}`,
      name: trimmed,
      isPreset: false,
    };

    // Save to global localStorage
    const updatedGlobal = saveGlobalStyle(updatedProfile);
    setGlobalSaved(updatedGlobal);

    // Save to story savedStyleProfiles
    const currentSavedInStory = story.savedStyleProfiles || [];
    const existsInStory = currentSavedInStory.some((s) => s.id === updatedProfile.id);
    const updatedStorySaved = existsInStory
      ? currentSavedInStory.map((s) => (s.id === updatedProfile.id ? updatedProfile : s))
      : [updatedProfile, ...currentSavedInStory];

    // If active styleProfile was being renamed
    const updatedActiveProfile =
      story.styleProfile?.id === styleId || story.styleProfile?.id === updatedProfile.id
        ? updatedProfile
        : story.styleProfile;

    onUpdateStory({
      ...story,
      styleProfile: updatedActiveProfile,
      savedStyleProfiles: updatedStorySaved,
      updatedAt: new Date().toISOString(),
    });

    setEditingStyleId(null);
    setSaveSuccessMsg(`Đã đổi tên văn phong thành "${trimmed}"!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Active view tab
  const [activeTab, setActiveTab] = useState<'analyzer' | 'library'>('analyzer');
  const [expandedStyleId, setExpandedStyleId] = useState<string | null>(null);
  const [readingFile, setReadingFile] = useState(false);

  // Filter & Search state
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // Sync global saved styles from localStorage
    const styles = getGlobalSavedStyles();
    setGlobalSaved(styles);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setReadingFile(true);

    try {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.epub')) {
        const text = await extractTextFromEpub(file);
        if (!text || text.trim().length === 0) {
          throw new Error('File EPUB không chứa nội dung văn bản đọc được.');
        }
        setSampleText(text);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            setSampleText(content);
          }
          setReadingFile(false);
        };
        reader.onerror = () => {
          setError('Lỗi khi đọc file văn bản.');
          setReadingFile(false);
        };
        reader.readAsText(file);
        return;
      }
    } catch (err: any) {
      console.error('Error loading file:', err);
      setError(err?.message || 'Không thể đọc file mẫu. Vui lòng kiểm tra định dạng file.');
    } finally {
      setReadingFile(false);
    }

    if (e.target) {
      e.target.value = '';
    }
  };

  const handleAnalyzeStyle = async () => {
    if (!sampleText.trim() || sampleText.trim().length < 50) {
      setError('Vui lòng dán hoặc tải lên đoạn văn mẫu dài hơn 50 từ.');
      return;
    }

    setLoading(true);
    setError(null);
    setShowSaveBox(false);

    try {
      const response = await fetch('/api/ai/analyze-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleText }),
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Phân tích thất bại.');
      }

      const analyzed: StyleProfile = {
        ...resData.data,
        id: `style-${Date.now()}`,
        name: 'Văn phong phân tích từ mẫu',
        createdAt: new Date().toISOString(),
      };

      // Set as current active styleProfile
      onUpdateStory({
        ...story,
        styleProfile: analyzed,
        updatedAt: new Date().toISOString(),
      });

      setShowSaveBox(true);
      setCustomName('Giọng văn mẫu ' + new Date().toLocaleDateString('vi-VN'));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Có lỗi xảy ra khi phân tích văn phong.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentProfileToLibrary = () => {
    if (!story.styleProfile) return;
    const nameToSave = customName.trim() || 'Văn phong ' + new Date().toLocaleDateString('vi-VN');

    const profileToSave: StyleProfile = {
      ...story.styleProfile,
      id: story.styleProfile.id || `style-${Date.now()}`,
      name: nameToSave,
      createdAt: new Date().toISOString(),
    };

    // Save globally in localStorage
    const updatedGlobal = saveGlobalStyle(profileToSave);
    setGlobalSaved(updatedGlobal);

    // Save in story's saved list
    const currentSavedInStory = story.savedStyleProfiles || [];
    const existsInStory = currentSavedInStory.some((s) => s.id === profileToSave.id || s.name === nameToSave);
    const updatedStorySaved = existsInStory
      ? currentSavedInStory.map((s) => (s.id === profileToSave.id || s.name === nameToSave ? profileToSave : s))
      : [profileToSave, ...currentSavedInStory];

    onUpdateStory({
      ...story,
      styleProfile: profileToSave,
      savedStyleProfiles: updatedStorySaved,
      updatedAt: new Date().toISOString(),
    });

    setSaveSuccessMsg(`Đã lưu "${nameToSave}" vào Thư viện Văn phong!`);
    setShowSaveBox(false);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleApplyStyleFromLibrary = (profile: StyleProfile) => {
    onUpdateStory({
      ...story,
      styleProfile: profile,
      updatedAt: new Date().toISOString(),
    });

    setSaveSuccessMsg(`Đã chọn và áp dụng "${profile.name || 'Hồ sơ văn phong'}" cho bộ truyện này!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleDeleteSavedStyle = (styleId: string, name?: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa văn phong "${name || 'này'}" khỏi thư viện?`)) {
      const updatedGlobal = deleteGlobalStyle(styleId);
      setGlobalSaved(updatedGlobal);

      if (story.savedStyleProfiles) {
        const updatedStorySaved = story.savedStyleProfiles.filter((s) => s.id !== styleId);
        onUpdateStory({
          ...story,
          savedStyleProfiles: updatedStorySaved,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  };

  // Combine story saved styles & global saved styles (deduplicated)
  const allCustomSavedStyles: StyleProfile[] = [];
  const seenIds = new Set<string>();

  (story.savedStyleProfiles || []).forEach((s) => {
    if (s.id && !seenIds.has(s.id)) {
      seenIds.add(s.id);
      allCustomSavedStyles.push(s);
    }
  });

  globalSaved.forEach((s) => {
    if (s.id && !seenIds.has(s.id)) {
      seenIds.add(s.id);
      allCustomSavedStyles.push(s);
    }
  });

  // Filter preset styles
  const filteredPresets = PRESET_STYLE_PROFILES.filter((preset) => {
    const matchesCategory =
      selectedCategory === 'Tất cả' || preset.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (preset.name && preset.name.toLowerCase().includes(query)) ||
      (preset.description && preset.description.toLowerCase().includes(query)) ||
      (preset.vocabularyStyle && preset.vocabularyStyle.toLowerCase().includes(query)) ||
      (preset.summaryGuideline && preset.summaryGuideline.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> HỌC & MÔ PHỎNG VĂN PHONG TÁC GIẢ
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Quản Lý & Học Văn Phong Văn Học</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Phân tích văn phong từ tác phẩm mẫu hoặc chọn nhanh các giọng văn tác giả kinh điển đã lưu trong thư viện.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#131318] p-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 text-xs font-medium transition-colors">
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`px-3.5 py-2 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'analyzer'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phân Tích Mẫu Mới</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-3.5 py-2 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'library'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Thư Viện Văn Phong ({allCustomSavedStyles.length + PRESET_STYLE_PROFILES.length})</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-200 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'analyzer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Input Panel */}
          <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Đoạn Văn / Chương Mẫu
              </h3>

              <label className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700/60">
                {readingFile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                    <span>Đang giải nén file...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Tải File (.epub, .txt, .md)</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".epub,.txt,.md,.text"
                  onChange={handleFileUpload}
                  disabled={readingFile}
                  className="hidden"
                />
              </label>
            </div>

            {error && <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs rounded-md">{error}</div>}

            <textarea
              rows={12}
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              placeholder="Dán toàn bộ một chương truyện mẫu hoặc đoạn văn ấn tượng của tác giả bạn muốn học tập vào đây..."
              className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-md p-3 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed font-serif"
            />

            <button
              disabled={loading || !sampleText.trim()}
              onClick={handleAnalyzeStyle}
              className="w-full py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> AI Đang Phân Tích Văn Phong...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Bắt Đầu Phân Tích & Học Văn Phong
                </>
              )}
            </button>
          </div>

          {/* Style Profile Result Panel */}
          <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Hồ Sơ Văn Phong Đang Áp Dụng
              </h3>

              {story.styleProfile && (
                <div className="flex items-center gap-1.5">
                  {editingStyleId === story.styleProfile.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingStyleName}
                        onChange={(e) => setEditingStyleName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(story.styleProfile!.id!);
                          if (e.key === 'Escape') setEditingStyleId(null);
                        }}
                        className="bg-slate-50 dark:bg-[#0A0A0B] border border-emerald-500 rounded px-2 py-0.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveRename(story.styleProfile!.id!)}
                        className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded shrink-0"
                        title="Lưu tên mới"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingStyleId(null)}
                        className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded shrink-0"
                        title="Hủy"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-semibold">
                        {story.styleProfile.name || 'Đã kích hoạt'}
                      </span>
                      <button
                        onClick={() => handleStartRename(story.styleProfile!.id || `style-${Date.now()}`, story.styleProfile!.name || '')}
                        className="p-1 text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Đổi tên văn phong này"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {story.styleProfile ? (
              <div className="space-y-3 text-xs">
                {/* Save Box if freshly analyzed */}
                {showSaveBox && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/40 rounded-lg space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                      <BookmarkPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Lưu Giọng Văn Này Vào Thư Viện Để Dùng Sau:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Đặt tên cho mẫu văn phong (VD: Phong cách Kim Dung)..."
                        className="flex-1 bg-white dark:bg-[#0A0A0B] border border-emerald-500/40 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-400"
                      />
                      <button
                        onClick={handleSaveCurrentProfileToLibrary}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium shrink-0 shadow-xs"
                      >
                        Lưu Lại
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-slate-50 dark:bg-[#0A0A0B] rounded-md border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium block mb-0.5">👁️ Góc nhìn & Ngôi kể:</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium">{story.styleProfile.perspective}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#0A0A0B] rounded-md border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium block mb-0.5">⚡ Nhịp điệu văn (Pacing):</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium">{story.styleProfile.pacing}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#0A0A0B] rounded-md border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium block mb-0.5">✍️ Cấu trúc câu & Lối diễn đạt:</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium">{story.styleProfile.sentenceStructure}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#0A0A0B] rounded-md border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium block mb-0.5">📚 Phong cách từ vựng:</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium">{story.styleProfile.vocabularyStyle}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#0A0A0B] rounded-md border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium block mb-0.5">🗣️ Cách viết hội thoại:</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium">{story.styleProfile.dialogueStyle}</span>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 rounded-md">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold block mb-1">💡 Hướng Dẫn AI Sẽ Tuân Thủ Khi Sáng Tác:</span>
                  <p className="text-slate-800 dark:text-slate-300 leading-relaxed italic">{story.styleProfile.summaryGuideline}</p>
                </div>

                {!showSaveBox && (
                  <button
                    onClick={() => {
                      setShowSaveBox(true);
                      setCustomName(story.styleProfile?.name || 'Văn phong mẫu ' + new Date().toLocaleDateString('vi-VN'));
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Lưu / Đổi Tên Hồ Sơ Văn Phong Này Vào Thư Viện</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs space-y-3">
                <p>Chưa có hồ sơ văn phong được áp dụng cho truyện này.</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-slate-400 dark:text-slate-600">Dán mẫu ở bên trái hoặc</span>
                  <button
                    onClick={() => setActiveTab('library')}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    chọn từ Thư Viện Văn Phong
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Library Tab */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          {/* Custom Saved Styles Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Thư Viện Văn Phong Bạn Đã Lưu ({allCustomSavedStyles.length})
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">Có thể lưu nhiều giọng văn tác giả để áp dụng cho các bộ truyện</span>
            </div>

            {allCustomSavedStyles.length === 0 ? (
              <div className="p-6 bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-500 space-y-2 transition-colors">
                <p>Bạn chưa lưu mẫu văn phong cá nhân nào.</p>
                <p className="text-slate-400 dark:text-slate-600">
                  Hãy sang mục <button onClick={() => setActiveTab('analyzer')} className="text-emerald-600 dark:text-emerald-400 underline font-medium">Phân Tích Mẫu Mới</button> để AI học giọng văn tác giả rồi nhấn "Lưu Lại"!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCustomSavedStyles.map((item) => {
                  const isActive = story.styleProfile?.id === item.id || (story.styleProfile?.name && story.styleProfile.name === item.name);
                  const isExpanded = expandedStyleId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 bg-white dark:bg-[#0F0F12] border rounded-xl flex flex-col justify-between space-y-3 transition-all ${
                        isActive
                          ? 'border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/10 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded">
                              Đã Lưu
                            </span>

                            {editingStyleId === item.id ? (
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="text"
                                  value={editingStyleName}
                                  onChange={(e) => setEditingStyleName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRename(item.id!);
                                    if (e.key === 'Escape') setEditingStyleId(null);
                                  }}
                                  className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-emerald-500 rounded px-2 py-0.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveRename(item.id!)}
                                  className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded shrink-0"
                                  title="Lưu tên mới"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingStyleId(null)}
                                  className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded shrink-0"
                                  title="Hủy"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 mt-1">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.name || 'Văn phong cá nhân'}</h4>
                                <button
                                  onClick={() => handleStartRename(item.id!, item.name || '')}
                                  className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                                  title="Đổi tên văn phong"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {isActive && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                              <Check className="w-3 h-3" /> Đang Dùng
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          <p><strong className="text-slate-800 dark:text-slate-300">Góc nhìn:</strong> {item.perspective}</p>
                          <p><strong className="text-slate-800 dark:text-slate-300">Nhịp điệu:</strong> {item.pacing}</p>
                          <p><strong className="text-slate-800 dark:text-slate-300">Từ vựng:</strong> {item.vocabularyStyle}</p>
                        </div>

                        {isExpanded && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 animate-in fade-in">
                            <p><strong className="text-slate-500 dark:text-slate-400">Cấu trúc câu:</strong> {item.sentenceStructure}</p>
                            <p><strong className="text-slate-500 dark:text-slate-400">Hội thoại:</strong> {item.dialogueStyle}</p>
                            <p className="p-2 bg-slate-50 dark:bg-[#0A0A0B] rounded border border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-300 italic">
                              "{item.summaryGuideline}"
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setExpandedStyleId(isExpanded ? null : item.id || null)}
                          className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          <span>{isExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {item.id && (
                            <button
                              onClick={() => handleDeleteSavedStyle(item.id!, item.name)}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Xóa khỏi thư viện"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            disabled={isActive}
                            onClick={() => handleApplyStyleFromLibrary(item)}
                            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                              isActive
                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 cursor-default border border-emerald-300 dark:border-emerald-500/30'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{isActive ? 'Đang Sử Dụng' : 'Áp Dụng Tác Phẩm'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preset Famous Author Styles Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Mẫu Văn Phong Tác Giả & Thể Loại Có Sẵn ({filteredPresets.length}/{PRESET_STYLE_PROFILES.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lựa chọn các giọng văn phong phú đã được tối ưu sẵn cho nhiều thể loại sáng tác</p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm mẫu giọng văn (Kim Dung, trùng sinh...)..."
                  className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <Filter className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 mr-1" />
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all text-xs font-medium ${
                    selectedCategory === cat
                      ? 'bg-purple-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 dark:bg-[#131318] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredPresets.length === 0 ? (
              <div className="p-8 bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-500">
                Không tìm thấy mẫu văn phong nào phù hợp với bộ lọc hoặc từ khóa "{searchQuery}".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPresets.map((preset) => {
                  const isActive = story.styleProfile?.id === preset.id || (story.styleProfile?.name && story.styleProfile.name === preset.name);
                  const isExpanded = expandedStyleId === preset.id;

                  return (
                    <div
                      key={preset.id}
                      className={`p-4 bg-white dark:bg-[#0F0F12] border rounded-xl flex flex-col justify-between space-y-3 transition-all ${
                        isActive
                          ? 'border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/10 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 rounded">
                                {preset.category || 'Mẫu Kinh Điển'}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{preset.name}</h4>
                          </div>

                          {isActive && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                              <Check className="w-3 h-3" /> Đang Dùng
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{preset.description}</p>

                        <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                          <p><strong className="text-slate-800 dark:text-slate-300">Góc nhìn:</strong> {preset.perspective}</p>
                          <p><strong className="text-slate-800 dark:text-slate-300">Nhịp điệu:</strong> {preset.pacing}</p>
                        </div>

                        {isExpanded && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 animate-in fade-in">
                            <p><strong className="text-slate-500 dark:text-slate-400">Từ vựng:</strong> {preset.vocabularyStyle}</p>
                            <p><strong className="text-slate-500 dark:text-slate-400">Cấu trúc câu:</strong> {preset.sentenceStructure}</p>
                            <p><strong className="text-slate-500 dark:text-slate-400">Hội thoại:</strong> {preset.dialogueStyle}</p>
                            <p className="p-2 bg-slate-50 dark:bg-[#0A0A0B] rounded border border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-300 italic">
                              "{preset.summaryGuideline}"
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setExpandedStyleId(isExpanded ? null : preset.id || null)}
                          className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          <span>{isExpanded ? 'Thu gọn' : 'Xem nguyên tắc'}</span>
                        </button>

                        <button
                          disabled={isActive}
                          onClick={() => handleApplyStyleFromLibrary(preset)}
                          className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                            isActive
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 cursor-default border border-emerald-300 dark:border-emerald-500/30'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>{isActive ? 'Đang Sử Dụng' : 'Áp Dụng Truyện Này'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
