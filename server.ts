import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Initialize Google GenAI
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Helper model candidates order for automatic failover when 429 Rate Limit occurs
const MODEL_CANDIDATES = [
  "gemini-3.6-flash",
  "gemini-flash-latest"
];

// Robust non-streaming AI generator with automatic model fallback & rate limit retry
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  options: { contents: any; config?: any }
) {
  let lastError: any = null;

  for (const model of MODEL_CANDIDATES) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err || "");
        console.warn(`Model ${model} (Attempt ${attempt}) failed:`, errStr.slice(0, 150));
        
        if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || err?.status === 429) {
          // Wait 2.5 seconds before retrying or switching models
          await new Promise((resolve) => setTimeout(resolve, 2500));
        } else {
          // Non-rate-limit error (e.g. invalid parameter), break inner loop to try next candidate
          break;
        }
      }
    }
  }

  const errStr = String(lastError?.message || lastError || "");
  if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED")) {
    throw new Error("Hệ thống AI hiện đang đạt giới hạn tần suất API miễn phí của Gemini (Rate Limit 429). Vui lòng đợi 15-20 giây và bấm thực hiện lại!");
  }
  throw lastError || new Error("Không thể khởi tạo hoặc kết nối với Gemini AI.");
}

// Robust streaming AI generator with automatic model fallback & rate limit retry
async function callGeminiStreamWithFallback(
  ai: GoogleGenAI,
  options: { contents: any; config?: any }
) {
  let lastError: any = null;

  for (const model of MODEL_CANDIDATES) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents: options.contents,
          config: options.config,
        });
        return stream;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err || "");
        console.warn(`Streaming model ${model} (Attempt ${attempt}) failed:`, errStr.slice(0, 150));
        
        if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || err?.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 2500));
        } else {
          break;
        }
      }
    }
  }

  const errStr = String(lastError?.message || lastError || "");
  if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED")) {
    throw new Error("Hệ thống AI hiện đang đạt giới hạn tần suất API miễn phí của Gemini (Rate Limit 429). Vui lòng đợi 15-20 giây và bấm thực hiện lại!");
  }
  throw lastError || new Error("Không thể kết nối luồng với Gemini AI.");
}

// Clean text for prose - Strip all markdown asterisks (*, **, ***) and clean double spaces
function cleanTextForProse(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*{1,3}/g, "")
    .replace(/[ \t]{2,}/g, " ");
}

// --- API RATE LIMIT & USAGE TRACKING SYSTEM ---
const MAX_RPM = 15; // Standard Gemini Free Tier Requests Per Minute limit
const MAX_5MIN_QUOTA = 45; // Threshold for 5-minute request quota
const WARNING_MINUTES_THRESHOLD = 5.0; // Early warning when estimated time to limit <= 5 minutes

interface ApiRequestLog {
  timestamp: number;
  endpoint: string;
}

const apiRequestLogs: ApiRequestLog[] = [];

function calculateApiUsageMetrics() {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  const fifteenMinutesAgo = now - 15 * 60 * 1000;

  // Prune logs older than 15 minutes
  while (apiRequestLogs.length > 0 && apiRequestLogs[0].timestamp < fifteenMinutesAgo) {
    apiRequestLogs.shift();
  }

  const countLastMinute = apiRequestLogs.filter((log) => log.timestamp >= oneMinuteAgo).length;
  const countLast5Min = apiRequestLogs.filter((log) => log.timestamp >= fiveMinutesAgo).length;

  const rpmPercent = Math.min(100, Math.round((countLastMinute / MAX_RPM) * 100));
  const fiveMinPercent = Math.min(100, Math.round((countLast5Min / MAX_5MIN_QUOTA) * 100));

  const currentBurnRate = Math.max(countLastMinute, countLast5Min / 5);

  let estimatedMinutesToLimit = 10.0;
  if (currentBurnRate > 0) {
    const rpmRemaining = Math.max(0, MAX_RPM - countLastMinute);
    const fiveMinRemaining = Math.max(0, MAX_5MIN_QUOTA - countLast5Min);
    
    const minutesToRpmLimit = rpmRemaining / Math.max(0.5, currentBurnRate);
    const minutesToFiveMinLimit = (fiveMinRemaining / Math.max(0.5, currentBurnRate)) * 5;
    
    estimatedMinutesToLimit = Math.min(minutesToRpmLimit, minutesToFiveMinLimit);
  }

  const oldestInMinute = apiRequestLogs.find((log) => log.timestamp >= oneMinuteAgo);
  const resetSeconds = oldestInMinute
    ? Math.max(1, 60 - Math.floor((now - oldestInMinute.timestamp) / 1000))
    : 60;

  const isEarlyWarning =
    estimatedMinutesToLimit <= WARNING_MINUTES_THRESHOLD ||
    rpmPercent >= 65 ||
    fiveMinPercent >= 65;

  let status: "normal" | "warning" | "critical" = "normal";
  if (rpmPercent >= 90 || countLastMinute >= MAX_RPM) {
    status = "critical";
  } else if (isEarlyWarning) {
    status = "warning";
  }

  let message = "Tải hệ thống API đang ở mức an toàn.";
  if (status === "critical") {
    message = `CẢNH BÁO NGUY CẤP: Đã đạt ${countLastMinute}/${MAX_RPM} yêu cầu/phút (${rpmPercent}% giới hạn). Nguy cơ bị khóa tần suất 429!`;
  } else if (status === "warning") {
    message = `CẢNH BÁO SỚM (Dưới 5 phút): Tần suất gửi yêu cầu tăng cao (${countLastMinute}/${MAX_RPM} req/phút - ${rpmPercent}% công suất). Dự kiến chạm ngưỡng trong ~${estimatedMinutesToLimit.toFixed(1)} phút.`;
  }

  const optimizationTips = [
    "Gộp nội dung sáng tác (như tạo dàn ý nhiều chương cùng lúc) thay vì gửi nhiều yêu cầu nhỏ",
    "Giãn khoảng thời gian chờ 10 - 15 giây giữa các thao tác sinh câu chuyện bằng AI",
    "Sử dụng chế độ lưu bản nháp tự động để đảm bảo nội dung đã viết không bị gián đoạn",
    "Tối ưu lại các yêu cầu tùy chỉnh (custom prompt) để nhận kết quả dài hơn trong 1 lượt"
  ];

  return {
    status,
    currentRPM: countLastMinute,
    maxRPM: MAX_RPM,
    countLast5Min,
    max5MinQuota: MAX_5MIN_QUOTA,
    rpmPercent,
    fiveMinPercent,
    estimatedMinutesToLimit: Number(Math.max(0.5, estimatedMinutesToLimit).toFixed(1)),
    isEarlyWarning,
    resetSeconds,
    message,
    optimizationTips,
    lastUpdated: now,
  };
}

