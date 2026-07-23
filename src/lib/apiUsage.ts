export interface ApiUsageStatus {
  status: 'normal' | 'warning' | 'critical';
  currentRPM: number;
  maxRPM: number;
  countLast5Min: number;
  max5MinQuota: number;
  rpmPercent: number;
  fiveMinPercent: number;
  estimatedMinutesToLimit: number;
  isEarlyWarning: boolean;
  resetSeconds: number;
  message: string;
  optimizationTips: string[];
  lastUpdated: number;
}

const DEFAULT_USAGE_STATUS: ApiUsageStatus = {
  status: 'normal',
  currentRPM: 0,
  maxRPM: 15,
  countLast5Min: 0,
  max5MinQuota: 45,
  rpmPercent: 0,
  fiveMinPercent: 0,
  estimatedMinutesToLimit: 10,
  isEarlyWarning: false,
  resetSeconds: 60,
  message: 'Tải hệ thống API đang ở mức an toàn.',
  optimizationTips: [
    'Gộp nội dung sáng tác (tạo dàn ý nhiều chương) thay vì gửi nhiều yêu cầu nhỏ',
    'Giãn khoảng thời gian chờ 10-15 giây giữa các lần tạo nội dung AI',
    'Sử dụng chế độ lưu bản nháp tự động để tránh gián đoạn công việc',
    'Tối ưu nội dung yêu cầu tùy chỉnh để nhận văn bản dài hơn trong 1 lần sinh'
  ],
  lastUpdated: Date.now(),
};

let currentUsageStatus: ApiUsageStatus = { ...DEFAULT_USAGE_STATUS };
const listeners: Set<(status: ApiUsageStatus) => void> = new Set();

export function getApiUsageStatus(): ApiUsageStatus {
  return currentUsageStatus;
}

export function subscribeApiUsage(listener: (status: ApiUsageStatus) => void): () => void {
  listeners.add(listener);
  listener(currentUsageStatus);
  return () => {
    listeners.delete(listener);
  };
}

export function updateApiUsageStatus(newStatus: Partial<ApiUsageStatus>) {
  currentUsageStatus = {
    ...currentUsageStatus,
    ...newStatus,
    lastUpdated: Date.now(),
  };
  listeners.forEach((listener) => listener(currentUsageStatus));
}

// Fetch usage status from server
export async function fetchApiUsageStatus(): Promise<ApiUsageStatus> {
  try {
    const res = await fetch('/api/ai/usage-status');
    if (res.ok) {
      const json = await res.json();
      if (json.usage) {
        updateApiUsageStatus(json.usage);
        return getApiUsageStatus();
      }
    }
  } catch (err) {
    console.warn('Failed to fetch API usage status:', err);
  }
  return currentUsageStatus;
}

// Intercept fetch responses or update from server response payload
export function notifyApiCallStart() {
  // Increment local count immediately for instantaneous feedback
  const now = Date.now();
  const currentRPM = currentUsageStatus.currentRPM + 1;
  const countLast5Min = currentUsageStatus.countLast5Min + 1;
  const rpmPercent = Math.min(100, Math.round((currentRPM / currentUsageStatus.maxRPM) * 100));
  const fiveMinPercent = Math.min(100, Math.round((countLast5Min / currentUsageStatus.max5MinQuota) * 100));
  
  const estimatedMinutesToLimit = Math.max(0.5, Number(((currentUsageStatus.maxRPM - currentRPM) / Math.max(1, currentRPM)).toFixed(1)));
  const isEarlyWarning = estimatedMinutesToLimit <= 5.0 || rpmPercent >= 65 || fiveMinPercent >= 65;

  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (rpmPercent >= 90) status = 'critical';
  else if (isEarlyWarning) status = 'warning';

  updateApiUsageStatus({
    currentRPM,
    countLast5Min,
    rpmPercent,
    fiveMinPercent,
    estimatedMinutesToLimit,
    isEarlyWarning,
    status,
    message: isEarlyWarning
      ? `CẢNH BÁO SỚM (Dưới 5 phút): Tần suất gửi yêu cầu tăng cao (${currentRPM}/${currentUsageStatus.maxRPM} req/phút - ${rpmPercent}%). Dự kiến chạm ngưỡng trong ~${estimatedMinutesToLimit} phút.`
      : `Tải hệ thống API: ${currentRPM}/${currentUsageStatus.maxRPM} req/phút.`,
    lastUpdated: now,
  });
}

export function handleApiResponseUsage(json: any) {
  if (json && json.usage) {
    updateApiUsageStatus(json.usage);
  } else {
    // Refresh status from server
    fetchApiUsageStatus();
  }
}
