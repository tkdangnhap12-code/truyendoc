import React, { useState } from 'react';
import { Story, OutlineNode, PlotRevision } from '../../types';
import { Layers, Sparkles, Plus, Trash2, CheckCircle2, ChevronRight, Loader2, Edit2, MoveDown, Eye, BookOpen, Compass, Feather, RefreshCw, X, Check, FileText, Wand2, ArrowRight, Lightbulb, Zap, Save, GitFork, History, Copy, FileSpreadsheet, ArrowUp, ArrowDown } from 'lucide-react';

interface StructuredScene {
  title: string;
  details: string[];
}

const parseExpandedScenes = (scenes: string[] = []): StructuredScene[] => {
  return scenes.map((sceneStr) => {
    if (!sceneStr) return { title: '', details: [] };
    const lines = sceneStr.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return { title: '', details: [] };

    // First line is scene title
    const rawTitle = lines[0].replace(/^(•|-|\*|\d+\.)\s*/, '');
    const title = rawTitle.replace(/^Cảnh \d+:\s*/i, '');

    // Remaining lines are details
    const details = lines.slice(1).map((line) => line.replace(/^(•|-|\*|\d+\.)\s*/, ''));
    return { title, details };
  });
};

const stringifyStructuredScenes = (scenes: StructuredScene[]): string[] => {
  return scenes
    .filter((s) => s.title.trim().length > 0)
    .map((s) => {
      const cleanTitle = s.title.trim();
      const validDetails = s.details.map((d) => d.trim()).filter(Boolean);
      if (validDetails.length === 0) {
        return cleanTitle;
      }
      return `${cleanTitle}\n${validDetails.map((d) => `  • ${d}`).join('\n')}`;
    });
};

interface OutlineStudioProps {
  story: Story;
  onUpdateStory: (updatedStory: Story) => void;
  onForkStory?: (newStory: Story) => void;
  onSelectNodeForChapter: (node: OutlineNode, index: number) => void;
}

const STYLE_PRESETS = [
  { id: 'dramatic', name: 'Kịch tính & Dồn dập', icon: '⚡', desc: 'Tiết tấu nhanh, xung đột liên tục, nghẹt thở' },
  { id: 'xianxia', name: 'Tiên hiệp & Tu chân', icon: '⚔️', desc: 'Bối cảnh rộng lớn, thăng tiến sức mạnh & đấu trí' },
  { id: 'revenge', name: 'Trọng sinh & Báo thù', icon: '🕯️', desc: 'Sâu sắc, mưu đồ ngầm, đan xen quá khứ - hiện tại' },
  { id: 'mystery', name: 'Trinh thám & U tối', icon: '🕵️', desc: 'Âm u, cân não, manh mối liên kết nút thắt bất ngờ' },
  { id: 'romance', name: 'Ngôn tình & Lãng mạn', icon: '🌸', desc: 'Cảm xúc tinh tế, rung động, đào sâu nội tâm' },
  { id: 'fantasy', name: 'Huyền huyễn & Kỳ ảo', icon: '🌌', desc: 'Xây dựng thế giới sinh động, ma pháp & quái thú' },
  { id: 'humor', name: 'Hài hước & Hóm hỉnh', icon: '🎭', desc: 'Hội thoại dí dỏm, tình huống bất ngờ sảng khoái' },
  { id: 'poetic', name: 'Cổ phong & Sâu lắng', icon: '📜', desc: 'Trau chuốt từ ngữ, giàu chất thơ & hình ảnh' },
];