// Middleware to record AI requests and set rate limit early warning headers
app.use("/api/ai/*", (req, res, next) => {
  if (req.method !== "OPTIONS") {
    apiRequestLogs.push({
      timestamp: Date.now(),
      endpoint: req.originalUrl,
    });
  }

  const usage = calculateApiUsageMetrics();
  res.setHeader("X-API-RPM-Usage", `${usage.currentRPM}/${usage.maxRPM}`);
  res.setHeader("X-API-Early-Warning", usage.isEarlyWarning ? "true" : "false");
  res.setHeader("X-API-Estimated-Minutes-To-Limit", String(usage.estimatedMinutesToLimit));

  next();
});

// --- API ENDPOINTS ---

// API Usage & Rate Limit Early Warning Status
app.get("/api/ai/usage-status", (req, res) => {
  const usage = calculateApiUsageMetrics();
  res.json({ success: true, usage });
});

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. Generate Story Concept from Idea or Script
app.post("/api/ai/generate-story-concept", async (req, res) => {
  try {
    const { idea, script, paragraph, isScriptMode, isParagraphMode, genres, targetTone } = req.body;
    const ai = getAIClient();

    const isScript = Boolean(isScriptMode || (script && script.trim().length > 0));
    const isParagraph = Boolean(isParagraphMode || (paragraph && paragraph.trim().length > 0));

    let systemInstruction = `Bạn là một biên kịch và tiểu thuyết gia thiên tài.
Nhiệm vụ của bạn là tiếp nhận ý tưởng sơ khai từ người dùng và xây dựng nên cấu trúc một tiểu thuyết/truyện dài hoàn chỉnh, logic, cuốn hút.
Phản hồi bắt buộc phải trả về theo định dạng JSON hợp lệ. Không chèn markdown code blocks hay văn bản thừa bên ngoài JSON.`;

    if (isParagraph) {
      systemInstruction = `Bạn là một tiểu thuyết gia kiệt xuất và nhà phê bình văn học sắc bén.
Nhiệm vụ của bạn là phân tích một ĐOẠN VĂN / ĐOẠN TRÍCH VĂN HỌC (văn xuôi, đoạn trích truyện, câu chuyện ngắn) và mở rộng nó thành một cấu trúc TIỂU THUYẾT/TRUYỆN DÀI hoàn chỉnh, sâu sắc, giàu hình ảnh và kịch tính.
Phản hồi bắt buộc phải trả về theo định dạng JSON hợp lệ. Không chèn markdown code blocks hay văn bản thừa bên ngoài JSON.`;
    } else if (isScript) {
      systemInstruction = `Bạn là một biên kịch điện ảnh & nhà chuyển thể văn học chuyên nghiệp.
Nhiệm vụ của bạn là phân tích một KỊCH BẢN (film script, screenplay, kịch bản kịch/truyện) và chuyển thể nó thành một cấu trúc TIỂU THUYẾT hoàn chỉnh, chi tiết, giàu cảm xúc và kịch tính.
Phản hồi bắt buộc phải trả về theo định dạng JSON hợp lệ. Không chèn markdown code blocks hay văn bản thừa bên ngoài JSON.`;
    }

    let prompt = "";

    if (isParagraph) {
      prompt = `[ĐOẠN VĂN GỐC / ĐOẠN TRÍCH CẦN PHÓNG TÁC THÀNH BỘ TRUYỆN]
${(paragraph || idea || "").slice(0, 15000)}

Thể loại mong muốn: ${genres && genres.length > 0 ? genres.join(", ") : "Phiêu lưu, Trinh thám, Huyền bí"}
Tông giọng: ${targetTone || "Kịch tính, sâu sắc, giàu cảm xúc"}

Hãy phân tích kỹ đoạn văn trên (chiết xuất nhân vật, vật phẩm, bối cảnh, manh mối và tiềm năng phát triển cốt truyện) để xây dựng thành một hồ sơ bộ truyện dài hoàn chỉnh theo định dạng JSON gồm các trường:
{
  "title": "Tên tiểu thuyết ấn tượng do bạn sáng tác dựa trên đoạn văn",
  "pitch": "Tóm tắt cốt truyện mở rộng từ đoạn văn trong 2-3 câu",
  "genres": ["Thể loại 1", "Thể loại 2"],
  "worldRules": {
    "setting": "Bối cảnh không gian/thời gian được phác thảo & mở rộng từ đoạn văn",
    "magicOrTech": "Hệ thống sức mạnh/quy luật hoặc bối cảnh xã hội mở rộng",
    "historyAndFactions": "Lịch sử nền và các thế lực/phe phái được gợi mở từ đoạn văn"
  },
  "characters": [
    {
      "name": "Tên nhân vật xuất hiện hoặc được gợi ý trong đoạn văn",
      "role": "Nam chính / Nữ chính / Phản diện / Thứ chính",
      "age": "Tuổi dự đoán",
      "appearance": "Miêu tả ngoại hình bóc tách từ đoạn văn",
      "personality": "Tính cách thể hiện qua câu từ trong đoạn văn",
      "goals": "Mục tiêu chính của nhân vật",
      "strengths": "Điểm mạnh",
      "weaknesses": "Điểm yếu",
      "items": ["Vật phẩm mang theo trong đoạn văn"],
      "skills": ["Kỹ năng nổi bật"]
    }
  ],
  "relationships": [
    { "from": "Nhân vật A", "to": "Nhân vật B", "relation": "Mối quan hệ" }
  ],
  "outlineNodes": [
    {
      "id": "node-1",
      "title": "Tên mốc chương (Phát triển tiếp nối từ đoạn văn)",
      "description": "Tóm tắt diễn biến chương phát triển từ đoạn văn",
      "expandedScenes": [
        "Chi tiết phân cảnh 1...",
        "Chi tiết phân cảnh 2...",
        "Chi tiết phân cảnh 3..."
      ]
    }
  ],
  "initialTimeline": [
    { "day": "Mốc 1", "event": "Sự kiện diễn ra trong đoạn văn" }
  ]
}`;
    } else if (isScript) {
      prompt = `[KỊCH BẢN GỐC CẦN CHUYỂN THỂ]
${(script || idea || "").slice(0, 15000)}

Thể loại mong muốn: ${genres && genres.length > 0 ? genres.join(", ") : "Chuyển thể kịch bản, Điện ảnh"}
Tông giọng: ${targetTone || "Kịch tính, điện ảnh, sâu sắc"}

Hãy phân tích toàn bộ kịch bản trên và tự động xây dựng thành một hồ sơ bộ truyện hoàn chỉnh theo định dạng JSON gồm các trường:
{
  "title": "Tên tiểu thuyết hấp dẫn do bạn tự đặt dựa trên kịch bản",
  "pitch": "Tóm tắt cốt truyện cuốn hút của kịch bản trong 2-3 câu",
  "genres": ["Thể loại 1", "Thể loại 2"],
  "worldRules": {
    "setting": "Bối cảnh không gian/thời gian được chiết xuất từ các phân cảnh trong kịch bản",
    "magicOrTech": "Hệ thống sức mạnh hoặc bối cảnh xã hội/công nghệ theo kịch bản",
    "historyAndFactions": "Lịch sử nền và các thế lực/phe phái xuất hiện trong kịch bản"
  },
  "characters": [
    {
      "name": "Tên nhân vật",
      "role": "Nam chính / Nữ chính / Phản diện / Thứ chính",
      "age": "Tuổi (dự đoán hoặc theo kịch bản)",
      "appearance": "Miêu tả ngoại hình bóc tách từ chỉ dẫn kịch bản",
      "personality": "Tính cách qua thoại và hành động",
      "goals": "Mục tiêu nhân vật",
      "strengths": "Điểm mạnh",
      "weaknesses": "Điểm yếu",
      "items": ["Vật phẩm mang theo trong kịch bản"],
      "skills": ["Kỹ năng nổi bật"]
    }
  ],
  "relationships": [
    { "from": "Nhân vật A", "to": "Nhân vật B", "relation": "Mối quan hệ" }
  ],
  "outlineNodes": [
    {
      "id": "node-1",
      "title": "Tên mốc chương (Chuyển hóa từ các Cảnh/Hồi trong kịch bản)",
      "description": "Tóm tắt sự kiện chương này dựa trên phân đoạn kịch bản",
      "expandedScenes": [
        "Chi tiết phân cảnh 1...",
        "Chi tiết phân cảnh 2...",
        "Chi tiết phân cảnh 3..."
      ]
    }
  ],
  "initialTimeline": [
    { "day": "Mốc 1", "event": "Sự kiện bắt đầu kịch bản" }
  ]
}`;
    } else {
      prompt = `Ý tưởng ban đầu: "${idea || "Một cuộc phiêu lưu hấp dẫn"}"
Thể loại kết hợp: ${genres && genres.length > 0 ? genres.join(", ") : "Phiêu lưu, Fantasy"}
Tông giọng: ${targetTone || "Kịch tính, hấp dẫn"}

Hãy sáng tạo ra thông tin chi tiết cho bộ truyện theo định dạng JSON chuẩn gồm các trường:
{
  "title": "Tên truyện hấp dẫn, độc đáo",
  "pitch": "Tóm tắt cốt truyện ấn tượng trong 2-3 câu",
  "genres": ["Thể loại 1", "Thể loại 2"],
  "worldRules": {
    "setting": "Bối cảnh thế giới chi tiết",
    "magicOrTech": "Hệ thống sức mạnh/phép thuật/công nghệ (nếu có)",
    "historyAndFactions": "Lịch sử nền và các phe phái/quốc gia"
  },
  "characters": [
    {
      "name": "Tên nhân vật",
      "role": "Nam chính / Nữ chính / Đồng hành / Phản diện",
      "age": "Tuổi",
      "appearance": "Ngoại hình chi tiết",
      "personality": "Tính cách đặc trưng",
      "goals": "Mục tiêu chính",
      "strengths": "Điểm mạnh",
      "weaknesses": "Điểm yếu",
      "items": ["Vật phẩm mang theo 1", "Vật phẩm 2"],
      "skills": ["Kỹ năng 1", "Kỹ năng 2"]
    }
  ],
  "relationships": [
    { "from": "Tên nhân vật A", "to": "Tên nhân vật B", "relation": "Đồng đội / Kẻ thù / Tình nhân / Sư đồ" }
  ],
  "outlineNodes": [
    {
      "id": "node-1",
      "title": "Tên mốc dàn ý",
      "description": "Mô tả sự kiện quan trọng trong mốc này",
      "expandedScenes": [
        "Cảnh 1: Khởi đầu...",
        "Cảnh 2: Xung đột...",
        "Cảnh 3: Giải quyết và để lại manh mối..."
      ]
    }
  ],
  "initialTimeline": [
    { "day": "Ngày 1", "event": "Sự kiện khởi đầu" }
  ]
}`;
    }

    const response = await callGeminiWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.85,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error generating story concept:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate story concept" });
  }
});

