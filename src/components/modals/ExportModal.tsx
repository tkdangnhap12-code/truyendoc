import React, { useState } from 'react';
import { Story } from '../../types';
import { exportToTXT, exportToMarkdown, exportToDOCX, exportToEPUB, exportToPDFPrint, exportProjectJSON } from '../../lib/exporter';
import { Download, FileText, FileCode, FileSpreadsheet, Book, Printer, X, Check, Save } from 'lucide-react';

interface ExportModalProps {
  story: Story;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ story, isOpen, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<'docx' | 'epub' | 'pdf' | 'txt' | 'md' | 'json'>('json');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      switch (selectedFormat) {
        case 'json':
          exportProjectJSON(story);
          break;
        case 'txt':
          exportToTXT(story);
          break;
        case 'md':
          exportToMarkdown(story);
          break;
        case 'docx':
          exportToDOCX(story);
          break;
        case 'epub':
          await exportToEPUB(story);
          break;
        case 'pdf':
          exportToPDFPrint(story);
          break;
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 space-y-5">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded">
          <X className="w-4 h-4" />
        </button>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Xuất Tác Phẩm Truyện
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bộ truyện "{story.title}" ({story.chapters.length} chương)
          </p>
        </div>

        {/* Format Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={() => setSelectedFormat('json')}
            className={`p-3.5 rounded-lg border text-left flex items-start gap-3 transition-all sm:col-span-2 ${
              selectedFormat === 'json'
                ? 'bg-emerald-500/10 border-emerald-500/80 text-slate-900 dark:text-white shadow-sm ring-1 ring-emerald-500/30'
                : 'bg-slate-50 dark:bg-[#0A0A0B] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700/80'
            }`}
          >
            <Save className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-xs block text-slate-900 dark:text-white flex items-center gap-1.5">
                File Dự Án Sáng Tác (.json) <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded font-normal">Khuyên dùng để viết tiếp</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">Bao gồm toàn bộ nhân vật, lập dàn ý, cài đặt thế giới & các chương để nạp lại vào ứng dụng</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedFormat('docx')}
            className={`p-3.5 rounded-lg border text-left flex items-start gap-3 transition-all ${
              selectedFormat === 'docx'
                ? 'bg-emerald-500/10 border-emerald-500/80 text-slate-900 dark:text-white shadow-sm'
                : 'bg-slate-50 dark:bg-[#0A0A0B] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700/80'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-xs block text-slate-900 dark:text-white">DOCX (Word)</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">Microsoft Word chuẩn có bìa & mục lục</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedFormat('epub')}
            className={`p-3.5 rounded-lg border text-left flex items-start gap-3 transition-all ${
              selectedFormat === 'epub'
                ? 'bg-emerald-500/10 border-emerald-500/80 text-slate-900 dark:text-white shadow-sm'
                : 'bg-slate-50 dark:bg-[#0A0A0B] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700/80'
            }`}
          >
            <Book className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-xs block text-slate-900 dark:text-white">EPUB (E-Book)</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">Sách điện tử cho Kindle & điện thoại</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedFormat('pdf')}
            className={`p-3.5 rounded-lg border text-left flex items-start gap-3 transition-all ${
              selectedFormat === 'pdf'
                ? 'bg-emerald-500/10 border-emerald-500/80 text-slate-900 dark:text-white shadow-sm'
                : 'bg-slate-50 dark:bg-[#0A0A0B] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700/80'
            }`}
          >
            <Printer className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-xs block text-slate-900 dark:text-white">PDF / In Sách</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">Trình bày trang A4 có thể in trực tiếp</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedFormat('txt')}
            className={`p-3.5 rounded-lg border text-left flex items-start gap-3 transition-all ${
              selectedFormat === 'txt'
                ? 'bg-emerald-500/10 border-emerald-500/80 text-slate-900 dark:text-white shadow-sm'
                : 'bg-slate-50 dark:bg-[#0A0A0B] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700/80'
            }`}
          >
            <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-xs block text-slate-900 dark:text-white">TXT (Văn bản)</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">Văn bản thuần UTF-8 gọn nhẹ</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedFormat('md')}
            className={`p-3.5 rounded-lg border text-left flex items-start gap-3 transition-all sm:col-span-2 ${
              selectedFormat === 'md'
                ? 'bg-emerald-500/10 border-emerald-500/80 text-slate-900 dark:text-white shadow-sm'
                : 'bg-slate-50 dark:bg-[#0A0A0B] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700/80'
            }`}
          >
            <FileCode className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-xs block text-slate-900 dark:text-white">Markdown (.md)</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">Có thẻ heading & mục lục cho Obsidian / Github</span>
            </div>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium"
          >
            Hủy
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:opacity-60 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" /> {isExporting ? 'Đang Tạo File...' : 'Tải Xuất File Ngay'}
          </button>
        </div>
      </div>
    </div>
  );
};
