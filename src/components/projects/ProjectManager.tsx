import React, { useState } from 'react';
import { Story } from '../../types';
import { TrashedStory } from '../../lib/storage';
import {
  FolderKanban,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Play,
  BookOpen,
  FolderOpen,
  Save,
  CheckCircle2,
  Clock,
  Search,
  Check,
  RotateCcw,
  Archive,
  ArchiveRestore,
} from 'lucide-react';

interface ProjectManagerProps {
  stories: Story[];
  trashedStories?: TrashedStory[];
  activeStoryId: string | null;
  onSelectStory: (id: string) => void;
  onOpenNewStoryModal: () => void;
  onDeleteStory: (id: string) => void;
  onDuplicateStory: (story: Story) => void;
  onUpdateStory: (story: Story) => void;
  onSaveProjectJson: (story?: Story) => void;
  onOpenProjectJson: () => void;
  onSaveAllProjectsJson: () => void;
  onRestoreStory?: (id: string) => void;
  onPermanentlyDeleteTrash?: (id: string) => void;
  onEmptyTrash?: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  stories,
  trashedStories = [],
  activeStoryId,
  onSelectStory,
  onOpenNewStoryModal,
  onDeleteStory,
  onDuplicateStory,
  onUpdateStory,
  onSaveProjectJson,
  onOpenProjectJson,
  onSaveAllProjectsJson,
  onRestoreStory,
  onPermanentlyDeleteTrash,
  onEmptyTrash,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'ongoing' | 'completed' | 'trash'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const startRename = (story: Story) => {
    setEditingId(story.id);
    setEditedTitle(story.title);
  };

  const saveRename = (story: Story) => {
    if (!editedTitle.trim()) return;
    onUpdateStory({ ...story, title: editedTitle.trim(), updatedAt: new Date().toISOString() });
    setEditingId(null);
  };

