import React from 'react';
import { Story } from '../../types';
import { ApiUsageWarningBanner } from './ApiUsageWarningBanner';
import {
  BookOpen,
  Users,
  Plus,
  FolderKanban,
  FileText,
  Palette,
  FolderOpen,
  Save,
  Download,
  Book,
  Sun,
  Moon,
  Trash2,
} from 'lucide-react';

interface SidebarProps {
  stories: Story[];
  activeStory: Story | null;
  activeTab: 'writer' | 'characters' | 'memory' | 'style' | 'projects';
  onSelectTab: (tab: 'writer' | 'characters' | 'memory' | 'style' | 'projects') => void;
  onSelectStory: (storyId: string) => void;
  onOpenNewStoryModal: () => void;
  onOpenExportModal: () => void;
  onSaveProjectJson: () => void;
  onOpenProjectJson: () => void;
  onDeleteStory?: (storyId: string) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  stories,
  activeStory,
  activeTab,
  onSelectTab,
  onSelectStory,
  onOpenNewStoryModal,
  onOpenExportModal,
  onSaveProjectJson,
  onOpenProjectJson,
  onDeleteStory,
  theme = 'dark',
  onToggleTheme,
}) => {
  const navItems = [
    { id: 'writer', label: 'Soạn Thảo & Dàn Ý', icon: FileText },
    { id: 'characters', label: 'Quản Lý Nhân Vật', icon: Users },
    { id: 'memory', label: 'Story Bible & Bộ Nhớ', icon: BookOpen },
    { id: 'style', label: 'Học Văn Phong AI', icon: Palette },
    { id: 'projects', label: 'Thư Viện Tác Phẩm', icon: FolderKanban },
  ] as const;

  return (
    <aside className="w-full lg:w-64 bg-white dark:bg-[#0B0B0E] border-r border-slate-200 dark:border-slate-800/60 flex flex-col shrink-0 text-slate-700 dark:text-slate-300 select-none transition-colors duration-200">
      {/* Sleek App Branding & Project Selector */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/60 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              <Book className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-slate-900 dark:text-white tracking-tight">AI Story Studio</span>
          </div>

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700/60"
              title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">Sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[11px]">Tối</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* API Limit Early Warning Indicator */}
        <div className="pt-1 flex items-center justify-between">
          <ApiUsageWarningBanner compactHeaderOnly={true} />
        </div>

        {/* Story Selector Dropdown & Quick Delete */}
        {activeStory && (
          <div className="mt-1 flex items-center gap-1.5">
            <select
              value={activeStory.id}
              onChange={(e) => onSelectStory(e.target.value)}
              className="flex-1 min-w-0 bg-slate-50 dark:bg-[#131318] border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700/80 rounded-md py-1.5 px-2.5 text-xs text-slate-900 dark:text-slate-200 font-medium cursor-pointer outline-none focus:border-emerald-500 transition-colors truncate"
            >
              {stories.map((s) => (
                <option key={s.id} value={s.id}>
                  📖 {s.title} ({s.chapters.length} chương)
                </option>
              ))}
            </select>

            {onDeleteStory && (
              <button
                onClick={() => onDeleteStory(activeStory.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-50 dark:bg-[#131318] hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md border border-slate-300 dark:border-slate-800 transition-colors shrink-0"
                title="Xóa bộ truyện này"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Clean Navigation */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium text-xs flex items-center gap-3 transition-all ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-500/20 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/30'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Action Bar */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/60 space-y-2 bg-slate-50 dark:bg-[#08080A]">
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={onOpenProjectJson}
            className="py-1.5 px-2 bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700/50 text-[11px] font-medium transition-colors flex items-center justify-center gap-1 shadow-xs"
            title="Mở file dự án (.json)"
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Mở
          </button>
          <button
            onClick={onSaveProjectJson}
            className="py-1.5 px-2 bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700/50 text-[11px] font-medium transition-colors flex items-center justify-center gap-1 shadow-xs"
            title="Lưu file dự án (.json)"
          >
            <Save className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Lưu
          </button>
          <button
            onClick={onOpenExportModal}
            className="py-1.5 px-2 bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700/50 text-[11px] font-medium transition-colors flex items-center justify-center gap-1 shadow-xs"
            title="Xuất văn bản (DOCX/TXT...)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Xuất
          </button>
        </div>

        <button
          onClick={onOpenNewStoryModal}
          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Tạo Truyện Mới
        </button>
      </div>
    </aside>
  );
};



