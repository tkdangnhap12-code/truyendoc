import React, { useState } from 'react';
import { Story, Character, Relationship } from '../../types';
import { RelationshipGraph } from './RelationshipGraph';
import { Users, Plus, Trash2, Edit3, Shield, Award, Package, Sparkles, X, ChevronDown, Zap, Clock, RefreshCw, Check, CheckSquare, Square, Layers, GitFork, Compass, ArrowRight } from 'lucide-react';

interface CharacterManagerProps {
  story: Story;
  onUpdateStory: (updatedStory: Story) => void;
}

export interface SuggestedCharacter {
  tempId: string;
  name: string;
  role: string;
  storylineArc: string;
  fitReason: string;
  age: string;
  appearance: string;
  personality: string;
  goals: string;
  strengths: string;
  weaknesses: string;
  items: string[];
  skills: string[];
  suggestedRelationships: { from: string; to: string; relation: string }[];
}

export const CharacterManager: React.FC<CharacterManagerProps> = ({ story, onUpdateStory }) => {
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'graph'>('list');

  // AI Character Suggestion Modal State
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [suggestedList, setSuggestedList] = useState<SuggestedCharacter[]>([]);
  const [selectedSuggestIds, setSelectedSuggestIds] = useState<string[]>([]);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  // Quick inline rename state
  const [editingNameCharId, setEditingNameCharId] = useState<string | null>(null);
  const [inlineNameVal, setInlineNameVal] = useState('');

  // Character Rename Confirmation Modal state
  const [renamePendingInfo, setRenamePendingInfo] = useState<{
    charId: string;
    oldName: string;
    newName: string;
    formDataToSave?: Partial<Character>;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Character>>({
    role: 'Nam chính',
    items: [],
    skills: [],
  });
  const [newItemInput, setNewItemInput] = useState('');
  const [newSkillInput, setNewSkillInput] = useState('');

  // Relationship Form State
  const [relFrom, setRelFrom] = useState('');
  const [relTo, setRelTo] = useState('');
  const [relLabel, setRelLabel] = useState('Đồng đội');

  const startInlineRename = (char: Character) => {
    setEditingNameCharId(char.id);
    setInlineNameVal(char.name);
  };

  const saveInlineRename = (char: Character) => {
    const trimmed = inlineNameVal.trim();
    if (!trimmed || trimmed === char.name) {
      setEditingNameCharId(null);
      return;
    }

    setRenamePendingInfo({
      charId: char.id,
      oldName: char.name,
      newName: trimmed,
      formDataToSave: { ...char, name: trimmed },
    });
    setEditingNameCharId(null);
  };

  const openNewCharForm = () => {
    setSelectedChar(null);
    setFormData({
      name: '',
      role: 'Đồng hành',
      age: '20',
      appearance: '',
      personality: '',
      goals: '',
      strengths: '',
      weaknesses: '',
      items: [],
      skills: [],
    });
    setIsEditing(true);
  };

  const openEditCharForm = (char: Character) => {
    setSelectedChar(char);
    setFormData({ ...char });
    setIsEditing(true);
  };

  const handleSaveChar = () => {
    if (!formData.name?.trim()) return;

    const newName = formData.name.trim();

    if (selectedChar) {
      const oldName = selectedChar.name;
      // If character name was changed, prompt user for instant replace vs profile-only
      if (oldName && oldName !== newName) {
        setRenamePendingInfo({
          charId: selectedChar.id,
          oldName: oldName,
          newName: newName,
          formDataToSave: { ...formData, name: newName },
        });
        return;
      }

      // If name did not change, just update character details normally
      const updatedChars = story.characters.map((c) =>
        c.id === selectedChar.id ? ({ ...c, ...formData, name: newName } as Character) : c
      );

      onUpdateStory({
        ...story,
        characters: updatedChars,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Create new character
      const newChar: Character = {
        id: `char-${Date.now()}`,
        name: newName,
        role: formData.role || 'Đồng hành',
        age: formData.age || '20',
        appearance: formData.appearance || '',
        personality: formData.personality || '',
        goals: formData.goals || '',
        strengths: formData.strengths || '',
        weaknesses: formData.weaknesses || '',
        items: formData.items || [],
        skills: formData.skills || [],
      };
      onUpdateStory({
        ...story,
        characters: [...story.characters, newChar],
        updatedAt: new Date().toISOString(),
      });
    }

    setIsEditing(false);
    setSelectedChar(null);
  };

  // 1. Immediate full-text replacement across chapters, outline, world rules
  const handleApplyRenameImmediate = () => {
    if (!renamePendingInfo) return;
    const { charId, oldName, newName, formDataToSave } = renamePendingInfo;

    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapeRegExp(oldName), 'g');

    // Update character entry
    const updatedChars = story.characters.map((c) =>
      c.id === charId ? ({ ...c, ...(formDataToSave || {}), name: newName } as Character) : c
    );

    // Update relationships
    const updatedRels = story.relationships.map((r) => ({
      ...r,
      from: r.from === oldName ? newName : r.from,
      to: r.to === oldName ? newName : r.to,
    }));

    // Replace in chapters
    const updatedChapters = story.chapters.map((ch) => ({
      ...ch,
      title: ch.title ? ch.title.replace(regex, newName) : ch.title,
      content: ch.content ? ch.content.replace(regex, newName) : ch.content,
      summary: ch.summary ? ch.summary.replace(regex, newName) : ch.summary,
    }));

    // Replace in outline nodes
    const updatedOutline = story.outlineNodes.map((n) => ({
      ...n,
      title: n.title ? n.title.replace(regex, newName) : n.title,
      content: n.content ? n.content.replace(regex, newName) : n.content,
    }));

    // Replace in world rules
    const updatedWorldRules = { ...story.worldRules };
    if (updatedWorldRules.setting) updatedWorldRules.setting = updatedWorldRules.setting.replace(regex, newName);
    if (updatedWorldRules.magicOrTech) updatedWorldRules.magicOrTech = updatedWorldRules.magicOrTech.replace(regex, newName);
    if (updatedWorldRules.historyAndFactions) updatedWorldRules.historyAndFactions = updatedWorldRules.historyAndFactions.replace(regex, newName);

    onUpdateStory({
      ...story,
      characters: updatedChars,
      relationships: updatedRels,
      chapters: updatedChapters,
      outlineNodes: updatedOutline,
      worldRules: updatedWorldRules,
      pitch: story.pitch ? story.pitch.replace(regex, newName) : story.pitch,
      updatedAt: new Date().toISOString(),
    });

    setRenamePendingInfo(null);
    setIsEditing(false);
    setSelectedChar(null);
  };

  // 2. Profile-only update (change after writing finished)
  const handleApplyRenameProfileOnly = () => {
    if (!renamePendingInfo) return;
    const { charId, oldName, newName, formDataToSave } = renamePendingInfo;

    const updatedChars = story.characters.map((c) =>
      c.id === charId ? ({ ...c, ...(formDataToSave || {}), name: newName } as Character) : c
    );

    const updatedRels = story.relationships.map((r) => ({
      ...r,
      from: r.from === oldName ? newName : r.from,
      to: r.to === oldName ? newName : r.to,
    }));

    onUpdateStory({
      ...story,
      characters: updatedChars,
      relationships: updatedRels,
      updatedAt: new Date().toISOString(),
    });

    setRenamePendingInfo(null);
    setIsEditing(false);
    setSelectedChar(null);
  };

  const handleDeleteChar = (charId: string) => {
    const updated = story.characters.filter((c) => c.id !== charId);
    onUpdateStory({
      ...story,
      characters: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddRelationship = () => {
    if (!relFrom || !relTo || relFrom === relTo) return;
    const newRel: Relationship = {
      id: `rel-${Date.now()}`,
      from: relFrom,
      to: relTo,
      relation: relLabel || 'Đồng đội',
    };

    onUpdateStory({
      ...story,
      relationships: [...story.relationships, newRel],
      updatedAt: new Date().toISOString(),
    });

    setRelLabel('Đồng đội');
  };

  const handleDeleteRelationship = (relId: string) => {
    const updated = story.relationships.filter((r) => r.id !== relId);
    onUpdateStory({
      ...story,
      relationships: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const addItemToChar = () => {
    if (!newItemInput.trim()) return;
    setFormData({
      ...formData,
      items: [...(formData.items || []), newItemInput.trim()],
    });
    setNewItemInput('');
  };

  // AI Suggestion Functions
  const handleFetchAISuggestions = async () => {
    setIsSuggestModalOpen(true);
    setIsSuggestLoading(true);
    setSuggestError(null);

    try {
      const res = await fetch('/api/ai/suggest-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Không thể tạo gợi ý nhân vật');
      }

      const list: SuggestedCharacter[] = (data.data?.suggestedCharacters || []).map((item: any, idx: number) => ({
        tempId: `sugg-${Date.now()}-${idx}`,
        name: item.name || `Nhân vật ${idx + 1}`,
        role: item.role || 'Đồng hành',
        storylineArc: item.storylineArc || 'Tuyến sự kiện chính',
        fitReason: item.fitReason || 'Phù hợp với mạch truyện hiện tại.',
        age: item.age || '20',
        appearance: item.appearance || '',
        personality: item.personality || '',
        goals: item.goals || '',
        strengths: item.strengths || '',
        weaknesses: item.weaknesses || '',
        items: Array.isArray(item.items) ? item.items : [],
        skills: Array.isArray(item.skills) ? item.skills : [],
        suggestedRelationships: Array.isArray(item.suggestedRelationships) ? item.suggestedRelationships : [],
      }));

      setSuggestedList(list);
      // Select all suggested items by default
      setSelectedSuggestIds(list.map((c) => c.tempId));
    } catch (err: any) {
      setSuggestError(err?.message || 'Có lỗi xảy ra khi gọi AI gợi ý nhân vật.');
    } finally {
      setIsSuggestLoading(false);
    }
  };

  const toggleSelectSuggest = (tempId: string) => {
    setSelectedSuggestIds((prev) =>
      prev.includes(tempId) ? prev.filter((id) => id !== tempId) : [...prev, tempId]
    );
  };

  const handleSelectAllSuggest = () => {
    setSelectedSuggestIds(suggestedList.map((c) => c.tempId));
  };

  const handleDeselectAllSuggest = () => {
    setSelectedSuggestIds([]);
  };

  const handleApplySelectedSuggestions = () => {
    const selectedItems = suggestedList.filter((item) => selectedSuggestIds.includes(item.tempId));
    if (selectedItems.length === 0) return;

    const now = Date.now();
    const newCharacters: Character[] = selectedItems.map((item, idx) => ({
      id: `char-${now}-${idx}-${Math.floor(Math.random() * 1000)}`,
      name: item.name,
      role: item.role,
      age: item.age,
      appearance: item.appearance,
      personality: item.personality,
      goals: item.goals,
      strengths: item.strengths,
      weaknesses: item.weaknesses,
      items: item.items,
      skills: item.skills,
    }));

    // Collect suggested relationships
    const newRelationships: Relationship[] = [];
    selectedItems.forEach((item, idx) => {
      if (item.suggestedRelationships && item.suggestedRelationships.length > 0) {
        item.suggestedRelationships.forEach((rel, rIdx) => {
          if (rel.to) {
            newRelationships.push({
              id: `rel-${now}-${idx}-${rIdx}-${Math.floor(Math.random() * 1000)}`,
              from: item.name,
              to: rel.to,
              relation: rel.relation || 'Đồng đội',
            });
          }
        });
      }
    });

    const updatedChars = [...story.characters, ...newCharacters];
    const updatedRels = [...story.relationships, ...newRelationships];

    onUpdateStory({
      ...story,
      characters: updatedChars,
      relationships: updatedRels,
      updatedAt: new Date().toISOString(),
    });

    setIsSuggestModalOpen(false);
    alert(`🎉 Đã tự động thêm ${newCharacters.length} nhân vật mới và ${newRelationships.length} mối quan hệ vào bộ truyện của bạn!`);
  };

  const addSkillToChar = () => {
    if (!newSkillInput.trim()) return;
    setFormData({
      ...formData,
      skills: [...(formData.skills || []), newSkillInput.trim()],
    });
    setNewSkillInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" /> QUẢN LÝ NHÂN VẬT & MỐI QUAN HỆ
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Character Memory & Sơ Đồ Quan Hệ</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Lưu giữ ngoại hình, tính cách, kỹ năng, vật phẩm. AI sẽ ghi nhớ tuyệt đối và không tự ý thay đổi.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleFetchAISuggestions}
            className="px-3.5 py-2 rounded-md bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md transition-all group"
          >
            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>AI Gợi Ý Nhân Vật Theo Mạch Truyện</span>
          </button>
          <button
            onClick={openNewCharForm}
            className="px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" /> Thêm Nhân Vật Mới
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-[#0F0F12] p-1 rounded-lg border border-slate-200 dark:border-slate-800 max-w-md transition-colors">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'list'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          📋 Danh Sách Nhân Vật ({story.characters.length})
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'graph'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          🕸️ Sơ Đồ Quan Hệ
        </button>
      </div>

      {/* View Mode 1: Character Cards */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {story.characters.map((char) => (
            <div
              key={char.id}
              className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 rounded-xl p-4 shadow-xs space-y-3.5 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-600/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm shadow-xs">
                    {char.name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {editingNameCharId === char.id ? (
                        <div className="flex items-center gap-1.5 my-0.5">
                          <input
                            type="text"
                            value={inlineNameVal}
                            onChange={(e) => setInlineNameVal(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveInlineRename(char)}
                            autoFocus
                            className="bg-slate-50 dark:bg-[#0A0A0B] border border-emerald-500 rounded px-2 py-0.5 text-xs text-slate-900 dark:text-white outline-none"
                            placeholder="Nhập tên mới..."
                          />
                          <button
                            onClick={() => saveInlineRename(char)}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-medium"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingNameCharId(null)}
                            className="px-1.5 py-0.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-[10px]"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{char.name}</h3>
                          <button
                            onClick={() => startInlineRename(char)}
                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors"
                            title="Đổi tên nhanh"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                        {char.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tuổi: {char.age}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditCharForm(char)}
                    className="p-1.5 text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteChar(char.id)}
                    className="p-1.5 text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <p>
                  <strong className="text-slate-500 font-medium">Ngoại hình:</strong> {char.appearance || 'Chưa miêu tả'}
                </p>
                <p>
                  <strong className="text-slate-500 font-medium">Tính cách:</strong> {char.personality || 'Chưa rõ'}
                </p>
                <p>
                  <strong className="text-slate-500 font-medium">Mục tiêu:</strong> {char.goals || 'Chưa rõ'}
                </p>
              </div>

              {/* Items / Inventory & Skills */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium block mb-1 flex items-center gap-1 text-[11px]">
                    <Package className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Vật phẩm:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(char.items || []).length > 0 ? (
                      char.items.map((it, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0A0A0B] text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[10px]">
                          {it}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 italic text-[11px]">Trống</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium block mb-1 flex items-center gap-1 text-[11px]">
                    <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Kỹ năng:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(char.skills || []).length > 0 ? (
                      char.skills.map((sk, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0A0A0B] text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[10px]">
                          {sk}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 italic text-[11px]">Trống</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Mode 2: Graph & Relationship Manager */}
      {activeTab === 'graph' && (
        <div className="space-y-6">
          <RelationshipGraph characters={story.characters} relationships={story.relationships} />

          {/* Relationship Setup */}
          <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🔗</span> Thêm Mối Quan Hệ Giữa Nhân Vật
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={relFrom}
                onChange={(e) => setRelFrom(e.target.value)}
                className="bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-md p-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">-- Chọn Nhân Vật A --</option>
                {story.characters.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={relLabel}
                onChange={(e) => setRelLabel(e.target.value)}
                placeholder="Ví dụ: Đồng đội, Kẻ thù, Tình nhân, Sư đồ..."
                className="bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-md p-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 transition-colors"
              />

              <select
                value={relTo}
                onChange={(e) => setRelTo(e.target.value)}
                className="bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-md p-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">-- Chọn Nhân Vật B --</option>
                {story.characters.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAddRelationship}
                disabled={!relFrom || !relTo || relFrom === relTo}
                className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Quan Hệ
              </button>
            </div>

            {/* List of Relationships */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              {story.relationships.map((rel) => (
                <div
                  key={rel.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#0A0A0B] rounded-md border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                >
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">{rel.from}</span>
                    <span className="mx-2 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-medium text-[11px]">
                      {rel.relation}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">{rel.to}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteRelationship(rel.id)}
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit / New Character Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 relative transition-colors">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {selectedChar ? 'Chỉnh Sửa Nhân Vật' : 'Tạo Nhân Vật Mới'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tên nhân vật (Thay đổi tên tại đây) *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Lâm Bách"
                  className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-md p-2 text-xs outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Vai trò trong truyện</label>
                <select
                  value={formData.role || 'Đồng hành'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-md p-2 text-xs outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white"
                >
                  <option value="Nam chính">Nam chính</option>
                  <option value="Nữ chính">Nữ chính</option>
                  <option value="Đồng hành">Đồng hành</option>
                  <option value="Phản diện">Phản diện</option>
                  <option value="Phụ">Phụ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tuổi</label>
                <input
                  type="text"
                  value={formData.age || ''}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-md p-2 text-xs outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Ngoại hình đặc trưng</label>
                <input
                  type="text"
                  value={formData.appearance || ''}
                  onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                  placeholder="Vết sẹo, dáng người, trang phục..."
                  className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-md p-2 text-xs outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tính cách & Phong thái</label>
              <input
                type="text"
                value={formData.personality || ''}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                placeholder="Điềm tĩnh, nhanh nhẹn, quyết đoán..."
                className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-md p-2 text-xs outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Mục tiêu cá nhân</label>
              <input
                type="text"
                value={formData.goals || ''}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                placeholder="Tìm người thân, trả thù, giải mã bí ẩn..."
                className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-md p-2 text-xs outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white"
              />
            </div>

            {/* Items & Skills Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Vật phẩm mang theo</label>
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    value={newItemInput}
                    onChange={(e) => setNewItemInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItemToChar()}
                    placeholder="Tên vật phẩm..."
                    className="flex-1 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-md p-1.5 text-xs outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white"
                  />
                  <button onClick={addItemToChar} className="px-3 py-1 bg-emerald-600 rounded-md text-xs font-medium text-white hover:bg-emerald-500">
                    Thêm
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(formData.items || []).map((it, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800 rounded text-xs flex items-center gap-1 text-slate-800 dark:text-slate-300">
                      {it}
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            items: formData.items?.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Kỹ năng đặc biệt</label>
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSkillToChar()}
                    placeholder="Tên kỹ năng..."
                    className="flex-1 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-300 dark:border-slate-800 rounded-md p-1.5 text-xs outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white"
                  />
                  <button onClick={addSkillToChar} className="px-3 py-1 bg-emerald-600 rounded-md text-xs font-medium text-white hover:bg-emerald-500">
                    Thêm
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(formData.skills || []).map((sk, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800 rounded text-xs flex items-center gap-1 text-slate-800 dark:text-slate-300">
                      {sk}
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            skills: formData.skills?.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveChar}
                className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-xs"
              >
                Lưu Nhân Vật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Mode Choice Modal */}
      {renamePendingInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 space-y-4">
            <button
              onClick={() => setRenamePendingInfo(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Xác Nhận Thay Đổi Tên Nhân Vật
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Bạn đang đổi tên từ <strong className="text-rose-600 dark:text-rose-400">"{renamePendingInfo.oldName}"</strong> sang <strong className="text-emerald-600 dark:text-emerald-400">"{renamePendingInfo.newName}"</strong>.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Vui lòng chọn cách áp dụng tên mới cho bộ truyện của bạn:
            </p>

            {/* Options Selection */}
            <div className="space-y-2.5 pt-1">
              {/* Option 1: Immediate Replace */}
              <button
                onClick={handleApplyRenameImmediate}
                className="w-full p-3.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-left flex items-start gap-3 transition-all group shadow-2xs"
              >
                <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-xs block text-slate-900 dark:text-emerald-300 flex items-center gap-1.5">
                    Thay Đổi Ngay Lập Tức <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 rounded font-normal">Toàn bộ tác phẩm</span>
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight block mt-0.5">
                    Tự động cập nhật tên mới vào tất cả các chương đã viết, dàn ý, diễn biến và hồ sơ sơ đồ nhân vật.
                  </span>
                </div>
              </button>

              {/* Option 2: Profile Only / Change Later */}
              <button
                onClick={handleApplyRenameProfileOnly}
                className="w-full p-3.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0A0A0B] hover:border-amber-500/50 hover:bg-amber-500/10 text-left flex items-start gap-3 transition-all group"
              >
                <Clock className="w-5 h-5 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 shrink-0 mt-0.5 transition-colors" />
                <div>
                  <span className="font-bold text-xs block text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Chỉ Cập Nhật Trong Hồ Sơ (Thay đổi sau khi viết xong)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                    Chỉ lưu tên mới vào hồ sơ & sơ đồ nhân vật. Giữ nguyên nội dung văn bản các chương truyện hiện tại.
                  </span>
                </div>
              </button>
            </div>

            {/* Footer actions */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setRenamePendingInfo(null)}
                className="px-4 py-1.5 rounded-md border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors"
              >
                Hủy Bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggest Characters Modal */}
      {isSuggestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 dark:bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative text-slate-900 dark:text-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0A0A0B]/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-500/30 shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-500 dark:text-purple-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    AI Gợi Ý Nhân Vật Mới Theo Mạch Truyện
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                      Đa tuyến câu chuyện
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Phân tích bối cảnh, dàn ý và đề xuất các nhân vật phù hợp nhằm đẩy cao trào cho bộ truyện.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSuggestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Loading State */}
              {isSuggestLoading && (
                <div className="py-16 text-center space-y-4">
                  <div className="relative inline-flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-600 animate-spin"></div>
                    <Sparkles className="w-6 h-6 text-purple-500 absolute animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      AI đang phân tích tác phẩm & sáng tạo nhân vật...
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                      Đang liên kết bối cảnh thế giới, mảng đề tài, dàn ý các chương tiếp theo để đề xuất nhiều tuyến nhân vật logic nhất.
                    </p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {!isSuggestLoading && suggestError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs space-y-3">
                  <p className="font-medium">⚠️ {suggestError}</p>
                  <button
                    onClick={handleFetchAISuggestions}
                    className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Thử lại
                  </button>
                </div>
              )}

              {/* Suggested Characters List */}
              {!isSuggestLoading && !suggestError && (
                <div className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-100/70 dark:bg-[#141418] border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span>Tìm thấy {suggestedList.length} nhân vật gợi ý</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold text-[11px]">
                        Đã chọn {selectedSuggestIds.length}/{suggestedList.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAllSuggest}
                        className="px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        Chọn Tất Cả
                      </button>
                      <button
                        onClick={handleDeselectAllSuggest}
                        className="px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        Bỏ Chọn
                      </button>
                      <button
                        onClick={handleFetchAISuggestions}
                        className="px-2.5 py-1 text-xs font-medium rounded-md bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Gợi Ý Khác
                      </button>
                    </div>
                  </div>

                  {/* Character Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestedList.map((item) => {
                      const isSelected = selectedSuggestIds.includes(item.tempId);
                      return (
                        <div
                          key={item.tempId}
                          onClick={() => toggleSelectSuggest(item.tempId)}
                          className={`group cursor-pointer rounded-xl p-4 border transition-all relative flex flex-col justify-between space-y-3 ${
                            isSelected
                              ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-500 dark:border-purple-500/80 shadow-md ring-1 ring-purple-500/30'
                              : 'bg-white dark:bg-[#0F0F12] border-slate-200 dark:border-slate-800 opacity-75 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          {/* Top Row: Checkbox + Badges */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : 'border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                  {item.name}
                                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                    ({item.age})
                                  </span>
                                </h4>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                              {item.role}
                            </span>
                          </div>

                          {/* Storyline Arc Badge */}
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-purple-600 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-md w-fit">
                            <Compass className="w-3.5 h-3.5 shrink-0" />
                            <span>Tuyến truyện: <strong>{item.storylineArc}</strong></span>
                          </div>

                          {/* Fit Reason Box */}
                          <div className="p-2.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
                            <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5 flex items-center gap-1">
                              💡 Phù hợp cốt truyện:
                            </span>
                            {item.fitReason}
                          </div>

                          {/* Traits summary */}
                          <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                            {item.appearance && (
                              <p className="line-clamp-2">
                                <strong className="text-slate-700 dark:text-slate-200">Ngoại hình:</strong> {item.appearance}
                              </p>
                            )}
                            {item.personality && (
                              <p className="line-clamp-2">
                                <strong className="text-slate-700 dark:text-slate-200">Tính cách:</strong> {item.personality}
                              </p>
                            )}
                            {item.goals && (
                              <p className="line-clamp-1">
                                <strong className="text-slate-700 dark:text-slate-200">Mục tiêu:</strong> {item.goals}
                              </p>
                            )}
                          </div>

                          {/* Items & Skills tags */}
                          <div className="flex flex-wrap gap-1 text-[10px]">
                            {item.skills?.map((sk, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-500/20">
                                ⚔️ {sk}
                              </span>
                            ))}
                            {item.items?.map((it, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded border border-amber-500/20">
                                💎 {it}
                              </span>
                            ))}
                          </div>

                          {/* Suggested Relationships */}
                          {item.suggestedRelationships && item.suggestedRelationships.length > 0 && (
                            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                🔗 Mối quan hệ đề xuất:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {item.suggestedRelationships.map((rel, rIdx) => (
                                  <span
                                    key={rIdx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px]"
                                  >
                                    <strong className="text-purple-600 dark:text-purple-400">{rel.relation}</strong>
                                    <span>➔</span>
                                    <span>{rel.to}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0A0A0B]/50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                {selectedSuggestIds.length > 0
                  ? `Đã chọn ${selectedSuggestIds.length} nhân vật để tự động đưa vào tác phẩm.`
                  : 'Hãy tích chọn ít nhất 1 nhân vật.'}
              </span>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setIsSuggestModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                >
                  Đóng
                </button>
                <button
                  disabled={selectedSuggestIds.length === 0 || isSuggestLoading}
                  onClick={handleApplySelectedSuggestions}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm {selectedSuggestIds.length} Nhân Vật Đã Chọn Vào Truyện</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