  const handleToggleStatus = (story: Story) => {
    const newStatus = story.status === 'completed' ? 'ongoing' : 'completed';
    onUpdateStory({
      ...story,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  // Counts
  const ongoingCount = stories.filter((s) => s.status !== 'completed').length;
  const completedCount = stories.filter((s) => s.status === 'completed').length;
  const trashCount = trashedStories.length;

  // Filtering
  const filteredStories = stories.filter((story) => {
    const isCompleted = story.status === 'completed';
    if (activeFilter === 'ongoing' && isCompleted) return false;
    if (activeFilter === 'completed' && !isCompleted) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = story.title.toLowerCase().includes(q);
      const matchAuthor = (story.author || '').toLowerCase().includes(q);
      const matchPitch = (story.pitch || '').toLowerCase().includes(q);
      const matchGenre = story.genres.some((g) => g.toLowerCase().includes(q));
      return matchTitle || matchAuthor || matchPitch || matchGenre;
    }

    return true;
  });

  const filteredTrashedStories = trashedStories.filter((story) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = story.title.toLowerCase().includes(q);
      const matchAuthor = (story.author || '').toLowerCase().includes(q);
      const matchGenre = story.genres.some((g) => g.toLowerCase().includes(q));
      return matchTitle || matchAuthor || matchGenre;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors">
        <div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] uppercase tracking-wider mb-0.5">
            <FolderKanban className="w-3.5 h-3.5" /> THƯ VIỆN & DỰ ÁN TRUYỆN
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thư Viện Tác Phẩm</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Lưu trữ danh sách các tác phẩm đang sáng tác và truyện đã hoàn thành.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={onOpenProjectJson}
            className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700/80 font-medium text-xs flex items-center gap-1 shadow-xs transition-all"
            title="Mở file dự án (.json) từ máy tính để viết tiếp"
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Mở File Dự Án
          </button>
          <button
            onClick={onSaveAllProjectsJson}
            className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700/80 font-medium text-xs flex items-center gap-1 shadow-xs transition-all"
            title="Tải về file sao lưu chứa tất cả dự án truyện"
          >
            <Save className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Sao Lưu
          </button>
          <button
            onClick={onOpenNewStoryModal}
            className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Tạo Bộ Truyện Mới
          </button>
        </div>
      </div>

      {/* Navigation Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 transition-colors">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 text-xs ${
              activeFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'bg-slate-100 dark:bg-[#131318] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            <FolderKanban className="w-3 h-3" />
            <span>Tất Cả</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-black/30 text-slate-700 dark:text-white/90">
              {stories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('ongoing')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 text-xs ${
              activeFilter === 'ongoing'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'bg-slate-100 dark:bg-[#131318] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Clock className="w-3 h-3 text-amber-500 dark:text-amber-300" />
            <span>Đang Viết</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-black/30 text-slate-700 dark:text-white/90">
              {ongoingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 text-xs ${
              activeFilter === 'completed'
                ? 'bg-purple-600 text-white shadow-xs font-semibold'
                : 'bg-slate-100 dark:bg-[#131318] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-purple-500 dark:text-purple-300" />
            <span>Đã Hoàn Thành</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-black/30 text-slate-700 dark:text-white/90">
              {completedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('trash')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 text-xs ${
              activeFilter === 'trash'
                ? 'bg-rose-600 text-white shadow-xs font-semibold'
                : 'bg-slate-100 dark:bg-[#131318] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Trash2 className="w-3 h-3 text-rose-500 dark:text-rose-300" />
            <span>Thùng Rác</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-black/30 text-slate-700 dark:text-white/90">
              {trashCount}
            </span>
          </button>
        </div>

        {/* Search & Empty Trash Bar */}
        <div className="flex items-center gap-2">
          {activeFilter === 'trash' && trashCount > 0 && onEmptyTrash && (
            <button
              onClick={onEmptyTrash}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-medium flex items-center gap-1 transition-all shrink-0"
              title="Xóa sạch toàn bộ bộ truyện trong Thùng Rác"
            >
              <Trash2 className="w-3 h-3" /> Dọn Sạch Thùng Rác
            </button>
          )}

          <div className="relative min-w-[180px]">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên truyện, thể loại..."
              className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Grid of Projects / Trash Items */}
      {activeFilter === 'trash' ? (
        filteredTrashedStories.length === 0 ? (
          <div className="p-8 bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-2">
            <Archive className="w-6 h-6 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Thùng Rác Đang Trống</p>
            <p className="text-[11px] text-slate-500">
              Các bộ truyện khi chọn "Chuyển Vào Thùng Rác" sẽ được lưu trữ tại đây để bạn có thể khôi phục lại bất cứ lúc nào.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {filteredTrashedStories.map((story) => {
              const totalWords = story.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
              const deletedDateStr = story.deletedAt ? new Date(story.deletedAt).toLocaleDateString('vi-VN') : '';

              return (
                <div
                  key={story.id}
                  className="bg-white dark:bg-[#0F0F12] border border-rose-300 dark:border-rose-900/50 rounded-lg p-2.5 shadow-2xs transition-all flex flex-col justify-between space-y-1.5 relative"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span className="px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-medium text-[9px] truncate">
                        Đã xóa {deletedDateStr}
                      </span>
                      <span className="text-slate-400 text-[10px] truncate">{story.genres[0] || 'Truyện'}</span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight" title={story.title}>
                        {story.title}
                      </h3>
                      {story.author && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">TG: {story.author}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#070709] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800/60 truncate">
                      <span>{story.chapters.length} ch.</span>
                      <span className="text-slate-400 dark:text-slate-600">•</span>
                      <span>{totalWords.toLocaleString()} từ</span>
                    </div>
                  </div>

                  {/* Trash Action buttons */}
                  <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-200 dark:border-slate-800/60 mt-1">
                    <button
                      onClick={() => onRestoreStory && onRestoreStory(story.id)}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[10px] flex items-center gap-1 transition-all shadow-xs flex-1 justify-center"
                      title="Khôi phục bộ truyện này về Thư Viện"
                    >
                      <ArchiveRestore className="w-3 h-3" /> Khôi Phục
                    </button>

                    <button
                      onClick={() => onPermanentlyDeleteTrash && onPermanentlyDeleteTrash(story.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                      title="Xóa vĩnh viễn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : filteredStories.length === 0 ? (
        <div className="p-6 bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-1.5">
          <BookOpen className="w-5 h-5 text-slate-400 dark:text-slate-600 mx-auto" />
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Không tìm thấy tác phẩm nào phù hợp.</p>
          <p className="text-[11px] text-slate-500">
            {activeFilter === 'completed'
              ? 'Chưa có truyện nào được đánh dấu "Đã hoàn thành".'
              : 'Hãy nhấp "+ Tạo Bộ Truyện Mới" hoặc đổi từ khóa tìm kiếm.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {filteredStories.map((story) => {
            const isActive = story.id === activeStoryId;
            const isEditingThis = editingId === story.id;
            const isCompleted = story.status === 'completed';

            // Total word count
            const totalWords = story.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);

            return (
              <div
                key={story.id}
                className={`bg-white dark:bg-[#0F0F12] border rounded-lg p-2.5 shadow-2xs transition-all flex flex-col justify-between space-y-1.5 relative ${
                  isActive
                    ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700/80'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  {/* Top line: Genre + Status */}
                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium truncate">
                      <BookOpen className="w-2.5 h-2.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="truncate">{story.genres[0] || 'Truyện'}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isCompleted ? (
                        <span
                          className="px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 text-[9px] font-semibold flex items-center gap-0.5"
                          title="Đã hoàn thành"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" /> Xong
                        </span>
                      ) : (
                        <span
                          className="px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 text-[9px] font-semibold flex items-center gap-0.5"
                          title="Đang viết"
                        >
                          <Clock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" /> Đang viết
                        </span>
                      )}

                      {isActive && (
                        <span className="px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-[9px] font-bold">
                          Đang chọn
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  {isEditingThis ? (
                    <div className="flex gap-1 my-0.5">
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-white font-medium flex-1 outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => saveRename(story)}
                        className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-medium"
                      >
                        Lưu
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight" title={story.title}>
                        {story.title}
                      </h3>
                      {story.author && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">TG: {story.author}</p>
                      )}
                    </div>
                  )}

                  {/* Stats Pill */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#070709] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800/60 truncate">
                    <span>{story.chapters.length} ch.</span>
                    <span className="text-slate-400 dark:text-slate-600">•</span>
                    <span>{totalWords.toLocaleString()} từ</span>
                    <span className="text-slate-400 dark:text-slate-600">•</span>
                    <span>{story.characters.length} nv</span>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200 dark:border-slate-800/60 mt-1">
                  <button
                    onClick={() => onSelectStory(story.id)}
                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[10px] flex items-center gap-1 transition-all shadow-xs"
                  >
                    <Play className="w-2.5 h-2.5" /> Mở
                  </button>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleToggleStatus(story)}
                      className={`p-1 rounded transition-colors ${
                        isCompleted
                          ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                          : 'text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                      }`}
                      title={isCompleted ? 'Đổi sang Đang viết' : 'Đánh dấu Hoàn thành'}
                    >
                      {isCompleted ? <RotateCcw className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5" />}
                    </button>

                    <button
                      onClick={() => onSaveProjectJson(story)}
                      className="p-1 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Tải file .json"
                    >
                      <Save className="w-2.5 h-2.5" />
                    </button>

                    <button
                      onClick={() => startRename(story)}
                      className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Đổi tên"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>

                    <button
                      onClick={() => onDuplicateStory(story)}
                      className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Nhân bản"
                    >
                      <Copy className="w-2.5 h-2.5" />
                    </button>

                    <button
                      onClick={() => onDeleteStory(story.id)}
                      className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

