import React, { useState, useEffect, useRef } from 'react';
import { Story, OutlineNode } from './types';
import { Sun, Moon } from 'lucide-react';
import {
  getStoredStories,
  saveStories,
  getActiveStoryId,
  setActiveStoryId,
  createSampleStory,
  getTrashedStories,
  saveTrashedStories,
  TrashedStory,
} from './lib/storage';
import { exportProjectJSON, exportAllProjectsJSON, readProjectJSONFile } from './lib/exporter';
import { Sidebar } from './components/layout/Sidebar';
import { OutlineStudio } from './components/writer/OutlineStudio';
import { ChapterWriter } from './components/writer/ChapterWriter';
import { CharacterManager } from './components/character/CharacterManager';
import { StoryMemoryViewer } from './components/memory/StoryMemoryViewer';
import { StyleAnalyzer } from './components/style/StyleAnalyzer';
import { ProjectManager } from './components/projects/ProjectManager';
import { StoryConceptModal } from './components/modals/StoryConceptModal';
import { ExportModal } from './components/modals/ExportModal';
import { DeleteConfirmModal } from './components/modals/DeleteConfirmModal';
import { ApiUsageWarningBanner } from './components/layout/ApiUsageWarningBanner';

export default function App() {
  const [stories, setStories] = useState<Story[]>([]);
  const [trashedStories, setTrashedStories] = useState<TrashedStory[]>([]);
  const [activeStoryId, setActiveStoryIdState] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'writer' | 'characters' | 'memory' | 'style' | 'projects'>('projects');
  const [selectedOutlineNode, setSelectedOutlineNode] = useState<OutlineNode | null>(null);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app-theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // File input ref for opening project JSON files
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);

  // Initial Load
  useEffect(() => {
    let loaded = getStoredStories();
    if (!loaded || loaded.length === 0) {
      const sample = createSampleStory();
      loaded = [sample];
      saveStories(loaded);
    }
    setStories(loaded);
    setTrashedStories(getTrashedStories());

    const savedActiveId = getActiveStoryId();
    if (savedActiveId && loaded.some((s) => s.id === savedActiveId)) {
      setActiveStoryIdState(savedActiveId);
    } else {
      setActiveStoryIdState(loaded[0].id);
      setActiveStoryId(loaded[0].id);
    }
  }, []);

  // Auto-Save Effect
  useEffect(() => {
    saveStories(stories);
  }, [stories]);

  const activeStory = stories.find((s) => s.id === activeStoryId) || stories[0] || null;

  const handleUpdateStory = (updatedStory: Story) => {
    const updatedList = stories.map((s) => (s.id === updatedStory.id ? updatedStory : s));
    setStories(updatedList);
  };

  const handleSelectStory = (id: string) => {
    setActiveStoryIdState(id);
    setActiveStoryId(id);
    setActiveTab('writer');
  };

  const handleStoryCreated = (newStory: Story) => {
    const updated = [newStory, ...stories];
    setStories(updated);
    setActiveStoryIdState(newStory.id);
    setActiveStoryId(newStory.id);
    setActiveTab('writer');
  };

  // Open delete choice modal
  const handleDeleteStory = (id: string) => {
    const targetStory = stories.find((s) => s.id === id);
    if (targetStory) {
      setStoryToDelete(targetStory);
    }
  };

  // Move story to trash
  const handleMoveToTrash = (storyToMove: Story) => {
    const trashedItem: TrashedStory = {
      ...storyToMove,
      deletedAt: new Date().toISOString(),
    };
    const updatedTrash = [trashedItem, ...trashedStories];
    setTrashedStories(updatedTrash);
    saveTrashedStories(updatedTrash);

    const updated = stories.filter((s) => s.id !== storyToMove.id);

    if (updated.length === 0) {
      const now = new Date().toISOString();
      const freshStory: Story = {
        id: `story-${Date.now()}`,
        title: 'Bộ Truyện Mới',
        author: '',
        pitch: 'Bắt đầu lên ý tưởng và dàn ý cho tác phẩm mới...',
        genres: ['Tự do'],
        targetTone: 'Kịch tính',
        lengthOption: 'Trung bình',
        worldRules: { setting: '', magicOrTech: '', historyAndFactions: '' },
        characters: [],
        relationships: [],
        outlineNodes: [],
        timeline: [],
        chapters: [],
        status: 'ongoing',
        createdAt: now,
        updatedAt: now,
      };
      setStories([freshStory]);
      setActiveStoryIdState(freshStory.id);
      setActiveStoryId(freshStory.id);
      saveStories([freshStory]);
    } else {
      setStories(updated);
      saveStories(updated);
      if (activeStoryId === storyToMove.id) {
        setActiveStoryIdState(updated[0].id);
        setActiveStoryId(updated[0].id);
      }
    }

    setStoryToDelete(null);
  };

  // Permanently delete story
  const handleDeletePermanently = (storyId: string) => {
    const updated = stories.filter((s) => s.id !== storyId);

    if (updated.length === 0) {
      const now = new Date().toISOString();
      const freshStory: Story = {
        id: `story-${Date.now()}`,
        title: 'Bộ Truyện Mới',
        author: '',
        pitch: 'Bắt đầu lên ý tưởng và dàn ý cho tác phẩm mới...',
        genres: ['Tự do'],
        targetTone: 'Kịch tính',
        lengthOption: 'Trung bình',
        worldRules: { setting: '', magicOrTech: '', historyAndFactions: '' },
        characters: [],
        relationships: [],
        outlineNodes: [],
        timeline: [],
        chapters: [],
        status: 'ongoing',
        createdAt: now,
        updatedAt: now,
      };
      setStories([freshStory]);
      setActiveStoryIdState(freshStory.id);
      setActiveStoryId(freshStory.id);
      saveStories([freshStory]);
    } else {
      setStories(updated);
      saveStories(updated);
      if (activeStoryId === storyId) {
        setActiveStoryIdState(updated[0].id);
        setActiveStoryId(updated[0].id);
      }
    }

    setStoryToDelete(null);
  };

  // Restore story from trash back to active stories
  const handleRestoreStory = (storyId: string) => {
    const trashedItem = trashedStories.find((s) => s.id === storyId);
    if (!trashedItem) return;

    const { deletedAt, ...restoredStory } = trashedItem;
    const updatedTrash = trashedStories.filter((s) => s.id !== storyId);
    setTrashedStories(updatedTrash);
    saveTrashedStories(updatedTrash);

    const updatedStories = [restoredStory, ...stories];
    setStories(updatedStories);
    saveStories(updatedStories);

    setActiveStoryIdState(restoredStory.id);
    setActiveStoryId(restoredStory.id);
  };

  // Permanently delete single item in trash
  const handlePermanentlyDeleteTrash = (storyId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn bộ truyện này khỏi Thùng Rác? Tất cả dữ liệu sẽ bị hủy không thể khôi phục.')) {
      return;
    }
    const updatedTrash = trashedStories.filter((s) => s.id !== storyId);
    setTrashedStories(updatedTrash);
    saveTrashedStories(updatedTrash);
  };

  // Empty entire trash
  const handleEmptyTrash = () => {
    if (!window.confirm('Bạn có chắc chắn muốn dọn sạch toàn bộ Thùng Rác? Toàn bộ truyện trong thùng rác sẽ bị xóa vĩnh viễn.')) {
      return;
    }
    setTrashedStories([]);
    saveTrashedStories([]);
  };

  const handleDuplicateStory = (storyToDup: Story) => {
    const dup: Story = {
      ...storyToDup,
      id: `story-${Date.now()}`,
      title: `${storyToDup.title} (Bản sao)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setStories([dup, ...stories]);
  };

  const handleForkStory = (newStory: Story) => {
    const updated = [newStory, ...stories];
    setStories(updated);
    saveStories(updated);
    setActiveStoryIdState(newStory.id);
    setActiveStoryId(newStory.id);
  };

  const handleSelectNodeForChapter = (node: OutlineNode) => {
    setSelectedOutlineNode(node);
    setActiveTab('writer');
  };

  const handleOpenProjectJson = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProjectJson = (storyToSave?: Story) => {
    const target = storyToSave || activeStory;
    if (!target) return;
    exportProjectJSON(target);
  };

  const handleSaveAllProjectsJson = () => {
    if (stories.length === 0) return;
    exportAllProjectsJSON(stories);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      const importedStories = await readProjectJSONFile(file);

      if (importedStories.length === 0) {
        alert('File không chứa dữ liệu dự án hợp lệ!');
        return;
      }

      const existingIds = new Set(stories.map((s) => s.id));
      const newStoriesToAppend: Story[] = [];

      importedStories.forEach((imp, idx) => {
        const isDuplicateId = existingIds.has(imp.id) || !imp.id;
        const newId = isDuplicateId
          ? `story-imp-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`
          : imp.id;

        const updatedImp: Story = {
          ...imp,
          id: newId,
          title: isDuplicateId && existingIds.has(imp.id) ? `${imp.title} (Đã nạp)` : imp.title,
        };
        newStoriesToAppend.push(updatedImp);
        existingIds.add(newId);
      });

      const updatedList = [...newStoriesToAppend, ...stories];
      setStories(updatedList);
      saveStories(updatedList);

      const targetStoryToOpen = newStoriesToAppend[0];
      setActiveStoryIdState(targetStoryToOpen.id);
      setActiveStoryId(targetStoryToOpen.id);
      setActiveTab('writer');

      alert(`🎉 Đã mở thành công tác phẩm "${targetStoryToOpen.title}"! Bạn có thể tiếp tục viết ngay bây giờ.`);
    } catch (err: any) {
      alert(`Lỗi khi mở file dự án: ${err?.message || 'File không đúng định dạng.'}`);
    } finally {
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F5EFE6] dark:bg-[#0A0A0B] text-[#2C2825] dark:text-slate-100 font-sans antialiased selection:bg-amber-600 selection:text-white transition-colors duration-200">
      {/* Hidden File Input for Opening Project Files */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,.txt,.md,application/json,text/plain"
        className="hidden"
      />

      {/* Sidebar Navigation */}
      <Sidebar
        stories={stories}
        activeStory={activeStory}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSelectStory={handleSelectStory}
        onOpenNewStoryModal={() => setIsConceptModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onSaveProjectJson={() => handleSaveProjectJson()}
        onOpenProjectJson={handleOpenProjectJson}
        onDeleteStory={handleDeleteStory}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {activeStory ? (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            {/* Top Clean Header */}
            <header className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-sm sm:max-w-md">
                  {activeStory.title}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-medium border border-emerald-300 dark:border-emerald-500/20 shrink-0">
                  {activeTab === 'writer' && 'Soạn Thảo & Dàn Ý'}
                  {activeTab === 'characters' && 'Nhân Vật'}
                  {activeTab === 'memory' && 'Story Memory'}
                  {activeTab === 'style' && 'Văn Phong AI'}
                  {activeTab === 'projects' && 'Thư Viện'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Đổi giữa Trang Sách (Màu Vàng Vàng) và Giao diện Tối"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span className="hidden sm:inline">Trang Giấy Sách</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="hidden sm:inline">Giao diện Tối</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsConceptModalOpen(true)}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  + Truyện Mới
                </button>
              </div>
            </header>

            {/* Active Module View */}
            <div>
              {activeTab === 'writer' && (
                <div className="space-y-8">
                  <OutlineStudio
                    story={activeStory}
                    onUpdateStory={handleUpdateStory}
                    onForkStory={handleForkStory}
                    onSelectNodeForChapter={handleSelectNodeForChapter}
                  />
                  <ChapterWriter
                    story={activeStory}
                    onUpdateStory={handleUpdateStory}
                    selectedOutlineNode={selectedOutlineNode}
                  />
                </div>
              )}

              {activeTab === 'characters' && (
                <CharacterManager story={activeStory} onUpdateStory={handleUpdateStory} />
              )}

              {activeTab === 'memory' && (
                <StoryMemoryViewer story={activeStory} onUpdateStory={handleUpdateStory} />
              )}

              {activeTab === 'style' && (
                <StyleAnalyzer story={activeStory} onUpdateStory={handleUpdateStory} />
              )}

              {activeTab === 'projects' && (
                <ProjectManager
                  stories={stories}
                  trashedStories={trashedStories}
                  activeStoryId={activeStoryId}
                  onSelectStory={handleSelectStory}
                  onOpenNewStoryModal={() => setIsConceptModalOpen(true)}
                  onDeleteStory={handleDeleteStory}
                  onDuplicateStory={handleDuplicateStory}
                  onUpdateStory={handleUpdateStory}
                  onSaveProjectJson={handleSaveProjectJson}
                  onOpenProjectJson={handleOpenProjectJson}
                  onSaveAllProjectsJson={handleSaveAllProjectsJson}
                  onRestoreStory={handleRestoreStory}
                  onPermanentlyDeleteTrash={handlePermanentlyDeleteTrash}
                  onEmptyTrash={handleEmptyTrash}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 text-xs">Đang tải ứng dụng sáng tác...</div>
        )}
      </main>

      {/* Modals */}
      <DeleteConfirmModal
        story={storyToDelete}
        onClose={() => setStoryToDelete(null)}
        onMoveToTrash={handleMoveToTrash}
        onDeletePermanently={handleDeletePermanently}
      />

      <StoryConceptModal
        isOpen={isConceptModalOpen}
        onClose={() => setIsConceptModalOpen(false)}
        onStoryCreated={handleStoryCreated}
      />

      {activeStory && (
        <ExportModal
          story={activeStory}
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* API Rate Limit Early Warning Banner */}
      <ApiUsageWarningBanner />
    </div>
  );
}
