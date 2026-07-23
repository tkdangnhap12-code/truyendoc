import React, { useState } from 'react';
import { Story, WorldRules, TimelineEvent } from '../../types';
import { BookOpen, Globe, ShieldAlert, Clock, Plus, Trash2, Edit2, Save, Sparkles } from 'lucide-react';

interface StoryMemoryViewerProps {
  story: Story;
  onUpdateStory: (updatedStory: Story) => void;
}

export const StoryMemoryViewer: React.FC<StoryMemoryViewerProps> = ({ story, onUpdateStory }) => {
  const [worldRules, setWorldRules] = useState<WorldRules>(
    story.worldRules || { setting: '', magicOrTech: '', historyAndFactions: '' }
  );
  const [isEditingRules, setIsEditingRules] = useState(false);
  const [newDayInput, setNewDayInput] = useState('');
  const [newEventInput, setNewEventInput] = useState('');

  const handleSaveRules = () => {
    onUpdateStory({
      ...story,
      worldRules,
      updatedAt: new Date().toISOString(),
    });
    setIsEditingRules(false);
  };

  const handleAddTimelineEvent = () => {
    if (!newEventInput.trim()) return;
    const newTl: TimelineEvent = {
      id: `tl-${Date.now()}`,
      day: newDayInput.trim() || `Ngày ${story.timeline.length + 1}`,
      event: newEventInput.trim(),
    };

    onUpdateStory({
      ...story,
      timeline: [...story.timeline, newTl],
      updatedAt: new Date().toISOString(),
    });

    setNewDayInput('');
    setNewEventInput('');
  };

  const handleDeleteTimeline = (id: string) => {
    const updated = story.timeline.filter((t) => t.id !== id);
    onUpdateStory({
      ...story,
      timeline: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" /> STORY BIBLE & TIMELINE MEMORY
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Thế Giới Truyện & Dòng Thời Gian</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cấu trúc thế giới, luật pháp, sức mạnh và mốc thời gian. AI luôn tham chiếu khi viết chương mới.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-md text-emerald-700 dark:text-emerald-400 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-600 dark:text-emerald-400" /> Tự Động Cập Nhật Sau Mỗi Chương
        </div>
      </div>

      {/* World Rules & Story Bible */}
      <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Story Bible - Quy Tắc Thế Giới
          </h3>

          {isEditingRules ? (
            <button
              onClick={handleSaveRules}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" /> Lưu Quy Tắc
            </button>
          ) : (
            <button
              onClick={() => setIsEditingRules(true)}
              className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-700/60"
            >
              <Edit2 className="w-3.5 h-3.5" /> Chỉnh Sửa
            </button>
          )}
        </div>

        {isEditingRules ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Bối cảnh thế giới & Địa lý</label>
              <textarea
                rows={3}
                value={worldRules.setting}
                onChange={(e) => setWorldRules({ ...worldRules, setting: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-md p-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hệ thống Sức mạnh / Phép thuật / Công nghệ
              </label>
              <textarea
                rows={3}
                value={worldRules.magicOrTech}
                onChange={(e) => setWorldRules({ ...worldRules, magicOrTech: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-md p-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Lịch sử & Các Phe phái/Chủng tộc</label>
              <textarea
                rows={3}
                value={worldRules.historyAndFactions}
                onChange={(e) => setWorldRules({ ...worldRules, historyAndFactions: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-md p-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800 p-3.5 rounded-lg space-y-1.5">
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">🗺️ Bối Cảnh & Địa Lý</span>
              <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed">{worldRules.setting || 'Chưa thiết lập'}</p>
            </div>

            <div className="bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800 p-3.5 rounded-lg space-y-1.5">
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">✨ Hệ Thống Phép Thuật / Sức Mạnh</span>
              <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed">{worldRules.magicOrTech || 'Chưa thiết lập'}</p>
            </div>

            <div className="bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800 p-3.5 rounded-lg space-y-1.5">
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">👑 Lịch Sử & Các Phe Phái</span>
              <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed">{worldRules.historyAndFactions || 'Chưa thiết lập'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Event Log */}
      <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Dòng Thời Gian & Nhật Ký Sự Kiện (Timeline)
        </h3>

        {/* Input New Timeline Event */}
        <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 dark:bg-[#0A0A0B] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <input
            type="text"
            value={newDayInput}
            onChange={(e) => setNewDayInput(e.target.value)}
            placeholder="Mốc thời gian (VD: Ngày 3)..."
            className="w-full sm:w-40 bg-white dark:bg-[#0F0F12] border border-slate-300 dark:border-slate-800 rounded p-2 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 transition-colors"
          />
          <input
            type="text"
            value={newEventInput}
            onChange={(e) => setNewEventInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTimelineEvent()}
            placeholder="Mô tả sự kiện diễn ra..."
            className="flex-1 bg-white dark:bg-[#0F0F12] border border-slate-300 dark:border-slate-800 rounded p-2 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            onClick={handleAddTimelineEvent}
            disabled={!newEventInput.trim()}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs flex items-center justify-center gap-1 shrink-0 disabled:opacity-50 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Mốc
          </button>
        </div>

        {/* Timeline List */}
        <div className="space-y-2.5 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 pt-1">
          {story.timeline.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-500">Chưa có mốc thời gian nào được ghi lại.</p>
          ) : (
            story.timeline.map((tl) => (
              <div key={tl.id} className="relative pl-8 flex items-start justify-between group bg-slate-50 dark:bg-[#0A0A0B] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                <div className="absolute left-2.5 top-3.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0F0F12]"></div>
                <div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">{tl.day}</span>
                  <p className="text-xs text-slate-800 dark:text-slate-300 mt-0.5">{tl.event}</p>
                </div>
                <button
                  onClick={() => handleDeleteTimeline(tl.id)}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