// 4. Style Analysis
app.post("/api/ai/analyze-style", async (req, res) => {
  try {
    const { sampleText } = req.body;
    const ai = getAIClient();

    if (!sampleText || sampleText.trim().length < 50) {
      return res.status(400).json({ success: false, error: "Đoạn văn mẫu quá ngắn để phân tích." });
    }

    const prompt = `Hãy phân tích sâu văn phong của đoạn văn dưới đây để tạo thành một "Style Profile" (Hồ sơ văn phong) phục vụ việc viết truyện AI học theo:

---
${sampleText.slice(0, 10000)}
---

Trả về định dạng JSON gồm:
{
  "perspective": "Góc nhìn (Ngôi thứ nhất 'Tôi', ngôi thứ ba giới hạn, ngôi thứ ba toàn năng...)",
  "pacing": "Nhịp điệu văn (Nhanh, dồn dập / Chậm rãi, sâu lắng / Biến đổi linh hoạt)",
  "sentenceStructure": "Đặc điểm cấu trúc câu (Câu ngắn súc tích / Câu ghép giàu từ ngữ hình ảnh / Nhiều hội thoại...)",
  "vocabularyStyle": "Phong cách từ vựng (Cổ phong, hiện đại, giàu tính điện ảnh, u tối, giàu triết lý...)",
  "dialogueStyle": "Cách viết hội thoại (Tự nhiên, hóm hỉnh, sâu sắc, ngắn gọn...)",
  "sensoryDetailing": "Mức độ miêu tả giác quan (Thị giác, thính giác, xúc giác...)",
  "summaryGuideline": "Một hướng dẫn ngắn 3-4 câu để AI làm theo khi viết truyện mới mang đúng hồn cốt văn phong này."
}`;

    const response = await callGeminiWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error analyzing style:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to analyze style" });
  }
});

