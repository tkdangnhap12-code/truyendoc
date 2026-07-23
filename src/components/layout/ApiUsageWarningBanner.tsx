import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Zap,
  Info,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Gauge,
  Sparkles,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import {
  ApiUsageStatus,
  getApiUsageStatus,
  subscribeApiUsage,
  fetchApiUsageStatus,
  updateApiUsageStatus,
} from '../../lib/apiUsage';

interface ApiUsageWarningBannerProps {
  compactHeaderOnly?: boolean;
}

export const ApiUsageWarningBanner: React.FC<ApiUsageWarningBannerProps> = ({
  compactHeaderOnly = false,
}) => {
  const [usage, setUsage] = useState<ApiUsageStatus>(getApiUsageStatus());
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showOptimizationTips, setShowOptimizationTips] = useState(true);

  useEffect(() => {
    // Initial fetch
    fetchApiUsageStatus();

    // Subscribe to state changes
    const unsubscribe = subscribeApiUsage((newUsage) => {
      setUsage(newUsage);
      // Auto un-dismiss if status escalates to warning or critical
      if (newUsage.isEarlyWarning || newUsage.status === 'critical') {
        setIsDismissed(false);
      }
    });

    // Periodic polling every 12 seconds
    const interval = setInterval(() => {
      fetchApiUsageStatus();
    }, 12000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSimulateRequest = () => {
    // Helper for testing early warning
    const now = Date.now();
    const newRPM = usage.currentRPM + 4;
    const rpmPercent = Math.min(100, Math.round((newRPM / usage.maxRPM) * 100));
    const estimatedMinutes = Math.max(0.5, Number(((usage.maxRPM - newRPM) / 2.5).toFixed(1)));
    const isEarlyWarning = estimatedMinutes <= 5.0 || rpmPercent >= 65;

    updateApiUsageStatus({
      currentRPM: newRPM,
      countLast5Min: usage.countLast5Min + 4,
      rpmPercent,
      estimatedMinutesToLimit: estimatedMinutes,
      isEarlyWarning,
      status: isEarlyWarning ? 'warning' : 'normal',
      message: isEarlyWarning
        ? `CẢNH BÁO SỚM (Dưới 5 phút): Tần suất gửi yêu cầu tăng cao (${newRPM}/${usage.maxRPM} req/phút - ${rpmPercent}%). Dự kiến chạm ngưỡng trong ~${estimatedMinutes} phút.`
        : `Tải hệ thống API: ${newRPM}/${usage.maxRPM} req/phút.`,
      lastUpdated: now,
    });
  };

  // Status Badge Pill for Header / Sidebar
  if (compactHeaderOnly) {
    let badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    let iconColor = 'text-emerald-500';
    let statusText = `API: Bình thường (${usage.rpmPercent}%)`;

    if (usage.status === 'critical' || usage.rpmPercent >= 90) {
      badgeColor = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse';
      iconColor = 'text-rose-500';
      statusText = `API: Đạt giới hạn (${usage.currentRPM}/${usage.maxRPM})`;
    } else if (usage.isEarlyWarning || usage.status === 'warning') {
      badgeColor = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      iconColor = 'text-amber-500';
      statusText = `Cảnh báo 5 phút (~${usage.estimatedMinutesToLimit}m)`;
    }

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowDetailModal(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all hover:scale-102 ${badgeColor}`}
          title="Bấm để xem chi tiết tải API & Mẹo tối ưu gửi yêu cầu"
        >
          <Zap className={`w-3.5 h-3.5 ${iconColor}`} />
          <span>{statusText}</span>
        </button>

        {showDetailModal && (
          <ApiUsageDetailModal usage={usage} onClose={() => setShowDetailModal(false)} />
        )}
      </div>
    );
  }

  // Floating Gentle Reminder Banner (Active when warning threshold is hit)
  if (isDismissed || (!usage.isEarlyWarning && usage.status === 'normal' && !isMinimized)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full px-3 sm:px-0 transition-all duration-300">
      <div className="bg-slate-900/95 dark:bg-[#12131A]/95 backdrop-blur-md border border-amber-500/40 dark:border-amber-500/30 rounded-xl shadow-2xl overflow-hidden text-slate-100">
        {/* Top Header Strip */}
        <div className="bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-amber-600/10 px-4 py-2.5 flex items-center justify-between border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30 shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-300 tracking-tight flex items-center gap-1.5">
                CẢNH BÁO SỚM GIỚI HẠN API
                <span className="bg-amber-500/30 text-amber-200 text-[10px] px-1.5 py-0.2 rounded-full font-semibold border border-amber-400/30">
                  ~{usage.estimatedMinutesToLimit} phút tới
                </span>
              </h4>
              <p className="text-[11px] text-amber-200/80">Tần suất gửi yêu cầu đang tiệm cận ngưỡng tối đa</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-md hover:bg-white/10 text-slate-300 transition-colors"
              title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-md hover:bg-white/10 text-slate-300 transition-colors"
              title="Tạm ẩn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isMinimized && (
          <div className="p-4 space-y-3.5">
            {/* Progress Bar & Capacity Indicator */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  Công suất hiện tại ({usage.currentRPM}/{usage.maxRPM} req/phút):
                </span>
                <span className="font-bold text-amber-400">{usage.rpmPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, usage.rpmPercent)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Dự kiến đạt giới hạn: <b>~{usage.estimatedMinutesToLimit} phút</b></span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Làm mới sau {usage.resetSeconds}s
                </span>
              </div>
            </div>

            {/* Gentle Message & Reminder */}
            <p className="text-xs text-slate-200 leading-relaxed bg-amber-950/30 border border-amber-500/20 p-2.5 rounded-lg">
              <span className="font-semibold text-amber-300">Nhắc nhở nhẹ nhàng:</span> Bạn đang tương tác liên tục với AI. Hãy tối ưu tần suất gửi yêu cầu bên dưới để tránh gián đoạn sáng tác.
            </p>

            {/* Accordion Optimization Tips */}
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
              <button
                onClick={() => setShowOptimizationTips(!showOptimizationTips)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/30 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                  Mẹo tối ưu gửi yêu cầu (Khuyến nghị)
                </span>
                {showOptimizationTips ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showOptimizationTips && (
                <ul className="p-3 text-[11px] text-slate-300 space-y-2 border-t border-slate-800/60">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><b>Gộp yêu cầu:</b> Hãy sinh dàn ý nhiều chương hoặc đoạn dài trong 1 lượt tạo duy nhất.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><b>Giãn nhịp:</b> Chờ từ 10 - 15 giây giữa các thao tác tạo tự động tiếp theo.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><b>Lưu bản nháp:</b> Nội dung của bạn luôn được lưu tự động liên tục vào bộ nhớ nội địa.</span>
                  </li>
                </ul>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1 gap-2">
              <button
                onClick={handleSimulateRequest}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline decoration-slate-600 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Thử nghiệm cảnh báo
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDismissed(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm"
                >
                  Đã hiểu & Tối ưu ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDetailModal && (
        <ApiUsageDetailModal usage={usage} onClose={() => setShowDetailModal(false)} />
      )}
    </div>
  );
};

// Modal detail view for comprehensive monitoring
const ApiUsageDetailModal: React.FC<{ usage: ApiUsageStatus; onClose: () => void }> = ({
  usage,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111218] border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-5 text-slate-200 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Hệ Thống Giám Sát & Cảnh Báo Tần Suất API</h3>
              <p className="text-xs text-slate-400">Theo dõi thời gian thực và cảnh báo sớm trước 5 phút</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1">
            <div className="text-[11px] text-slate-400">Tải 1 phút gần nhất</div>
            <div className="text-lg font-bold text-amber-400 flex items-center gap-1.5">
              {usage.currentRPM} / {usage.maxRPM} req
              <span className="text-xs font-normal text-slate-400">({usage.rpmPercent}%)</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1">
            <div className="text-[11px] text-slate-400">Thời gian dự kiến đạt ngưỡng</div>
            <div className="text-lg font-bold text-emerald-400">
              ~{usage.estimatedMinutesToLimit} phút
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="p-3 rounded-lg border bg-amber-500/10 border-amber-500/30 text-amber-200 text-xs leading-relaxed">
          <b>Trạng thái:</b> {usage.message}
        </div>

        {/* Optimization Checklist */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Hướng dẫn tối ưu để tránh lỗi Rate Limit (429):
          </h4>
          <div className="space-y-1.5 text-xs text-slate-300">
            {usage.optimizationTips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center shrink-0 font-bold mt-0.5">
                  {idx + 1}
                </span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
          >
            Đóng bảng theo dõi
          </button>
        </div>
      </div>
    </div>
  );
};
