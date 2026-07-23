import React, { useState, useEffect, useRef } from 'react';
import { Story, Chapter, OutlineNode, StoryLength } from '../../types';
import { notifyApiCallStart, handleApiResponseUsage } from '../../lib/apiUsage';
import { SpellAndSynonymAssistant } from './SpellAndSynonymAssistant';
import { TypoItem } from '../../lib/vietnameseSpellCheck';
import {
  Sparkles,
  Play,
  FastForward,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Edit3,
  Eye,
  FileText,
  Loader2,
  Trash2,
  Plus,
  Save,
  Wand2,
  Maximize2,
  Minimize2,
  SpellCheck,
} from 'lucide-react';

interface ChapterWriterProps {
  story: Story;
  onUpdateStory: (updatedStory: Story) => void;
  selectedOutlineNode?: OutlineNode | null;
}

const TONE_MIX_PRESETS = [
  'Văn học',
  'Điện ảnh',
  'Hài',
  'Kinh dị',
  'Phiêu lưu',
  'Fantasy',
  'Trinh thám',
  'Kiếm hiệp',
  'Tiên hiệp',
  'Ngôn tình',
  'Sci-Fi',
];

export const ChapterWriter: React.FC<ChapterWriterProps> = ({
  story,
  onUpdateStory,
  selectedOutlineNode,
}) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(
    story.chapters.length > 0 ? story.chapters.length - 1 : 0
  );
  const [lengthOption, setLengthOption] = useState<StoryLength>(story.lengthOption || 'Dài');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(story.genres || ['Phiêu lưu']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  // Editor mode & focus mode
  const [viewMode, setViewMode] = useState<'read' | 'edit'>('read');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [bookFont, setBookFont] = useState<'lora' | 'garamond' | 'merriweather' | 'literata'>('lora');

  // Rewrite mode selector
  const [showRewriteOptions, setShowRewriteOptions] = useState(false);
  const [rewriteMode, setRewriteMode] = useState('gay_can');

  // Spell Check & Synonym Assistant
  const [showSpellAssistant, setShowSpellAssistant] = useState(false);

  const currentChapter: Chapter | undefined = story.chapters[activeChapterIndex];
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const fontClass =
    bookFont === 'garamond'
      ? 'font-book-garamond'
      : bookFont === 'merriweather'
      ? 'font-book-merriweather'
      : bookFont === 'literata'
      ? 'font-book-literata'
      : 'font-book';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper to extract a clean title for a chapter from AI generated text or outline node
  const extractTitleFromText = (text: string, chapterNumber: number, fallbackTitle?: string): string => {
    if (text) {
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

      for (const line of lines.slice(0, 10)) {
        // Remove leading/trailing markdown characters (#, *, _, -, >, etc)
        const cleanLine = line.replace(/^[\#\*\_\-\s\>]+/, '').replace(/[\#\*\_\-\s]+$/, '').trim();

        // Check if line matches "Chương X: Title", "Chương X - Title", "Chương X. Title", etc.
        const chapterPrefixMatch = cleanLine.match(/^Chương\s+\d+[\:\s\-\–\—\.]*\s*(.*)$/i);
        if (chapterPrefixMatch) {
          let rest = chapterPrefixMatch[1].trim();
          rest = rest.replace(/^[\*\_\#]+|[\*\_\#]+$/g, '').trim();
          if (rest && !rest.toLowerCase().includes('diễn biến kịch tính')) {
            return rest;
          }
        } else if (
          cleanLine.length > 0 &&
          cleanLine.length < 120 &&
          !cleanLine.endsWith('.') &&
          !cleanLine.endsWith(';') &&
          !cleanLine.toLowerCase().startsWith('phần ') &&
          !cleanLine.toLowerCase().startsWith('tiết ')
        ) {
          const cleanTitle = cleanLine.replace(/^[\*\_\#]+|[\*\_\#]+$/g, '').trim();
          if (cleanTitle && !cleanTitle.toLowerCase().includes('diễn biến kịch tính')) {
            return cleanTitle;
          }
        }
      }
    }

    if (fallbackTitle) {
      const cleanFallback = fallbackTitle.replace(/^(?:Chương|Mốc)\s*\d+[\:\s\-\–\.]*/i, '').trim();
      if (cleanFallback && !cleanFallback.toLowerCase().includes('diễn biến kịch tính')) {
        return cleanFallback;
      }
    }

    return `Chương ${chapterNumber}`;
  };

  useEffect(() => {
    if (currentChapter) {
      let titleToSet = currentChapter.title;

      // Clean up title if missing, generic, includes 'Diễn biến kịch tính', or has 'Chương X:' prefix
      if (
        !titleToSet ||
        titleToSet.includes('Diễn biến kịch tính') ||
        /^Chương\s+\d+[\:\s\-\.]*/i.test(titleToSet)
      ) {
        const extracted = extractTitleFromText(
          currentChapter.content,
          currentChapter.chapterNumber,
          selectedOutlineNode?.title
        );
        if (extracted && extracted !== titleToSet) {
          titleToSet = extracted;

          // Auto-fix chapter title in story state
          const updatedChapters = story.chapters.map((ch, idx) =>
            idx === activeChapterIndex ? { ...ch, title: extracted } : ch
          );
          onUpdateStory({
            ...story,
            chapters: updatedChapters,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      setEditedTitle(titleToSet);
      setEditedContent(currentChapter.content);
    } else {
      setEditedTitle('');
      setEditedContent('');
    }
  }, [activeChapterIndex, story.chapters]);

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  // 1. Generate New Chapter with Streaming
  const handleGenerateChapter = async () => {
    setIsGenerating(true);
    notifyApiCallStart();
    let accumulatedText = '';

    const newChapterIndex = story.chapters.length;
    const targetNode = selectedOutlineNode || story.outlineNodes[newChapterIndex] || {
      title: `Chương ${newChapterIndex + 1}`,
      description: 'Diễn biến câu chuyện',
      expandedScenes: [],
    };

    try {
      const response = await fetch('/api/ai/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          currentChapterIndex: newChapterIndex,
          targetOutlineNode: targetNode,
          lengthOption,
          selectedGenres,
          styleProfile: story.styleProfile,
          customPrompt,
          stream: true,
        }),
      });

      if (!response.body) throw new Error('Không có luồng phản hồi từ server.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.text) {
                accumulatedText += data.text;
                setEditedContent(accumulatedText);
              }
            } catch (e: any) {
              if (e.message && !e.message.startsWith('Unexpected token')) {
                throw e;
              }
            }
          }
        }
      }

      if (!accumulatedText.trim()) {
        throw new Error('Nội dung chương tạo ra bị rỗng hoặc dịch vụ AI bận.');
      }

      // Extract Chapter Title dynamically from generated content
      const title = extractTitleFromText(accumulatedText, newChapterIndex + 1, targetNode.title);

      const wordCount = accumulatedText.trim().split(/\s+/).length;

      const newChapter: Chapter = {
        id: `chap-${Date.now()}`,
        chapterNumber: newChapterIndex + 1,
        title,
        content: accumulatedText,
        wordCount,
        createdAt: new Date().toISOString(),
      };

      const updatedChapters = [...story.chapters, newChapter];
      const updatedStory = {
        ...story,
        chapters: updatedChapters,
        updatedAt: new Date().toISOString(),
      };

      onUpdateStory(updatedStory);
      setActiveChapterIndex(updatedChapters.length - 1);
      setCustomPrompt('');

      // Auto run logic audit & memory update after chapter generation
      runAutoAudit(updatedStory, accumulatedText);
    } catch (err: any) {
      console.error('Error generating chapter:', err);
      alert(`⚠️ ${err.message || 'Lỗi khi sáng tạo chương. Vui lòng thử lại sau giây lát!'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Continue Writing
  const handleContinueWriting = async () => {
    if (!currentChapter) return;
    setIsContinuing(true);
    notifyApiCallStart();
    let accumulated = currentChapter.content;

    try {
      const response = await fetch('/api/ai/continue-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          currentChapterText: currentChapter.content,
          customInstruction: customPrompt,
        }),
      });

      if (!response.body) throw new Error('No stream');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                accumulated += data.text;
                setEditedContent(accumulated);
              }
            } catch (e) {}
          }
        }
      }

      const wordCount = accumulated.trim().split(/\s+/).length;
      const updatedChapters = story.chapters.map((ch, idx) =>
        idx === activeChapterIndex ? { ...ch, content: accumulated, wordCount } : ch
      );

      const updatedStory = { ...story, chapters: updatedChapters, updatedAt: new Date().toISOString() };
      onUpdateStory(updatedStory);
      setCustomPrompt('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsContinuing(false);
    }
  };

  // 3. Rewrite Chapter
  const handleRewriteChapter = async () => {
    if (!currentChapter) return;
    setIsRewriting(true);
    setShowRewriteOptions(false);
    notifyApiCallStart();
    let accumulatedText = '';

    try {
      const response = await fetch('/api/ai/rewrite-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          chapterText: currentChapter.content,
          rewriteMode,
        }),
      });

      if (!response.body) throw new Error('No stream');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                accumulatedText += data.text;
                setEditedContent(accumulatedText);
              }
            } catch (e) {}
          }
        }
      }

      const wordCount = accumulatedText.trim().split(/\s+/).length;
      const updatedChapters = story.chapters.map((ch, idx) =>
        idx === activeChapterIndex ? { ...ch, content: accumulatedText, wordCount } : ch
      );

      onUpdateStory({ ...story, chapters: updatedChapters, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRewriting(false);
    }
  };

  // 4. Auto Logic Audit & Memory Sync
  const runAutoAudit = async (storyToAudit: Story, text: string) => {
    setIsAuditing(true);
    try {
      const response = await fetch('/api/ai/audit-and-update-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story: storyToAudit,
          chapterText: text,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const audit = resData.data;

        // Apply suggested updates to story memory
        let updatedTimeline = [...storyToAudit.timeline];
        if (audit.suggestedUpdates?.newTimelineEvent) {
          const te = audit.suggestedUpdates.newTimelineEvent;
          updatedTimeline.push({
            id: `tl-${Date.now()}`,
            day: te.day || `Mốc mới`,
            event: te.event || '',
          });
        }

        let autoFixed = false;
        let finalContent = text;

        // Auto-fix chapter text if logic errors were found and corrected content provided
        if (audit.correctedChapterText && audit.correctedChapterText.trim().length > 100 && audit.correctedChapterText !== text) {
          finalContent = audit.correctedChapterText.trim();
          autoFixed = true;
          setEditedContent(finalContent);
        }

        const newWordCount = finalContent.trim().split(/\s+/).filter(Boolean).length;

        const updatedChapters = storyToAudit.chapters.map((ch, idx) =>
          idx === activeChapterIndex
            ? {
                ...ch,
                content: finalContent,
                wordCount: newWordCount,
                auditReport: {
                  score: autoFixed ? Math.max(audit.auditScore || 95, 95) : (audit.auditScore || 95),
                  hasLogicErrors: audit.hasLogicErrors || false,
                  logicIssues: audit.logicIssues || [],
                  autoFixed,
                  correctedContent: audit.correctedChapterText || undefined,
                },
              }
            : ch
        );

        onUpdateStory({
          ...storyToAudit,
          timeline: updatedTimeline,
          chapters: updatedChapters,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSaveManualEdits = () => {
    if (!currentChapter) return;
    const wordCount = editedContent.trim().split(/\s+/).length;
    const updatedChapters = story.chapters.map((ch, idx) =>
      idx === activeChapterIndex
        ? { ...ch, title: editedTitle, content: editedContent, wordCount }
        : ch
    );

    onUpdateStory({ ...story, chapters: updatedChapters, updatedAt: new Date().toISOString() });
    setViewMode('read');
  };

  const handleReplaceText = (oldText: string, newText: string) => {
    if (!currentChapter) return;
    const newContent = editedContent.replaceAll(oldText, newText);
    setEditedContent(newContent);
    const wordCount = newContent.trim().split(/\s+/).length;
    const updatedChapters = story.chapters.map((ch, idx) =>
      idx === activeChapterIndex ? { ...ch, content: newContent, wordCount } : ch
    );
    onUpdateStory({ ...story, chapters: updatedChapters, updatedAt: new Date().toISOString() });
  };

  const handleReplaceAllTypos = (typos: TypoItem[]) => {
    if (!currentChapter || typos.length === 0) return;
    let newContent = editedContent;
    typos.forEach((t) => {
      newContent = newContent.replaceAll(t.word, t.suggestion);
    });
    setEditedContent(newContent);
    const wordCount = newContent.trim().split(/\s+/).length;
    const updatedChapters = story.chapters.map((ch, idx) =>
      idx === activeChapterIndex ? { ...ch, content: newContent, wordCount } : ch
    );
    onUpdateStory({ ...story, chapters: updatedChapters, updatedAt: new Date().toISOString() });
  };

  const handleDeleteChapter = (idx: number) => {
    const updated = story.chapters.filter((_, i) => i !== idx);
    onUpdateStory({ ...story, chapters: updated, updatedAt: new Date().toISOString() });
    if (activeChapterIndex >= updated.length) {
      setActiveChapterIndex(Math.max(0, updated.length - 1));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Chapter Selector & Controls */}
      <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-lg space-y-4 text-slate-800 dark:text-slate-100">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" /> TRÌNH SÁNG TÁC CÓ BỘ NHỚ AI
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Xưởng Sáng Tác & Biên Tập Chương</h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
            {story.chapters.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => setActiveChapterIndex(idx)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium shrink-0 transition-all ${
                  activeChapterIndex === idx
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 font-semibold shadow-sm'
                    : 'bg-slate-50 dark:bg-[#0A0A0B] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Chương {idx + 1}
              </button>
            ))}

            <button
              onClick={handleGenerateChapter}
              disabled={isGenerating}
              className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shrink-0 shadow-sm transition-all disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Viết Chương Mới
            </button>
          </div>
        </div>

        {/* AI Fine-tuning Controls */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Độ dài chương:</label>
              <select
                value={lengthOption}
                onChange={(e) => setLengthOption(e.target.value as StoryLength)}
                className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800 rounded-md p-2 text-xs text-slate-800 dark:text-slate-200 focus:border-emerald-500/50 outline-none"
              >
                <option value="Ngắn">Ngắn (~1,000 - 1,500 từ)</option>
                <option value="Trung bình">Trung bình (~2,000 - 3,000 từ)</option>
                <option value="Dài">Dài (~3,500 - 5,000 từ)</option>
                <option value="Siêu dài">Siêu dài (~5,000 - 8,000 từ)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Phong cách & Tông giọng:</label>
              <div className="flex flex-wrap gap-1.5">
                {TONE_MIX_PRESETS.map((genre) => {
                  const active = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`px-2 py-1 rounded text-[11px] font-medium border transition-all ${
                        active
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
                          : 'bg-slate-50 dark:bg-[#0A0A0B] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {active ? '✓ ' : ''}
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Yêu cầu bổ sung cho AI:</label>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="VD: Nhấn mạnh vào cảm xúc của nhân vật chính..."
              className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800 rounded-md p-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={isGenerating}
                onClick={handleGenerateChapter}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-md flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> AI Đang Viết Live...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> AI Viết Chương {story.chapters.length + 1}
                  </>
                )}
              </button>

              {currentChapter && (
                <>
                  <button
                    disabled={isContinuing || isGenerating}
                    onClick={handleContinueWriting}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 font-medium text-xs rounded-md flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all"
                  >
                    {isContinuing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang Viết Tiếp...
                      </>
                    ) : (
                      <>
                        <FastForward className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Viết Tiếp
                      </>
                    )}
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowRewriteOptions(!showRewriteOptions)}
                      disabled={isRewriting}
                      className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 font-medium text-xs rounded-md flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Viết Lại
                    </button>

                    {showRewriteOptions && (
                      <div className="absolute top-10 left-0 z-30 bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-md p-2 shadow-xl w-56 space-y-1">
                        <span className="text-[10px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
                          Hướng Viết Lại:
                        </span>
                        {[
                          { id: 'gay_can', label: '🔥 Gay cấn hơn' },
                          { id: 'cam_dong', label: '💧 Cảm động hơn' },
                          { id: 'hai_huoc', label: '😂 Hài hước hơn' },
                          { id: 'u_toi', label: '🌑 U tối hơn' },
                          { id: 'nhieu_hoi_thoai', label: '💬 Nhiều hội thoại hơn' },
                          { id: 'nhieu_mieu_ta', label: '🎨 Miêu tả chi tiết hơn' },
                          { id: 'nhanh', label: '⚡ Nhịp văn nhanh hơn' },
                          { id: 'cham', label: '🐢 Nhịp văn chậm rãi' },
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() => {
                              setRewriteMode(mode.id);
                              handleRewriteChapter();
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    disabled={isAuditing}
                    onClick={() => runAutoAudit(story, editedContent)}
                    className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-medium text-xs rounded-md flex items-center gap-1.5 transition-all"
                  >
                    {isAuditing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                    Kiểm Tra Logic
                  </button>

                  <button
                    onClick={() => setShowSpellAssistant(!showSpellAssistant)}
                    className={`px-3.5 py-2 font-medium text-xs rounded-md flex items-center gap-1.5 transition-all border ${
                      showSpellAssistant
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/60'
                    }`}
                    title="Bắt lỗi chính tả & tra từ đồng nghĩa"
                  >
                    <SpellCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Bắt Lỗi & Đồng Nghĩa
                  </button>
                </>
              )}
            </div>

            {currentChapter && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {/* Book Font Selector */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-md border border-slate-200 dark:border-slate-700/60 mr-1">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 px-1">📖 Phông chữ sách:</span>
                  <select
                    value={bookFont}
                    onChange={(e) => setBookFont(e.target.value as any)}
                    className="bg-white dark:bg-[#0A0A0B] text-slate-800 dark:text-slate-200 text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-serif outline-none cursor-pointer"
                  >
                    <option value="lora">Lora (Cổ điển & Thanh lịch)</option>
                    <option value="garamond">EB Garamond (Sách Văn Học)</option>
                    <option value="merriweather">Merriweather (Ấn phẩm Độc Bản)</option>
                    <option value="literata">Literata (Truyện Chữ Hiện Đại)</option>
                  </select>
                </div>

                <span className="text-slate-500 text-[11px]">Chế độ:</span>
                <button
                  onClick={() => setViewMode('read')}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    viewMode === 'read' ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Đọc
                </button>
                <button
                  onClick={() => setViewMode('edit')}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    viewMode === 'edit' ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Biên tập
                </button>
                <button
                  onClick={() => setIsFocusMode(true)}
                  className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1 transition-colors ml-1 shadow-xs"
                  title="Mở Chế độ tập trung - Ẩn thanh điều hướng & sidebar để tập trung sáng tác"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Chế độ tập trung
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Report Banner if exists */}
      {currentChapter?.auditReport && (
        <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-md flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded font-semibold text-xs border border-emerald-500/20">
              Score: {currentChapter.auditReport.score}%
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-200 block">AI Logic Auditor Report:</span>
                {currentChapter.auditReport.autoFixed && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Đã tự động sửa lỗi logic
                  </span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                {currentChapter.auditReport.hasLogicErrors
                  ? `Phát hiện & đã tự động sửa đổi: ${currentChapter.auditReport.logicIssues?.join(', ')}`
                  : 'Mạch truyện hoàn hảo, tuân thủ tuyệt đối Bộ Nhớ Nhân Vật & Dòng Thời Gian.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Spell & Synonym Assistant Panel */}
      {showSpellAssistant && (
        <SpellAndSynonymAssistant
          content={editedContent}
          onReplaceText={handleReplaceText}
          onReplaceAllTypos={handleReplaceAllTypos}
          onClose={() => setShowSpellAssistant(false)}
        />
      )}

      {/* Main Chapter Content / Workspace Editor */}
      {!currentChapter ? (
        <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-slate-500 dark:text-slate-400 space-y-3 shadow-lg">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <Wand2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Chưa Có Chương Nào Trong Bộ Truyện</h3>
          <p className="text-xs max-w-md mx-auto text-slate-500 dark:text-slate-400">
            Nhấn nút <strong className="text-emerald-600 dark:text-emerald-400">"AI Viết Chương 1"</strong> ở trên. AI sẽ tổng hợp Story Bible, Dàn ý & Bộ Nhớ Nhân Vật để viết chương đầu tiên hoàn hảo!
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#050507] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Title & Stats Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
            {viewMode === 'edit' ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800 rounded-md p-2.5 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500/50 ${fontClass}`}
              />
            ) : (
              <div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">
                  Chương {currentChapter.chapterNumber}
                </span>
                <h1 className={`text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight ${fontClass}`}>
                  {(() => {
                    let clean = currentChapter.title || '';
                    clean = clean.replace(new RegExp(`^Chương\\s+${currentChapter.chapterNumber}[\\:\\s\\-\\–]*`, 'i'), '').trim();
                    clean = clean.replace(/^Chương\s+\d+[\:\s\-\–]*/i, '').trim();
                    if (!clean || clean.toLowerCase().includes('diễn biến kịch tính')) {
                      clean = extractTitleFromText(currentChapter.content, currentChapter.chapterNumber, selectedOutlineNode?.title);
                    }
                    return clean.startsWith('Chương ') ? clean : `Chương ${currentChapter.chapterNumber}: ${clean}`;
                  })()}
                </h1>
              </div>
            )}

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#0A0A0B] px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800">
                📊 {editedContent.trim().split(/\s+/).filter(Boolean).length} từ
              </span>

              <button
                onClick={() => setIsFocusMode(true)}
                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded text-xs font-medium flex items-center gap-1 transition-colors shadow-xs"
                title="Mở Chế độ tập trung"
              >
                <Maximize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Tập Trung
              </button>

              {viewMode === 'edit' && (
                <button
                  onClick={handleSaveManualEdits}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" /> Lưu Sửa
                </button>
              )}

              <button
                onClick={() => handleDeleteChapter(activeChapterIndex)}
                className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                title="Xóa chương này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reader / Editor view */}
          {viewMode === 'edit' ? (
            <textarea
              ref={editorRef}
              rows={20}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className={`w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800 rounded-md p-4 text-slate-800 dark:text-slate-200 text-base leading-relaxed focus:outline-none focus:border-emerald-500/50 transition-all resize-y ${fontClass}`}
            />
          ) : (
            <div className={`prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-loose text-base sm:text-lg space-y-5 text-justify tracking-normal ${fontClass}`}>
              {editedContent
                .split('\n')
                .filter((p) => p.trim())
                .map((paragraph, pIdx) => (
                  <p key={pIdx} className={`indent-8 text-slate-800 dark:text-slate-200 leading-relaxed ${fontClass}`}>
                    {paragraph}
                  </p>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Full-Screen Immersive Focus Mode Overlay */}
      {isFocusMode && currentChapter && (
        <div className="fixed inset-0 z-[100] bg-slate-100 dark:bg-[#070709] text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* Focus Header Bar */}
          <div className="h-14 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0F0F12]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Chế Độ Tập Trung
              </span>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md font-serif">
                Chương {currentChapter.chapterNumber}: {currentChapter.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#0A0A0B] px-3 py-1 rounded border border-slate-200 dark:border-slate-800">
                📊 {editedContent.trim().split(/\s+/).filter(Boolean).length} từ
              </span>

              {viewMode === 'edit' && (
                <button
                  onClick={handleSaveManualEdits}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-medium flex items-center gap-1 shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> Lưu Sửa
                </button>
              )}

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0A0A0B] p-1 rounded-md border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setViewMode('read')}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    viewMode === 'read' ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Đọc
                </button>
                <button
                  onClick={() => setViewMode('edit')}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    viewMode === 'edit' ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Biên tập
                </button>
              </div>

              <button
                onClick={() => setShowSpellAssistant(!showSpellAssistant)}
                className={`px-3 py-1.5 font-medium text-xs rounded-md flex items-center gap-1.5 transition-all border ${
                  showSpellAssistant
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700/60'
                }`}
                title="Bắt lỗi chính tả & tra từ đồng nghĩa"
              >
                <SpellCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Bắt Lỗi & Đồng Nghĩa</span>
              </button>

              <button
                onClick={() => setIsFocusMode(false)}
                className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700/80 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Thoát chế độ tập trung (phím Esc)"
              >
                <Minimize2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Thoát Focus (Esc)
              </button>
            </div>
          </div>

          {/* Focus Main Editor / Reader Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 flex justify-center bg-slate-50 dark:bg-[#070709]">
            <div className="max-w-4xl w-full flex flex-col space-y-6">
              {showSpellAssistant && (
                <SpellAndSynonymAssistant
                  content={editedContent}
                  onReplaceText={handleReplaceText}
                  onReplaceAllTypos={handleReplaceAllTypos}
                  onClose={() => setShowSpellAssistant(false)}
                />
              )}
              {viewMode === 'edit' ? (
                <div className="flex-1 flex flex-col space-y-4">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Tiêu đề chương..."
                    className={`w-full bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xl font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500/50 ${fontClass}`}
                  />
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    placeholder="Bắt đầu gõ nội dung chương tại đây mà không bị phân tâm..."
                    className={`w-full flex-1 min-h-[calc(100vh-250px)] bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 sm:p-10 text-slate-800 dark:text-slate-100 text-base sm:text-lg leading-loose focus:outline-none focus:border-emerald-500/50 resize-none shadow-2xl ${fontClass}`}
                  />
                </div>
              ) : (
                <div className="bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 sm:p-12 shadow-2xl min-h-[calc(100vh-200px)]">
                  <div className="text-center mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                      Chương {currentChapter.chapterNumber}
                    </span>
                    <h1 className={`text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight ${fontClass}`}>
                      {currentChapter.title}
                    </h1>
                  </div>
                  <div className={`prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-loose text-base sm:text-lg space-y-6 text-justify ${fontClass}`}>
                    {editedContent
                      .split('\n')
                      .filter((p) => p.trim())
                      .map((paragraph, pIdx) => (
                        <p key={pIdx} className={`indent-8 text-slate-800 dark:text-slate-200 leading-relaxed ${fontClass}`}>
                          {paragraph}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