export const OutlineStudio: React.FC<OutlineStudioProps> = ({
  story,
  onUpdateStory,
  onForkStory,
  onSelectNodeForChapter,
}) => {
  const [expandingNodeId, setExpandingNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editNodeTitle, setEditNodeTitle] = useState('');
  const [editNodeDesc, setEditNodeDesc] = useState('');
  const [editScenes, setEditScenes] = useState<StructuredScene[]>([]);

  // Quick inputs inside Node Editor
  const [newSceneInput, setNewSceneInput] = useState('');
  const [activeAddingDetailSceneIdx, setActiveAddingDetailSceneIdx] = useState<number | null>(null);
  const [newDetailInput, setNewDetailInput] = useState('');

  const [autoExpandInput, setAutoExpandInput] = useState('');
  const [autoExpanding, setAutoExpanding] = useState(false);

  // Node Editing Handlers
  const handleStartEditNode = (node: OutlineNode, initialDetailSceneIdx: number | null = null) => {
    setEditingNodeId(node.id);
    setEditNodeTitle(node.title);
    setEditNodeDesc(node.description);
    setEditScenes(parseExpandedScenes(node.expandedScenes || []));
    setNewSceneInput('');
    setActiveAddingDetailSceneIdx(initialDetailSceneIdx);
    setNewDetailInput('');
  };

  const handleSaveEditedNode = () => {
    if (!editingNodeId) return;
    const finalScenes = stringifyStructuredScenes(editScenes);
    const updatedNodes = story.outlineNodes.map((n) =>
      n.id === editingNodeId
        ? {
            ...n,
            title: editNodeTitle.trim() || n.title,
            description: editNodeDesc.trim() || n.description,
            expandedScenes: finalScenes,
          }
        : n
    );
    onUpdateStory({
      ...story,
      outlineNodes: updatedNodes,
      updatedAt: new Date().toISOString(),
    });
    setEditingNodeId(null);
  };

  const handleAddSceneToEditor = () => {
    if (!newSceneInput.trim()) return;
    setEditScenes([...editScenes, { title: newSceneInput.trim(), details: [] }]);
    setNewSceneInput('');
  };

  const handleDeleteSceneFromEditor = (index: number) => {
    setEditScenes(editScenes.filter((_, idx) => idx !== index));
  };

  const handleUpdateSceneTitle = (index: number, newTitle: string) => {
    setEditScenes(
      editScenes.map((s, idx) => (idx === index ? { ...s, title: newTitle } : s))
    );
  };

  const handleAddDetailToScene = (sceneIdx: number) => {
    if (!newDetailInput.trim()) return;
    setEditScenes(
      editScenes.map((s, idx) =>
        idx === sceneIdx
          ? { ...s, details: [...s.details, newDetailInput.trim()] }
          : s
      )
    );
    setNewDetailInput('');
    setActiveAddingDetailSceneIdx(null);
  };

  const handleDeleteDetailFromScene = (sceneIdx: number, detailIdx: number) => {
    setEditScenes(
      editScenes.map((s, idx) =>
        idx === sceneIdx
          ? { ...s, details: s.details.filter((_, dIdx) => dIdx !== detailIdx) }
          : s
      )
    );
  };

  const handleMoveScene = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= editScenes.length) return;
    const newArr = [...editScenes];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setEditScenes(newArr);
  };

  // Direct Inline Pitch Editor States
  const [isEditingPitchInline, setIsEditingPitchInline] = useState(false);
  const [editedPitchText, setEditedPitchText] = useState(story.pitch || '');
  const [editedToneText, setEditedToneText] = useState(story.targetTone || '');

  // Story Plot Builder Modal States
  const [isPlotBuilderOpen, setIsPlotBuilderOpen] = useState(false);
  const [summaryInput, setSummaryInput] = useState(story.pitch || '');
  const [selectedStyle, setSelectedStyle] = useState(story.targetTone || 'Kịch tính & Dồn dập');
  const [customStyleInput, setCustomStyleInput] = useState('');
  const [detailLevel, setDetailLevel] = useState<'standard' | 'deep'>('deep');
  const [appendMode, setAppendMode] = useState<'replace' | 'append'>('replace');

  const [isBuildingPlot, setIsBuildingPlot] = useState(false);
  const [plotError, setPlotError] = useState<string | null>(null);
  const [generatedPlotData, setGeneratedPlotData] = useState<any | null>(null);

  // Plot Revision & Chapter Adaptation Modal
  const [isRealignModalOpen, setIsRealignModalOpen] = useState(false);
  const [recreateChapters, setRecreateChapters] = useState(true);
  const [isRealigning, setIsRealigning] = useState(false);
  const [realignError, setRealignError] = useState<string | null>(null);
  const [realignedData, setRealignedData] = useState<any | null>(null);

  // History Drawer State
  const [showHistory, setShowHistory] = useState(false);

  // Save Inline Pitch Edits Directly
  const handleSaveInlinePitch = () => {
    onUpdateStory({
      ...story,
      pitch: editedPitchText,
      targetTone: editedToneText,
      updatedAt: new Date().toISOString(),
    });
    setIsEditingPitchInline(false);
  };

  // Trigger AI Re-alignment & Chapter Adaptations
  const handleRealignPlot = async () => {
    setIsRealigning(true);
    setRealignError(null);
    setRealignedData(null);

    try {
      const response = await fetch('/api/ai/realign-story-plot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editedPitch: editedPitchText || story.pitch,
          styleTone: editedToneText || story.targetTone,
          existingStory: story,
          recreateChapters: recreateChapters,
        }),
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Không thể tái cấu trúc cốt truyện.');
      }

      setRealignedData(resData.data);
    } catch (err: any) {
      setRealignError(err?.message || 'Có lỗi khi gọi AI tái cấu trúc cốt truyện.');
    } finally {
      setIsRealigning(false);
    }
  };

  // Apply Realigned Plot & Rewrite Chapters (Option A: Update, Option B: Fork as New Novel)
  const handleApplyRealignedPlot = (target: 'update' | 'fork') => {
    if (!realignedData) return;

    // Build new outline nodes
    const newNodes: OutlineNode[] = (realignedData.adaptedOutlineNodes || []).map((node: any, idx: number) => ({
      id: `node-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      title: node.title || `Mốc ${idx + 1}`,
      description: node.description || '',
      expandedScenes: Array.isArray(node.expandedScenes) ? node.expandedScenes : [],
      completed: false,
    }));

    // Build adapted chapters
    const adaptedChapters = (realignedData.adaptedChapters || []).map((c: any, idx: number) => {
      const orig = story.chapters[idx];
      const chapterContent = c.content || (orig ? orig.content : '');
      return {
        id: orig ? orig.id : `chap-${Date.now()}-${idx}`,
        chapterNumber: c.chapterNumber || idx + 1,
        title: c.title || (orig ? orig.title : `Chương ${idx + 1}`),
        content: chapterContent,
        summary: c.summary || '',
        wordCount: chapterContent.trim().split(/\s+/).filter(Boolean).length,
        createdAt: orig ? orig.createdAt : new Date().toISOString(),
      };
    });

    const finalChapters = adaptedChapters.length > 0 ? adaptedChapters : story.chapters;

    // Snapshot
    const newRevision: PlotRevision = {
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
      versionName: `Sửa đổi: ${realignedData.expandedPitch?.slice(0, 30) || 'Bản mới'}...`,
      pitch: realignedData.expandedPitch || editedPitchText || story.pitch,
      targetTone: editedToneText || story.targetTone,
      adaptationNotes: realignedData.adaptationNotes || '',
      chaptersCount: finalChapters.length,
    };

    const updatedRevisions = [newRevision, ...(story.plotRevisions || [])];

    if (target === 'fork') {
      const forkedStory: Story = {
        ...story,
        id: `story-${Date.now()}`,
        title: realignedData.recommendedTitle && realignedData.recommendedTitle !== story.title
          ? realignedData.recommendedTitle
          : `${story.title} (Quyển II / Bản Cốt Truyện B)`,
        pitch: realignedData.expandedPitch || editedPitchText || story.pitch,
        targetTone: editedToneText || story.targetTone,
        outlineNodes: newNodes.length > 0 ? newNodes : story.outlineNodes,
        chapters: finalChapters,
        plotRevisions: updatedRevisions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (onForkStory) {
        onForkStory(forkedStory);
      } else {
        onUpdateStory(forkedStory);
      }
      setIsRealignModalOpen(false);
      setIsEditingPitchInline(false);
      alert(`🎉 Đã viết & tạo QUYỂN MỚI thành công trong Thư Viện! Toàn bộ các chương đã được viết lại theo cốt truyện mới.`);
    } else {
      onUpdateStory({
        ...story,
        pitch: realignedData.expandedPitch || editedPitchText || story.pitch,
        targetTone: editedToneText || story.targetTone,
        outlineNodes: newNodes.length > 0 ? newNodes : story.outlineNodes,
        chapters: finalChapters,
        plotRevisions: updatedRevisions,
        updatedAt: new Date().toISOString(),
      });
      setIsRealignModalOpen(false);
      setIsEditingPitchInline(false);
      alert(`🎉 Đã cập nhật thành công! Tác phẩm và ${finalChapters.length} chương đã được viết lại theo hướng cốt truyện mới.`);
    }
  };

  // Restore Revision Snapshot
  const handleRestoreRevision = (rev: PlotRevision) => {
    if (window.confirm(`Khôi phục tóm tắt cốt truyện về phiên bản "${rev.versionName}"?`)) {
      onUpdateStory({
        ...story,
        pitch: rev.pitch,
        targetTone: rev.targetTone,
        updatedAt: new Date().toISOString(),
      });
      setEditedPitchText(rev.pitch);
      setEditedToneText(rev.targetTone);
      alert('Đã khôi phục tóm tắt cốt truyện.');
    }
  };

  // AI Build Story & Expand Outline
  const handleBuildStoryOutline = async () => {
    setIsBuildingPlot(true);
    setPlotError(null);
    setGeneratedPlotData(null);

    const styleTone = customStyleInput.trim() ? customStyleInput.trim() : selectedStyle;

    try {
      const response = await fetch('/api/ai/build-story-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: summaryInput,
          styleTone,
          detailLevel,
          existingStory: story,
        }),
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Không thể tự động xây dựng dàn ý cốt truyện.');
      }

      setGeneratedPlotData(resData.data);
    } catch (err: any) {
      setPlotError(err?.message || 'Có lỗi xảy ra khi gọi AI xây dựng cốt truyện.');
    } finally {
      setIsBuildingPlot(false);
    }
  };

  // Apply Generated Plot & Outline to Story
  const handleApplyGeneratedPlot = () => {
    if (!generatedPlotData) return;

    const newNodes: OutlineNode[] = (generatedPlotData.outlineNodes || []).map((node: any, idx: number) => ({
      id: `node-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      title: node.title || `Mốc ${idx + 1}`,
      description: node.description || '',
      expandedScenes: Array.isArray(node.expandedScenes) ? node.expandedScenes : [],
      completed: false,
    }));

    const finalNodes = appendMode === 'append' ? [...story.outlineNodes, ...newNodes] : newNodes;

    onUpdateStory({
      ...story,
      pitch: generatedPlotData.expandedPitch || story.pitch,
      targetTone: generatedPlotData.recommendedTone || selectedStyle || story.targetTone,
      genres: generatedPlotData.suggestedGenres?.length ? generatedPlotData.suggestedGenres : story.genres,
      outlineNodes: finalNodes,
      worldRules: {
        ...story.worldRules,
        setting: generatedPlotData.worldSettingHint || story.worldRules.setting,
      },
      updatedAt: new Date().toISOString(),
    });

    setIsPlotBuilderOpen(false);
    alert(`🎉 Đã tự động xây dựng và mở rộng ${newNodes.length} mốc dàn ý cốt truyện mới vào tác phẩm!`);
  };

  // Auto expand single node idea with AI
  const handleAutoExpandNode = async (node: OutlineNode) => {
    setExpandingNodeId(node.id);
    try {
      const response = await fetch('/api/ai/expand-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeConcept: node.title,
          contextStory: story,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const expanded = resData.data;
        const updatedNodes = story.outlineNodes.map((n) =>
          n.id === node.id
            ? {
                ...n,
                title: expanded.title || n.title,
                description: expanded.description || n.description,
                expandedScenes: expanded.scenes || n.expandedScenes,
              }
            : n
        );
        onUpdateStory({
          ...story,
          outlineNodes: updatedNodes,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Error expanding node:', e);
    } finally {
      setExpandingNodeId(null);
    }
  };

  const handleAddNode = () => {
    if (!autoExpandInput.trim()) return;
    const newNode: OutlineNode = {
      id: `node-${Date.now()}`,
      title: autoExpandInput.trim(),
      description: 'Mốc câu chuyện mới. Nhấn "AI Mở Rộng" để tạo phân cảnh chi tiết.',
      expandedScenes: [],
      completed: false,
    };
    onUpdateStory({
      ...story,
      outlineNodes: [...story.outlineNodes, newNode],
      updatedAt: new Date().toISOString(),
    });
    setAutoExpandInput('');
  };

  // Add new quick milestone and auto-expand with AI
  const handleAddAndExpandNode = async () => {
    if (!autoExpandInput.trim()) return;
    setAutoExpanding(true);

    try {
      const response = await fetch('/api/ai/expand-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeConcept: autoExpandInput,
          contextStory: story,
        }),
      });

      const resData = await response.json();
      const expanded = resData.data || {};

      const newNode: OutlineNode = {
        id: `node-${Date.now()}`,
        title: expanded.title || autoExpandInput,
        description: expanded.description || `Chi tiết diễn biến mốc ${autoExpandInput}`,
        expandedScenes: expanded.scenes || [
          `Khám phá tình tiết ${autoExpandInput}`,
          `Xung đột kịch tính xảy ra`,
          `Giải quyết hậu quả và tiếp tục hành trình`,
        ],
        completed: false,
      };

      onUpdateStory({
        ...story,
        outlineNodes: [...story.outlineNodes, newNode],
        updatedAt: new Date().toISOString(),
      });

      setAutoExpandInput('');
    } catch (err) {
      console.error('Failed to add and expand node:', err);
    } finally {
      setAutoExpanding(false);
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    const updated = story.outlineNodes.filter((n) => n.id !== nodeId);
    onUpdateStory({
      ...story,
      outlineNodes: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const toggleNodeCompletion = (nodeId: string) => {
    const updated = story.outlineNodes.map((n) =>
      n.id === nodeId ? { ...n, completed: !n.completed } : n
    );
    onUpdateStory({
      ...story,
      outlineNodes: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" /> DÀN Ý & CÁC MỐC CỐT TRUYỆN
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Xây Dựng & Tự Động Mở Rộng Dàn Ý</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Viết tóm tắt ý tưởng, chọn văn phong và để AI tự động cấu trúc toàn bộ dàn ý phân cảnh kịch tính.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              setSummaryInput(story.pitch || '');
              setIsPlotBuilderOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all group"
          >
            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>AI Kiến Trúc Cốt Truyện & Mở Rộng Dàn Ý</span>
          </button>
        </div>
      </div>

      {/* Story Summary, Revision History & Plot Editor Bar */}
      <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="space-y-1 flex-1">
            <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> Tóm Tắt Cốt Truyện Tác Phẩm:
            </span>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {story.pitch || 'Chưa có tóm tắt cốt truyện. Nhấn "Sửa Cốt Truyện" để thêm ý tưởng.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {story.targetTone && (
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 font-medium border border-amber-500/30">
                🎭 {story.targetTone}
              </span>
            )}

            <button
              onClick={() => {
                setEditedPitchText(story.pitch || '');
                setEditedToneText(story.targetTone || '');
                setIsEditingPitchInline(!isEditingPitchInline);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditingPitchInline ? 'Đóng Trình Sửa' : 'Sửa Cốt Truyện'}</span>
            </button>

            {story.plotRevisions && story.plotRevisions.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                <span>Lịch Sử Sửa ({story.plotRevisions.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Inline Expandable Plot Editor */}
        {isEditingPitchInline && (
          <div className="pt-3 border-t border-amber-500/20 space-y-3 animate-in fade-in duration-200">
            <div>
              <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1">
                ✏️ Chỉnh sửa / Thay đổi Tóm tắt Cốt truyện hiện tại:
              </label>
              <textarea
                rows={4}
                value={editedPitchText}
                onChange={(e) => setEditedPitchText(e.target.value)}
                placeholder="Nhập tóm tắt cốt truyện mới hoặc chỉnh sửa hướng đi câu chuyện tại đây..."
                className="w-full bg-white dark:bg-[#0A0A0B] border border-amber-500/30 rounded-lg p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 shrink-0">Tông giọng/Văn phong:</span>
                <input
                  type="text"
                  value={editedToneText}
                  onChange={(e) => setEditedToneText(e.target.value)}
                  placeholder="Kịch tính, u uất, hào hùng..."
                  className="bg-white dark:bg-[#0A0A0B] border border-amber-500/30 rounded-md px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSaveInlinePitch}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> Chỉ Lưu Tóm Tắt
                </button>

                <button
                  onClick={() => setIsRealignModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Wand2 className="w-4 h-4 text-amber-300" />
                  <span>Tái Cấu Trúc Truyện & Viết Lại Các Chương Theo Cốt Truyện Sửa Đổi</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plot Revisions History List */}
        {showHistory && story.plotRevisions && story.plotRevisions.length > 0 && (
          <div className="pt-3 border-t border-amber-500/20 space-y-2 animate-in fade-in duration-200">
            <h4 className="font-bold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Lịch Sử Các Bản Sửa Đổi Cốt Truyện Đã Lưu:
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {story.plotRevisions.map((rev) => (
                <div
                  key={rev.id}
                  className="p-2.5 rounded-lg bg-white/80 dark:bg-[#0A0A0B]/80 border border-amber-500/20 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-800 dark:text-amber-300">{rev.versionName}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 italic line-clamp-1">{rev.pitch}</p>
                    {rev.adaptationNotes && (
                      <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                        💡 Ghi chú: {rev.adaptationNotes}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleRestoreRevision(rev)}
                    className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 text-[10px] font-semibold transition-colors shrink-0"
                  >
                    Khôi Phục Bản Này
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Quick Node Generator Input */}
      <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
        <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          ✨ Thêm mốc dàn ý ngắn & Nhờ AI mở rộng tức thì:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={autoExpandInput}
            onChange={(e) => setAutoExpandInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddAndExpandNode()}
            placeholder="Ví dụ: 'Bầy ong sát thủ', 'Phát hiện hang bọ cạp', 'Tìm thấy đền thờ cổ'..."
            className="flex-1 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-md px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            disabled={autoExpanding || !autoExpandInput.trim()}
            onClick={handleAddAndExpandNode}
            className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-all shrink-0"
          >
            {autoExpanding ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang mở rộng...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> AI Mở Rộng Mốc
              </>
            )}
          </button>
        </div>
      </div>

      {/* Outline Milestones List */}
      <div className="space-y-3.5">
        {story.outlineNodes.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-xs text-slate-500 space-y-3">
            <Layers className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
            <p className="font-medium text-slate-700 dark:text-slate-300">Chưa có mốc dàn ý nào trong tác phẩm.</p>
            <p className="text-slate-500 max-w-md mx-auto">
              Hãy bấm vào nút <strong className="text-emerald-600 dark:text-emerald-400">"AI Kiến Trúc Cốt Truyện & Mở Rộng Dàn Ý"</strong> ở trên để nhập tóm tắt ý tưởng và tự động sinh toàn bộ dàn ý chương!
            </p>
          </div>
        ) : (
          story.outlineNodes.map((node, index) => {
            const isExpanding = expandingNodeId === node.id;

            if (editingNodeId === node.id) {
              return (
                <div
                  key={node.id}
                  className="bg-white dark:bg-[#0F0F12] border-2 border-emerald-500 rounded-xl p-4 sm:p-5 shadow-lg space-y-4 animate-in fade-in duration-200"
                >
                  {/* Editor Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                        ✏️ Sửa Mốc {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Chỉnh sửa Tên, Mô tả mốc, Thêm/Xóa Cảnh & Tình Tiết
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => setEditingNodeId(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSaveEditedNode}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" /> Lưu Mốc & Cảnh
                      </button>
                    </div>
                  </div>

                  {/* Title & Description Fields */}
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                        Tên mốc câu chuyện:
                      </label>
                      <input
                        type="text"
                        value={editNodeTitle}
                        onChange={(e) => setEditNodeTitle(e.target.value)}
                        placeholder="Nhập tên mốc..."
                        className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                        Mô tả diễn biến mốc:
                      </label>
                      <textarea
                        rows={2}
                        value={editNodeDesc}
                        onChange={(e) => setEditNodeDesc(e.target.value)}
                        placeholder="Mô tả tóm tắt sự kiện mốc này..."
                        className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Scenes List Editor */}
                  <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>🎬</span> Danh Sách Phân Cảnh ({editScenes.length}):
                      </label>
                      <span className="text-[10px] text-slate-500">
                        Thêm cảnh mới, xóa cảnh hoặc thêm tình tiết chi tiết vào từng cảnh.
                      </span>
                    </div>

                    {editScenes.map((scene, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800 space-y-3"
                      >
                        {/* Scene Title & Action Row */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold shrink-0 mt-0.5">
                            Cảnh {sIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={scene.title}
                            onChange={(e) => handleUpdateSceneTitle(sIdx, e.target.value)}
                            placeholder="Tên hoặc tóm tắt diễn biến cảnh..."
                            className="flex-1 bg-white dark:bg-[#121215] border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={sIdx === 0}
                              onClick={() => handleMoveScene(sIdx, 'up')}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30"
                              title="Di chuyển cảnh lên"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={sIdx === editScenes.length - 1}
                              onClick={() => handleMoveScene(sIdx, 'down')}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30"
                              title="Di chuyển cảnh xuống"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSceneFromEditor(sIdx)}
                              className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                              title="Xóa cảnh này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Sub-details / Tình tiết List */}
                        <div className="pl-3 sm:pl-6 border-l-2 border-emerald-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                              📌 Tình tiết chi tiết trong Cảnh {sIdx + 1}:
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveAddingDetailSceneIdx(activeAddingDetailSceneIdx === sIdx ? null : sIdx);
                                setNewDetailInput('');
                              }}
                              className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-500/20 transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Thêm tình tiết vào cảnh này
                            </button>
                          </div>

                          {scene.details.length > 0 ? (
                            <ul className="space-y-1.5">
                              {scene.details.map((detail, dIdx) => (
                                <li
                                  key={dIdx}
                                  className="flex items-center justify-between gap-2 bg-white dark:bg-[#121215] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-emerald-500 font-bold shrink-0">•</span>
                                    <input
                                      type="text"
                                      value={detail}
                                      onChange={(e) => {
                                        const updatedDetails = [...scene.details];
                                        updatedDetails[dIdx] = e.target.value;
                                        setEditScenes(
                                          editScenes.map((s, idx) =>
                                            idx === sIdx ? { ...s, details: updatedDetails } : s
                                          )
                                        );
                                      }}
                                      className="w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-xs text-slate-800 dark:text-slate-200"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDetailFromScene(sIdx, dIdx)}
                                    className="text-slate-400 hover:text-rose-500 p-0.5 shrink-0"
                                    title="Xóa tình tiết này"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">
                              Chưa có tình tiết nhỏ. Bấm "+ Thêm tình tiết vào cảnh này" để diễn giải chi tiết hơn.
                            </p>
                          )}

                          {/* Input row for adding detail to scene sIdx */}
                          {activeAddingDetailSceneIdx === sIdx && (
                            <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
                              <input
                                type="text"
                                value={newDetailInput}
                                onChange={(e) => setNewDetailInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddDetailToScene(sIdx)}
                                placeholder="Nhập tình tiết diễn biến cụ thể (Ví dụ: 'Nhặt được nhẫn bí ẩn', 'Thù hận bộc phát')..."
                                className="flex-1 bg-white dark:bg-[#121215] border border-emerald-500/50 rounded-md px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleAddDetailToScene(sIdx)}
                                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shrink-0"
                              >
                                Thêm Tình Tiết
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveAddingDetailSceneIdx(null)}
                                className="px-2.5 py-1.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs shrink-0"
                              >
                                Hủy
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add New Scene Input Row */}
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-dashed border-emerald-500/30 flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        value={newSceneInput}
                        onChange={(e) => setNewSceneInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSceneToEditor()}
                        placeholder="Nhập tên cảnh mới cần thêm vào mốc này (Ví dụ: 'Tiến vào thung lũng bí ẩn')..."
                        className="flex-1 w-full bg-white dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddSceneToEditor}
                        disabled={!newSceneInput.trim()}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Thêm Cảnh Mới
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            const parsedScenes = parseExpandedScenes(node.expandedScenes || []);

            return (
              <div
                key={node.id}
                className={`bg-white dark:bg-[#0F0F12] border rounded-xl p-4 shadow-xs transition-all relative overflow-hidden ${
                  node.completed ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={() => toggleNodeCompletion(node.id)}
                      className={`mt-0.5 shrink-0 transition-colors ${
                        node.completed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-400'
                      }`}
                      title="Đánh dấu hoàn thành"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                          Mốc {index + 1}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white break-words min-w-0 leading-snug">
                          {node.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 break-words leading-relaxed">{node.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1 sm:pt-0">
                    <button
                      onClick={() => handleStartEditNode(node)}
                      className="px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Chỉnh sửa tên mốc, mô tả, thêm/xóa cảnh và tình tiết"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-500" /> Sửa Mốc & Cảnh
                    </button>

                    <button
                      onClick={() => handleAutoExpandNode(node)}
                      disabled={isExpanding}
                      className="px-2.5 py-1.5 rounded bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Yêu cầu AI phân tích và phát triển lại phân cảnh cho mốc này"
                    >
                      {isExpanding ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mở Rộng...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" /> AI Mở Rộng
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onSelectNodeForChapter(node, index)}
                      className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1 shadow-xs transition-all whitespace-nowrap"
                    >
                      Viết Chương <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteNode(node.id)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Xóa mốc"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Scenes Sub-list View */}
                {parsedScenes && parsedScenes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0A0A0B] -mx-4 -mb-4 p-4 rounded-b-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🎬</span> Các Phân Cảnh & Tình Tiết Trong Mốc Này:
                      </h4>
                      <button
                        onClick={() => handleStartEditNode(node)}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Thêm / Sửa Cảnh & Tình Tiết
                      </button>
                    </div>

                    <div className="space-y-2">
                      {parsedScenes.map((sceneObj, sIdx) => (
                        <div
                          key={sIdx}
                          className="bg-white dark:bg-[#0F0F12] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                              <span className="text-emerald-600 dark:text-emerald-400 shrink-0">{sIdx + 1}.</span>
                              <span>{sceneObj.title}</span>
                            </div>
                            <button
                              onClick={() => handleStartEditNode(node, sIdx)}
                              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 px-1.5 py-0.5 rounded transition-colors shrink-0 flex items-center gap-0.5"
                              title="Thêm tình tiết cho cảnh này"
                            >
                              <Plus className="w-3 h-3" /> Tình tiết
                            </button>
                          </div>

                          {sceneObj.details && sceneObj.details.length > 0 && (
                            <ul className="pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-400 border-l-2 border-emerald-500/20 ml-1.5">
                              {sceneObj.details.map((det, dIdx) => (
                                <li key={dIdx} className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 font-bold">•</span>
                                  <span>{det}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Plot & Outline Builder Modal */}
      {isPlotBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 dark:bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative text-slate-900 dark:text-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0A0A0B]/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                  <Wand2 className="w-5 h-5 text-emerald-500 dark:text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    AI Kiến Trúc Cốt Truyện & Mở Rộng Dàn Ý
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                      Tự động hóa 100%
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Nhập tóm tắt ý tưởng ban đầu, chọn văn phong mong muốn và để AI tự động phát triển dàn ý chi tiết.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPlotBuilderOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {/* Step 1: Summary / Plot Vision */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  1. Viết Tóm Tắt / Ý Tưởng Toàn Bộ Câu Chuyện Bạn Định Xây Dựng:
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mô tả vắn tắt nhân vật chính, biến cố khởi đầu, mối thù hoặc mục tiêu chính, các nút thắt lớn bạn muốn xảy ra trong tác phẩm.
                </p>
                <textarea
                  rows={4}
                  value={summaryInput}
                  onChange={(e) => setSummaryInput(e.target.value)}
                  placeholder="Ví dụ: Nam chính là phế vật của gia tộc, vô tình nhặt được nhẫn cổ chứa tàn hồn cường giả. Cậu quyết tâm rèn luyện, báo thù kẻ đính hôn hủy ước, khám phá ra âm mưu diệt tộc của Ma Tông..."
                  className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 leading-relaxed transition-all"
                />

                {/* Quick Sample Prompts */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="font-medium text-slate-600 dark:text-slate-400">Gợi ý mẫu:</span>
                  {[
                    'Trọng sinh báo thù gia tộc',
                    'Tiên hiệp nhặt được bảo vật',
                    'Trinh thám vụ án bí ẩn phòng kín',
                    'Ngôn tình gương vỡ lại lành',
                    'Huyền huyễn xuyên không hệ thống',
                  ].map((sample, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => setSummaryInput((prev) => (prev ? `${prev}. ${sample}` : sample))}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      + {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Writing Style & Tone */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Feather className="w-4 h-4 text-purple-500" />
                  2. Chọn Văn Phong & Tông Giọng Viết Cần Thể Hiện:
                </label>

                {/* Style Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {STYLE_PRESETS.map((style) => {
                    const isSelected = selectedStyle === style.name && !customStyleInput.trim();
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => {
                          setSelectedStyle(style.name);
                          setCustomStyleInput('');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-1 ${
                          isSelected
                            ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-500 text-purple-900 dark:text-purple-200 shadow-sm ring-1 ring-purple-500/30'
                            : 'bg-slate-50/50 dark:bg-[#0A0A0B]/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base">{style.icon}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-bold block">{style.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                          {style.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom style option */}
                <div className="mt-2">
                  <input
                    type="text"
                    value={customStyleInput}
                    onChange={(e) => setCustomStyleInput(e.target.value)}
                    placeholder="Hoặc tự nhập văn phong riêng (Ví dụ: 'Văn phong hào hùng kiêu hãnh kiểu Kim Dung, miêu tả võ học kịch tính')..."
                    className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Step 3: Options (Detail level & Append mode) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-100/70 dark:bg-[#141418] border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    📊 Độ chi tiết dàn ý:
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailLevel('standard')}
                      className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                        detailLevel === 'standard'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Tiêu chuẩn (5-8 Mốc)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailLevel('deep')}
                      className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                        detailLevel === 'deep'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Chuyên sâu (8-14 Mốc)
                    </button>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    🔄 Chế độ cập nhật dàn ý:
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAppendMode('replace')}
                      className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                        appendMode === 'replace'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Thay thế toàn bộ dàn ý cũ
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppendMode('append')}
                      className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                        appendMode === 'append'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Nối tiếp vào sau dàn ý cũ
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  disabled={isBuildingPlot || !summaryInput.trim()}
                  onClick={handleBuildStoryOutline}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
                >
                  {isBuildingPlot ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI đang phân tích mạch truyện & kiến tạo toàn bộ dàn ý...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>BẮT ĐẦU TỰ ĐỘNG XÂY DỰNG & MỞ RỘNG DÀN Ý CỐT TRUYỆN</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Output */}
              {plotError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                  ⚠️ {plotError}
                </div>
              )}

              {/* Generated Plot Result Preview */}
              {generatedPlotData && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-300">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                    <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      Tóm Tắt Cốt Truyện Mở Rộng Đã Hoàn Thiện:
                    </h4>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                      {generatedPlotData.expandedPitch}
                    </p>
                    {generatedPlotData.recommendedTone && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                        ✨ Tông giọng khuyến nghị: <strong>{generatedPlotData.recommendedTone}</strong>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Dàn Ý {generatedPlotData.outlineNodes?.length || 0} Mốc Sự Kiện AI Đã Tạo:</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                        Mỗi mốc đi kèm 3-5 phân cảnh chi tiết
                      </span>
                    </h4>

                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {generatedPlotData.outlineNodes?.map((node: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                              Mốc {idx + 1}
                            </span>
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white">{node.title}</h5>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{node.description}</p>

                          {node.expandedScenes && node.expandedScenes.length > 0 && (
                            <div className="pl-3 border-l-2 border-emerald-500/30 space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                              {node.expandedScenes.map((sc: string, sIdx: number) => (
                                <div key={sIdx} className="flex items-start gap-1">
                                  <span className="text-emerald-500 font-semibold">•</span>
                                  <span>{sc}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0A0A0B]/50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 hidden sm:inline">
                {generatedPlotData
                  ? `Đã tạo ${generatedPlotData.outlineNodes?.length || 0} mốc dàn ý. Sẵn sàng áp dụng.`
                  : 'Nhấn Bắt đầu để AI xây dựng dàn ý.'}
              </span>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setIsPlotBuilderOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                >
                  Đóng
                </button>
                <button
                  disabled={!generatedPlotData}
                  onClick={handleApplyGeneratedPlot}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Áp Dụng Dàn Ý & Cốt Truyện Mới Vào Tác Phẩm</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* AI Plot Re-alignment & Chapter Adaptation Modal */}
      {isRealignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-purple-900/20 via-indigo-900/20 to-slate-900/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Tái Cấu Trúc Cốt Truyện & Viết Lại Các Chương</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[10px] uppercase font-bold">
                      AI Story Engine
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Hệ thống sẽ tự động phân tích sự thay đổi trong Tóm tắt Cốt truyện, cập nhật lại dàn ý và viết lại các chương đã có theo hướng đi mới.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsRealignModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Pitch Comparison Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider block">
                    📌 Tóm Tắt Cũ Ban Đầu:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                    {story.pitch || 'Chưa có tóm tắt cũ'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1">
                  <span className="font-bold text-purple-700 dark:text-purple-300 text-[11px] uppercase tracking-wider block flex items-center gap-1">
                    <Edit2 className="w-3 h-3" /> Tóm Tắt Mới Tác Giả Sửa Đổi:
                  </span>
                  <p className="text-slate-900 dark:text-white font-medium leading-relaxed">
                    {editedPitchText || story.pitch}
                  </p>
                </div>
              </div>

              {/* Settings Toggle */}
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-indigo-900 dark:text-indigo-200 block text-xs">
                    📖 Viết lại toàn bộ {story.chapters.length} chương đã viết theo cốt truyện mới:
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Dù các chương đã được sáng tác từ trước, AI sẽ tái kiến thiết và viết lại nội dung văn bản từng chương để phản ánh chính xác các biến chuyển cốt truyện mới.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={recreateChapters}
                    onChange={(e) => setRecreateChapters(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Action Button */}
              <div>
                <button
                  disabled={isRealigning || (!editedPitchText.trim() && !story.pitch)}
                  onClick={handleRealignPlot}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
                >
                  {isRealigning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>AI Đang Phân Tích Chuyển Biến Logic & Tái Viết Lại {story.chapters.length} Chương...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-amber-300" />
                      <span>BẮT ĐẦU TÁI CẤU TRÚC LOGIC & VIẾT LẠI CÁC CHƯƠNG</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Output */}
              {realignError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                  ⚠️ {realignError}
                </div>
              )}

              {/* Results Preview */}
              {realignedData && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-300">
                  {/* Expanded Pitch */}
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                    <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      1. Tóm Tắt Cốt Truyện Mới Đã Chau Chuốt Chi Tiết:
                    </h4>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {realignedData.expandedPitch}
                    </p>
                  </div>

                  {/* Adaptation Logic Notes */}
                  {realignedData.adaptationNotes && (
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1">
                      <h4 className="font-bold text-xs text-purple-800 dark:text-purple-300 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        2. Phân Tích Chuyển Biến Logic & Nút Thắt Thay Đổi:
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {realignedData.adaptationNotes}
                      </p>
                    </div>
                  )}

                  {/* Adapted Outline Nodes */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>3. Dàn Ý Mốc Sự Kiện Mới ({realignedData.adaptedOutlineNodes?.length || 0} mốc):</span>
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {realignedData.adaptedOutlineNodes?.map((n: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800">
                          <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                            Mốc {idx + 1}: {n.title}
                          </span>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">{n.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Adapted Chapters Preview */}
                  {realignedData.adaptedChapters && realignedData.adaptedChapters.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>4. {realignedData.adaptedChapters.length} Chương Đã Được Viết Lại Toàn Bộ Theo Cốt Truyện Mới:</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                          Đã tự động tái kiến thiết văn bản
                        </span>
                      </h4>

                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {realignedData.adaptedChapters.map((chap: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                                Chương {chap.chapterNumber || idx + 1}: {chap.title}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {(chap.content || '').trim().split(/\s+/).filter(Boolean).length} từ
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                              Tóm tắt: {chap.summary || 'Chương đã được tái kiến thiết toàn bộ.'}
                            </p>
                            <div className="p-2 rounded bg-white dark:bg-[#141418] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 max-h-24 overflow-y-auto leading-relaxed">
                              {chap.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer with Options */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0A0A0B]/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500 hidden sm:inline">
                {realignedData
                  ? 'Chọn "Cập Nhật" hoặc "Tạo Quyển Mới" để áp dụng.'
                  : 'Sẵn sàng tái cấu trúc cốt truyện tác phẩm.'}
              </span>

              <div className="flex flex-wrap items-center gap-2 ml-auto w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsRealignModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                >
                  Đóng
                </button>

                <button
                  disabled={!realignedData}
                  onClick={() => handleApplyRealignedPlot('fork')}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                >
                  <GitFork className="w-4 h-4" />
                  <span>Lưu Thành Quyển Mới (Phiên Bản B)</span>
                </button>

                <button
                  disabled={!realignedData}
                  onClick={() => handleApplyRealignedPlot('update')}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Cập Nhật Trực Tiếp Vào Truyện Hiện Tại</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