// 5. Generate Chapter (Streaming SSE support or Direct output)
app.post("/api/ai/generate-chapter", async (req, res) => {
  try {
    const {
      story,
      currentChapterIndex,
      targetOutlineNode,
      lengthOption, // "Ngắn" | "Trung bình" | "Dài" | "Siêu dài"
      selectedGenres,
      styleProfile,
      customPrompt,
      stream = true,
    } = req.body;

    const ai = getAIClient();

    // Multi-tier Prompt Construction
    const storyBibleStr = story?.worldRules
      ? `[STORY BIBLE / THẾ GIỚI GUY CẮN & QUY TẮC]
- Bối cảnh: ${story.worldRules.setting || "Chưa rõ"}
- Hệ thống sức mạnh/Phép thuật/Công nghệ: ${story.worldRules.magicOrTech || "Không"}
- Lịch sử & Phe phái: ${story.worldRules.historyAndFactions || "Không"}`
      : "";

    const characterMemoryStr = story?.characters?.length
      ? `[CHARACTER MEMORY / BỘ NHỚ NHÂN VẬT - BẮT BUỘC TUÂN THỦ KHÔNG ĐỔI TÊN/TÍNH CÁCH]
${story.characters
  .map(
    (c: any) =>
      `• ${c.name} (${c.role || "Nhân vật"}): Tuổi ${c.age || "?"}. Ngoại hình: ${c.appearance || ""}. Tính cách: ${c.personality || ""}. Mục tiêu: ${c.goals || ""}. Điểm mạnh: ${c.strengths || ""}. Điểm yếu: ${c.weaknesses || ""}. Vật phẩm sở hữu: [${(c.items || []).join(", ")}]. Kỹ năng: [${(c.skills || []).join(", ")}]`
  )
  .join("\n")}`
      : "";

    const timelineStr = story?.timeline?.length
      ? `[TIMELINE / DÒNG THỜI GIAN ĐÃ DIỄN RA]
${story.timeline.map((t: any) => `- ${t.day}: ${t.event}`).join("\n")}`
      : "";

    const previousChapter = story?.chapters?.[currentChapterIndex - 1];
    const previousContextStr = previousChapter
      ? `[NỘI DUNG CHƯƠNG TRƯỚC (Chương ${currentChapterIndex}): "${previousChapter.title}"]
Tóm tắt/Những dòng cuối chương trước:
"${previousChapter.content.slice(-1500)}"`
      : "[CHƯƠNG ĐẦU TIÊN CỦA BỘ TRUYỆN]";

    const styleStr = styleProfile
      ? `[HỒ SƠ VĂN PHONG MẪU CẦN HỌC THEO]
- Góc nhìn: ${styleProfile.perspective || ""}
- Nhịp văn: ${styleProfile.pacing || ""}
- Từ vựng: ${styleProfile.vocabularyStyle || ""}
- Hội thoại: ${styleProfile.dialogueStyle || ""}
- Hướng dẫn: ${styleProfile.summaryGuideline || ""}`
      : "";

    let lengthInstruction = "Mỗi chương viết tối thiểu 2000-3000 từ, miêu tả chi tiết sống động.";
    if (lengthOption === "Ngắn") lengthInstruction = "Độ dài vừa phải (~1000 - 1500 từ), tập trung tình tiết chính.";
    if (lengthOption === "Trung bình") lengthInstruction = "Độ dài trung bình (~2000 - 3000 từ), cân bằng giữa miêu tả và diễn biến.";
    if (lengthOption === "Dài") lengthInstruction = "Độ dài chi tiết (~3500 - 5000 từ), miêu tả sâu tâm lý, bối cảnh, hội thoại sinh động.";
    if (lengthOption === "Siêu dài") lengthInstruction = "Độ dài cực lớn (~5000 - 8000 từ), như tiểu thuyết xuất bản chuyên nghiệp, triển khai từng phân cảnh tỉ mỉ, đầy đủ diễn biến, cảm xúc, hành động, không bỏ sót chi tiết nhỏ nào.";

    const systemInstruction = `Bạn là một Tiểu Thuyết Gia Bậc Thầy chuyên nghiệp.
Nhiệm vụ của bạn là sáng tác CHƯƠNG ${currentChapterIndex + 1} cho bộ truyện "${story?.title || "Mới"}".

[YÊU CẦU NGHỆ THUẬT QUAN TRỌNG]
1. Viết bằng tiếng Việt chau chuốt, giàu hình ảnh, cảm xúc, hội thoại tự nhiên, không bị lặp từ.
2. TUÂN THỦ TUYỆT ĐỐI BỘ NHỚ NHÂN VẬT & THẾ GIỚI. Không tự ý đổi tên, đổi tính cách hay biến mất vật phẩm của nhân vật.
3. Không tóm tắt qua loa! Hãy miêu tả chi tiết từng cử chỉ, ánh mắt, âm thanh môi trường, nội tâm nhân vật và bối cảnh.
4. Đầu chương mở ra sinh động, giữa chương là cao trào xung đột, cuối chương tạo NÚT THẮT MỞ (Cliffhanger) hấp dẫn kéo người đọc sang chương tiếp theo.
5. Luôn ghi tiêu đề chương ở dòng đầu tiên dạng: "Chương X: [Tên chương ngắn gọn, độc đáo, ấn tượng do bạn tự đặt dựa trên diễn biến chính]. TUYỆT ĐỐI KHÔNG ghi 'Diễn biến kịch tính' hay tên chung chung.
6. TUYỆT ĐỐI KHÔNG SỬ DỤNG DẤU SAO (*) HOẶC MARKDOWN ĐỊNH DẠNG (*, **, ***) TRONG VĂN BẢN TRUYỆN. Viết câu văn xuôi thuần túy tiếng Việt không chứa dấu *.
7. ${lengthInstruction}`;

    const userPromptText = `[THÔNG TIN DÀN Ý VÀ MỤC TIÊU CHƯƠNG NÀY]
Tên mốc dàn ý: ${targetOutlineNode?.title || "Diễn biến tiếp theo"}
Mô tả mốc: ${targetOutlineNode?.description || "Tiếp tục mạch truyện kịch tính"}
Các cảnh cần triển khai:
${(targetOutlineNode?.scenes || targetOutlineNode?.expandedScenes || []).map((s: string, idx: number) => `${idx + 1}. ${s}`).join("\n")}

${customPrompt ? `[YÊU CẦU BỔ SUNG TỪ TÁC GIẢ]: ${customPrompt}` : ""}

${storyBibleStr}

${characterMemoryStr}

${timelineStr}

${previousContextStr}

${styleStr}

[YÊU CẦU]: Hãy bắt đầu viết CHƯƠNG ${currentChapterIndex + 1} ngay bây giờ. Viết hoàn chỉnh, sinh động, kịch tính, không cắt xén!`;

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const responseStream = await callGeminiStreamWithFallback(ai, {
        contents: userPromptText,
        config: {
          systemInstruction,
          temperature: 0.85,
        },
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } else {
      const response = await callGeminiWithFallback(ai, {
        contents: userPromptText,
        config: {
          systemInstruction,
          temperature: 0.85,
        },
      });

      res.json({ success: true, text: response.text });
    }
  } catch (error: any) {
    console.error("Error generating chapter:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message || "Failed to generate chapter" });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

// 6. Continue / Extend Chapter
app.post("/api/ai/continue-chapter", async (req, res) => {
  try {
    const { story, currentChapterText, customInstruction } = req.body;
    const ai = getAIClient();

    const systemInstruction = `Bạn là tiểu thuyết gia chuyên nghiệp. Hãy viết nối tiếp chính xác đoạn văn dang dở của chương truyện dưới đây.
Đảm bảo liền mạch ngữ cảnh, đúng văn phong, nhân vật, không bị ngắt quãng.`;

    const prompt = `[TRUYỆN]: ${story?.title || ""}
[BỘ NHỚ NHÂN VẬT]: ${JSON.stringify(story?.characters || [])}

[ĐOẠN NỘI DUNG HIỆN TẠI ĐANG DỪNG BẬC]:
"...${currentChapterText.slice(-2000)}"

${customInstruction ? `[YÊU CẦU NỐI TIẾP]: ${customInstruction}` : "Hãy tiếp tục viết nối tiếp đoạn trên một cách tự nhiên, gia tăng kịch tính và miêu tả chân thực."}

Hãy viết tiếp khoảng 800 - 1500 từ tiếp theo!`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const responseStream = await callGeminiStreamWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error("Error continuing chapter:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

// 7. Rewrite Chapter with Parameters
app.post("/api/ai/rewrite-chapter", async (req, res) => {
  try {
    const { chapterText, rewriteMode, story } = req.body;
    const ai = getAIClient();

    // rewriteMode options: "gay_can" | "cam_dong" | "hai_huoc" | "u_toi" | "nhieu_hoi_thoai" | "nhieu_mieu_ta" | "nhanh" | "cham"

    const modePrompts: Record<string, string> = {
      gay_can: "Tăng cường độ kịch tính, dồn dập, nguy hiểm sát nút và tình tiết giật gân.",
      cam_dong: "Nhấn mạnh vào tâm lý, chiều sâu cảm xúc, sự tổn thương và khoảnh khắc lắng đọng nội tâm.",
      hai_huoc: "Chèn thêm các chi tiết dí dỏm, sự đối đáp tấu hài, trớ trêu nhẹ nhàng.",
      u_toi: "Gia tăng không khí u ám, rùng rợn, bí ẩn và căng thẳng tâm lý.",
      nhieu_hoi_thoai: "Tăng cường tần suất đối đáp, lời thoại hóm hỉnh sinh động giữa các nhân vật.",
      nhieu_mieu_ta: "Đẩy mạnh miêu tả bối cảnh, âm thanh, ánh sáng, giác quan và chi tiết hành động tỉ mỉ.",
      nhanh: "Đẩy nhanh nhịp điệu, cô đọng hành động, bớt miêu tả rườm rà.",
      cham: "Hạ nhịp điệu, đi sâu miêu tả tâm lý và tiểu tiết môi trường tỉ mỉ.",
    };

    const modeInstruction = modePrompts[rewriteMode] || "Viết lại chương văn mượt mà và sinh động hơn.";

    const systemInstruction = `Bạn là một biên tập viên kiêm nhà văn xuất sắc. Nhiệm vụ của bạn là VIẾT LẠI (Rewrite) toàn bộ chương truyện dưới đây theo hướng điều chỉnh phong cách được chỉ định, nhưng BẮT BUỘC GIỮ NGUYÊN mạch cốt truyện và tên nhân vật.`;

    const prompt = `[TRUYỆN]: ${story?.title || ""}
[YÊU CẦU ĐIỀU CHỈNH REWRITE]: ${modeInstruction}

[NỘI DUNG CHƯƠNG CŨ]:
${chapterText}

Hãy viết lại toàn bộ chương truyện theo phong cách mới!`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const responseStream = await callGeminiStreamWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.85,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error("Error rewriting chapter:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

// 8. AI Logic Audit & Auto Memory Update (Detect & Fix Logic Errors + Clean Prose)
app.post("/api/ai/audit-and-update-memory", async (req, res) => {
  try {
    const { story, chapterText } = req.body;
    const ai = getAIClient();

    const prompt = `Bạn là trợ lý Kiểm Soát Logic Truyện (Continuity & Story Memory Auditor).
Nhiệm vụ của bạn là đọc chương truyện vừa viết dưới đây, đối chiếu với Bộ Nhớ Hiện Tại của truyện "${story?.title || ""}", kiểm tra tính logic và TỰ ĐỘNG SỬA ĐỔI nếu phát hiện lỗi mâu thuẫn.

[BỘ NHỚ HIỆN TẠI CỦA TRUYỆN]:
Characters: ${JSON.stringify(story?.characters || [])}
Timeline: ${JSON.stringify(story?.timeline || [])}

[CHƯƠNG VỪA VIẾT]:
${chapterText.slice(0, 8000)}

Hãy thực hiện 3 việc:
1. Đánh giá tính logic & phát hiện lỗi mâu thuẫn (nhân vật bị đổi tên, sai thuộc tính/vật phẩm, sai mốc thời gian, diễn biến vô lý).
2. NẾU PHÁT HIỆN ĐIỂM THIẾU LOGIC: Hãy TỰ ĐỘNG SỬA LẠI ĐOẠN/TOÀN BỘ CHƯƠNG TRUYỆN BỊ LỖI LẠI THÀNH VĂN BẢN MỚI (correctedChapterText) sao cho khắc phục triệt để điểm thiếu logic đó. Nếu không có lỗi logic, trả về correctedChapterText rỗng hoặc giữ nguyên.
3. Đề xuất bản CẬP NHẬT BỘ NHỚ TRUYỆN (Story Memory) sau chương này.

[YÊU CẦU ĐỊNH DẠNG BẮT BUỘC]:
- TUYỆT ĐỐI KHÔNG SỬ DỤNG BẤT KỲ DẤU SAO (*) HOẶC MARKDOWN ĐỊNH DẠNG (*, **, ***) TRONG TẤT CẢ VĂN BẢN (bản sửa, báo cáo, cập nhật). Viết hoàn toàn bằng văn xuôi tiếng Việt thuần túy.

Trả về định dạng JSON duy nhất:
{
  "auditScore": 95,
  "hasLogicErrors": false,
  "logicIssues": ["Chi tiết các điểm không logic phát hiện được (nếu có)..."],
  "correctedChapterText": "Văn bản chương truyện hoàn chỉnh đã được tự động sửa đổi triệt để khắc phục các lỗi logic trên. TUYỆT ĐỐI KHÔNG chứa dấu *.",
  "suggestedUpdates": {
    "newTimelineEvent": { "day": "Ngày X", "event": "Sự kiện xảy ra trong chương" },
    "characterUpdates": [
      { "name": "Tên nhân vật", "addedItems": ["Vật phẩm mới"], "updatedNotes": "Ghi chú trạng thái mới" }
    ],
    "newCharacters": []
  }
}`;

    const response = await callGeminiWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || "{}");

    // Clean all prose outputs from any stray markdown asterisks
    if (parsed.correctedChapterText) {
      parsed.correctedChapterText = cleanTextForProse(parsed.correctedChapterText);
    }
    if (Array.isArray(parsed.logicIssues)) {
      parsed.logicIssues = parsed.logicIssues.map((issue: string) => cleanTextForProse(issue));
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error auditing chapter:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to audit" });
  }
});

// 9. AI Synonyms & Style Suggestions
app.post("/api/ai/synonyms", async (req, res) => {
  try {
    const { word, contextSentence } = req.body;
    const ai = getAIClient();

    const prompt = `Bạn là một chuyên gia từ vựng và nhà văn văn học Việt Nam.
Hãy tìm 6-8 từ/cụm từ đồng nghĩa, giàu hình ảnh, trau chuốt nghệ thuật hoặc biểu cảm cao cho từ/cụm từ: "${word}".
${contextSentence ? `Trong ngữ cảnh câu văn: "${contextSentence}"` : ''}

Trả về định dạng JSON:
{
  "word": "${word}",
  "synonyms": [
    { "term": "Từ đồng nghĩa 1", "nuance": "Sắc thái ngắn gọn (ví dụ: Sang trọng, Bi kịch, Kịch tính, Dịu dàng...)" }
  ]
}`;

    const response = await callGeminiWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error getting synonyms:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get synonyms" });
  }
});

// 10. AI Character Suggestions based on story context & multiple story arcs
app.post("/api/ai/suggest-characters", async (req, res) => {
  try {
    const { story } = req.body;
    const ai = getAIClient();

    const existingCharNames = (story?.characters || []).map((c: any) => `${c.name} (${c.role || 'Nhân vật'})`).join(', ');

    const prompt = `Bạn là một biên kịch kiêm cố vấn xây dựng tuyến nhân vật tiểu thuyết chuyên nghiệp.
Dựa vào thông tin tác phẩm dưới đây:
- Tên truyện: "${story?.title || 'Chưa đặt tên'}"
- Tóm tắt cốt truyện: "${story?.pitch || 'Chưa có'}"
- Thể loại: ${(story?.genres || []).join(', ') || 'Tự do'}
- Tông giọng: "${story?.targetTone || 'Kịch tính'}"
- Bối cảnh thế giới: "${story?.worldRules?.setting || 'Mặc định'}"
- Nhân vật hiện có: [${existingCharNames || 'Chưa có'}]
- Các mốc dàn ý: [${(story?.outlineNodes || []).map((n: any) => n.title).join(', ')}]

Hãy sáng tạo ra 4 đến 6 nhân vật mới ĐỘC ĐÁO, HỢP LOGIC, phù hợp với các tuyến câu chuyện khác nhau (như: Tuyến phản diện ngầm, Tuyến đồng minh sư phụ, Tuyến đối thủ cạnh tranh, Tuyến giữ bí mật cổ đại, Tuyến tình cảm kịch tính, Tuyến gián điệp hai mặt, v.v.).

Trả về định dạng JSON duy nhất như sau:
{
  "suggestedCharacters": [
    {
      "name": "Tên nhân vật mới",
      "role": "Nam chính / Nữ chính / Phản diện / Đồng minh / Sư phụ / Đối thủ / Nhân vật bí ẩn",
      "storylineArc": "Tên tuyến truyện mở ra (ví dụ: 'Tuyến bí mật thân thế', 'Tuyến xung đột quyền lực', 'Tuyến gia tộc & thù hận')",
      "fitReason": "Giải thích ngắn 1-2 câu vì sao sự xuất hiện của nhân vật này rất logic và làm giàu cho cốt truyện",
      "age": "Tuổi",
      "appearance": "Ngoại hình chi tiết ấn tượng",
      "personality": "Tính cách đặc trưng",
      "goals": "Mục tiêu & Động cơ hành động",
      "strengths": "Điểm mạnh nổi bật",
      "weaknesses": "Điểm yếu / Gót chân Achilles",
      "items": ["Vật phẩm 1", "Vật phẩm 2"],
      "skills": ["Kỹ năng 1", "Kỹ năng 2"],
      "suggestedRelationships": [
        {
          "from": "Tên nhân vật mới này",
          "to": "Tên một nhân vật hiện có trong truyện",
          "relation": "Mối quan hệ kịch tính (ví dụ: 'Kẻ thù truyền kiếp', 'Sư đồ ẩn danh', 'Đối thủ cạnh tranh', 'Bảo hộ thầm lặng')"
        }
      ]
    }
  ]
}`;

    const response = await callGeminiWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.85,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error suggesting characters:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to suggest characters" });
  }
});

// 11. AI Build & Expand Story Plot Outline based on author summary & selected style
app.post("/api/ai/build-story-outline", async (req, res) => {
  try {
    const { summary, styleTone, detailLevel = 'deep', existingStory } = req.body;
    const ai = getAIClient();

    const charList = (existingStory?.characters || []).map((c: any) => `${c.name} (${c.role || 'Nhân vật'})`).join(', ');

    const nodeCount = detailLevel === 'deep' ? '8 đến 14' : '5 đến 8';

    const prompt = `Bạn là một kiến trúc sư cốt truyện kiêm biên kịch tiểu thuyết cao cấp.
Tác giả vừa cung cấp tóm tắt/ý tưởng ban đầu cho bộ truyện và lựa chọn văn phong thể hiện như sau:

---
- TÊN TRUYỆN: "${existingStory?.title || 'Chưa đặt tên'}"
- TÓM TẮT DỰ ĐỊNH CỦA TÁC GIẢ: "${summary || existingStory?.pitch || 'Cốt truyện kịch tính hấp dẫn'}"
- VĂN PHONG & TÔNG GIỌNG ĐÃ CHỌN: "${styleTone || 'Kịch tính, lôi cuốn, chặt chẽ'}"
- NHÂN VẬT HIỆN CÓ: [${charList || 'Chưa có'}]
- THỂ LOẠI: ${(existingStory?.genres || []).join(', ') || 'Tự do'}
---

Nhiệm vụ của bạn:
1. Hoàn thiện và mở rộng tóm tắt cốt truyện toàn bộ bộ truyện (expandedPitch) sao cho hấp dẫn, có mở đầu, thắt nút, đẩy cao trào kịch tính, và mở ra hướng giải quyết bùng nổ.
2. Xây dựng một dàn ý chi tiết gồm ${nodeCount} mốc sự kiện (outlineNodes) xếp theo đúng tiến trình thời gian câu chuyện (Cấu trúc 3 hồi hoặc Tuyến chuyển biến logic).
3. Với mỗi mốc dàn ý, tự động phân tích và chia ra 3 đến 5 phân cảnh chi tiết (expandedScenes) mô tả hành động, cảm xúc, xung đột và nút thắt.

Trả về định dạng JSON duy nhất như sau:
{
  "expandedPitch": "Tóm tắt cốt truyện hoàn chỉnh, giàu sức hấp dẫn và kịch tính trong 3-5 câu",
  "recommendedTone": "Tông giọng & Văn phong thể hiện khuyến nghị",
  "suggestedGenres": ["Thể loại 1", "Thể loại 2"],
  "worldSettingHint": "Gợi ý ngắn về bối cảnh không gian/thời gian phù hợp",
  "outlineNodes": [
    {
      "title": "Tên mốc dàn ý kịch tính (Ví dụ: 'Mốc 1: Biến cố gia tộc & Trọng sinh')",
      "description": "Tóm tắt ngắn gọn biến cố chính xảy ra ở mốc này",
      "expandedScenes": [
        "Cảnh 1: Mở đầu không khí...",
        "Cảnh 2: Bùng nổ xung đột...",
        "Cảnh 3: Cao trào và hậu quả...",
        "Cảnh 4: Manh mối mở ra bước ngoặt mới..."
      ]
    }
  ]
}`;

    const response = await callGeminiWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.85,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error building story outline:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to build story outline" });
  }
});

// 12. AI Re-align Story Plot & Rewrite Chapters based on edited plot summary
app.post("/api/ai/realign-story-plot", async (req, res) => {
  try {
    const { editedPitch, styleTone, existingStory, recreateChapters = true } = req.body;
    const ai = getAIClient();

    const oldPitch = existingStory?.pitch || 'Chưa có tóm tắt cũ';
    const chapters = existingStory?.chapters || [];
    const characters = existingStory?.characters || [];

    const existingChaptersSummary = chapters
      .map((c: any) => `Chương ${c.chapterNumber}: "${c.title}" (Độ dài: ${c.wordCount || 0} từ) - Nội dung vắn tắt: ${(c.content || '').slice(0, 300)}...`)
      .join('\n');

    const prompt = `Bạn là một biên kịch & cố vấn sáng tác tiểu thuyết chuyên nghiệp.
Tác giả vừa chỉnh sửa / thay đổi TÓM TẮT CỐT TRUYỆN của tác phẩm "${existingStory?.title || 'Tiểu thuyết'}".

---
- TÓM TẮT CŨ BAN ĐẦU: "${oldPitch}"
- TÓM TẮT MỚI TÁC GIẢ VỪA SỬA ĐỔI: "${editedPitch}"
- VĂN PHONG / TÔNG GIỌNG CHỌN: "${styleTone || existingStory?.targetTone || 'Kịch tính, lôi cuốn'}"
- DANH SÁCH NHÂN VẬT: ${characters.map((c: any) => c.name).join(', ') || 'Chưa có'}
- CÁC CHƯƠNG ĐÃ VIẾT TRƯỚC ĐÂY (${chapters.length} chương):
${existingChaptersSummary || '(Chưa viết chương nào)'}
---

Yêu cầu nhiệm vụ:
Dựa trên sự thay đổi trong Tóm tắt cốt truyện mới, hãy thực hiện TÁI CẤU TRÚC LOGIC VÀ NỘI DUNG TÁC PHẨM:
1. Hoàn thiện Tóm tắt cốt truyện mới (expandedPitch) sao cho mạch lạc, kịch tính và nhất quán logic.
2. Viết Phân tích chuyển biến logic (adaptationNotes): Giải thích vắn tắt những thay đổi về động cơ nhân vật, nút thắt, và diễn biến mới so với phiên bản cũ.
3. Tạo lại Dàn ý các mốc sự kiện (adaptedOutlineNodes): 6 đến 12 mốc dàn ý phù hợp hoàn toàn với cốt truyện mới.
4. ${recreateChapters && chapters.length > 0 ? "TÁI VIẾT LẠI TẤT CẢ " + chapters.length + " CHƯƠNG ĐÃ VIẾT: Viết lại nội dung văn bản từng chương (adaptedChapters) với độ dài tương đương hoặc sâu sắc hơn, tuân thủ chặt chẽ cốt truyện mới đã sửa đổi. Dù chương đã được viết từ trước, nội dung sẽ được tái kiến thiết lại theo hướng đi mới." : 'Tạo tóm tắt định hướng viết mới cho các chương.'}

Trả về định dạng JSON duy nhất như sau:
{
  "expandedPitch": "Tóm tắt cốt truyện hoàn chỉnh đã chau chuốt theo ý tưởng mới",
  "adaptationNotes": "Tóm tắt ngắn gọn 3-4 điểm thay đổi logic chính trong câu chuyện",
  "recommendedTitle": "Tên truyện đề xuất (nếu đổi) hoặc giữ nguyên tên cũ",
  "adaptedOutlineNodes": [
    {
      "title": "Mốc 1: ...",
      "description": "Mô tả mốc theo cốt truyện mới",
      "expandedScenes": ["Cảnh 1...", "Cảnh 2..."]
    }
  ],
  "adaptedChapters": [
    {
      "chapterNumber": 1,
      "title": "Tiêu đề chương 1 mới theo cốt truyện sửa đổi",
      "summary": "Tóm tắt chương 1 mới",
      "content": "Nội dung văn bản chi tiết chương 1 đã được viết lại toàn bộ theo cốt truyện mới..."
    }
  ]
}`;

    const response = await callGeminiWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.85,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error realigning story plot:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to realign story plot" });
  }
});

// --- VITE / EXPRESS BOOTSTRAP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Story Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
