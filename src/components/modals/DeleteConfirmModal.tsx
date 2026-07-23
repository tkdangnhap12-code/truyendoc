import React from 'react';
import { Story } from '../../types';
import { Trash2, Archive, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  story: Story | null;
  onClose: () => void;
  onMoveToTrash: (story: Story) => void;
  onDeletePermanently: (storyId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  story,
  onClose,
  onMoveToTrash,
  onDeletePermanently,
}) => {
  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-500/20 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Xóa Tác Phẩm Truỵên
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Bạn đang chọn xóa tác phẩm <strong className="text-slate-800 dark:text-slate-200">"{story.title}"</strong> ({story.chapters.length} chương).
            </p>
          </div>
        </div>

        {/* Options Selection */}
        <div className="space-y-2.5 pt-1">
          {/* Option 1: Move to Trash (Recommended) */}
          <button
            onClick={() => onMoveToTrash(story)}
            className="w-full p-3.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-left flex items-start gap-3 transition-all group shadow-2xs"
          >
            <Archive className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs block text-slate-900 dark:text-amber-300 flex items-center gap-1.5">
                Chuyển Vào Thùng Rác <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-800 dark:text-amber-200 rounded font-normal">Khuyên dùng</span>
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight block mt-0.5">
                Lưu vào Thư viện rác để có thể phục hồi, mở lại và tiếp tục sáng tác bất cứ lúc nào.
              </span>
            </div>
          </button>

          {/* Option 2: Delete Permanently */}
          <button
            onClick={() => onDeletePermanently(story.id)}
            className="w-full p-3.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0A0A0B] hover:border-rose-500/50 hover:bg-rose-500/10 text-left flex items-start gap-3 transition-all group"
          >
            <Trash2 className="w-5 h-5 text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 shrink-0 mt-0.5 transition-colors" />
            <div>
              <span className="font-bold text-xs block text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Xóa Vĩnh Viễn
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                Xóa bỏ hoàn toàn toàn bộ nội dung, nhân vật & dàn ý khỏi hệ thống. Không thể khôi phục.
              </span>
            </div>
          </button>
        </div>

        {/* Footer actions */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors"
          >
            Hủy Bỏ
          </button>
        </div>
      </div>
    </div>
  );
};
