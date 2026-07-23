// Common Vietnamese typos, shorthands, and tone mark mis-keyings
export interface TypoItem {
  index: number;
  word: string;
  suggestion: string;
  type: 'spelling' | 'shorthand' | 'punctuation' | 'duplicate';
  reason: string;
}

export const COMMON_TYPOS_MAP: Record<string, string> = {
  'ko': 'không',
  'k0': 'không',
  'dc': 'được',
  'đc': 'được',
  'ng': 'người',
  'đag': 'đang',
  'dag': 'đang',
  'bik': 'biết',
  'bit': 'biết',
  'thik': 'thích',
  'thic': 'thích',
  'iu': 'yêu',
  'thui': 'thôi',
  'zậy': 'vậy',
  'vây': 'vậy',
  'ak': 'ạ',
  'nhìu': 'nhiều',
  'truớc': 'trước',
  'truoc': 'trước',
  'nguời': 'người',
  'ngừoi': 'người',
  'đuợc': 'được',
  'đựoc': 'được',
  'đừoc': 'được',
  'truờng': 'trường',
  'trừong': 'trường',
  'đưong': 'đường',
  'đừong': 'đường',
  'chửng': 'chứng',
  'thoại': 'thoại',
  'nguõ': 'ngõ',
  'zào': 'vào',
  'giồ': 'giờ',
  'rùi': 'rồi',
  'muôn': 'muốn',
  'lun': 'luôn',
  'lun.': 'luôn.',
  'đơp': 'đẹp',
};

// Comprehensive Vietnamese Synonym Dictionary
export const VIETNAMESE_SYNONYMS: Record<string, string[]> = {
  'nói': ['thốt lên', 'bộc bạch', 'thì thầm', 'quả quyết', 'phán', 'khẳng định', 'nhắc nhở', 'cất lời', 'bày tỏ', 'trình bày'],
  'nghĩ': ['trăn trở', 'suy tư', 'ngẫm nghĩ', 'suy xét', 'nghiền ngẫm', 'đắn đo', 'mơ tưởng', 'hình dung'],
  'nhìn': ['dõi theo', 'quan sát', 'đăm đăm', 'ngắm nhìn', 'dòm ngó', 'liếc nhìn', 'trông theo', 'chằm chằm'],
  'đi': ['rảo bước', 'sải bước', 'tiến tới', 'rời đi', 'bước đi', 'di chuyển', 'bão bước'],
  'chạy': ['lao đi', 'phóng như bay', 'vội vã', 'chạy thục mạng', 'bôn tẩu', 'guồng chân'],
  'đẹp': ['lộng lẫy', 'kiều diễm', 'mỹ lệ', 'tuyệt mỹ', 'thanh tú', 'diễm lệ', 'khôi ngô', 'tráng lệ'],
  'xấu': ['xấu xí', 'thô kệch', 'dị dạng', 'kém sắc', 'u tối', 'bẩn thiểu'],
  'buồn': ['sầu thảm', 'u uất', 'u sầu', 'sầu muộn', 'ảm đạm', 'não nuột', 'trăn trở', 'thâm trầm'],
  'vui': ['hân hoan', 'phấn khởi', 'rạng rỡ', 'vui sướng', 'thỏa nguyện', 'khoái cảm'],
  'tức giận': ['phẫn nộ', 'cuồng nộ', 'giận dữ', 'bất bình', 'nổi cơn thịnh nộ', 'hầm hầm'],
  'sợ': ['hoảng sợ', 'khiếp sợ', 'kinh hãi', 'sợ hãi', 'hoang mang', 'run rẩy', 'khiếp đảm'],
  'yêu': ['thương yêu', 'si mê', 'say đắm', 'thiết tha', 'mặn nồng', 'quyến quấn'],
  'khóc': ['nức nở', 'sụt sùi', 'rơi lệ', 'rưng rưng', 'lệ nhòa', 'nghẹn ngào'],
  'cười': ['mỉm cười', 'rạng rỡ', 'nghếch miệng', 'cười nụ', 'cười xòa', 'cười khúc khắc'],
  'mạnh': ['dũng mãnh', 'mãnh liệt', 'hùng mạnh', 'mạnh mẽ', 'kiên cường', 'vung sức'],
  'yếu': ['yếu ớt', 'mong manh', 'suy nhược', 'kiệt sức', 'xơ xác'],
  'lớn': ['mênh mông', 'đồ sộ', 'vĩ đại', 'bao la', 'ngất ngưởng', 'khổng lồ'],
  'nhỏ': ['bé nhỏ', 'nhỏ nhắn', 'tí hon', 'nhỏ bé', 'khiêm tốn', 'mỏng manh'],
  'nhanh': ['vút bay', 'thần tốc', 'chớp mắt', 'nhanh chóng', 'vội vã', 'hối hả'],
  'chậm': ['chậm rãi', 'thong thả', 'từ tốn', 'trễ nải', 'ung dung', 'chậm chạp'],
  'sáng': ['rực rỡ', 'chói lọi', 'lung linh', 'bừng sáng', 'quang đãng'],
  'tối': ['u tối', 'mịt mờ', 'tối tăm', 'mù mịt', 'u uất', 'âm u'],
  'lạnh': ['băng giá', 'lạnh buốt', 'lạnh ngắt', 'lạnh lẽo', 'giá lạnh'],
  'nóng': ['rực cháy', 'nóng bừng', 'oi ả', 'thiêu đốt', 'nóng nảy'],
  'chết': ['hy sinh', 'qua đời', 'từ trần', 'ngã xuống', 'tán gia', 'băng hà'],
  'sống': ['tồn tại', 'mưu sinh', 'vẫn còn đó', 'sinh sinh bất diệt'],
  'thời gian': ['khoảnh khắc', 'chốc lát', 'thời khắc', 'năm tháng', 'kỷ nguyên'],
  'không gian': ['khung cảnh', 'bầu không khí', 'vũ trụ', 'viễn cảnh'],
};

/**
 * Scans a Vietnamese text for typos, shorthand writing, repeated words, or missing spaces after punctuation.
 */
export function checkVietnameseTypos(text: string): TypoItem[] {
  if (!text) return [];

  const results: TypoItem[] = [];
  
  // 1. Check for missing spaces after punctuation (e.g. "tôi.Nhưng" or "xong,sau")
  const puncSpaceRegex = /([a-z0-9àáảãạăằắẳẵặnâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ])([.,!?:;])([a-z0-9àáảãạăằắẳẵặnâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵA-ZÀÁẢÃẠĂẰẮẲẴẶÂNẦẤẨẪẬEÈÉẺẼẸÊỀẾỂỄỆIÌÍỈĨỊOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢUÙÚỦŨỤƯỪỨỬỮỰYỲÝỶỸỴ])/g;
  let match: RegExpExecArray | null;
  
  while ((match = puncSpaceRegex.exec(text)) !== null) {
    results.push({
      index: match.index,
      word: match[0],
      suggestion: `${match[1]}${match[2]} ${match[3]}`,
      type: 'punctuation',
      reason: 'Thiếu dấu cách sau dấu câu',
    });
  }

  // 2. Check for duplicate adjacent words (e.g., "và và", "là là", "chương chương")
  const wordsWithIndex: { word: string; cleanWord: string; index: number }[] = [];
  const wordRegex = /\S+/g;
  while ((match = wordRegex.exec(text)) !== null) {
    const clean = match[0].replace(/^[^\wàáảãạăằắẳẵặnâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵA-Z]+|[^\wàáảãạăằắẳẵặnâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ]+$/g, '');
    wordsWithIndex.push({
      word: match[0],
      cleanWord: clean,
      index: match.index,
    });
  }

  for (let i = 0; i < wordsWithIndex.length - 1; i++) {
    const w1 = wordsWithIndex[i];
    const w2 = wordsWithIndex[i + 1];

    if (
      w1.cleanWord &&
      w1.cleanWord.length > 1 &&
      w1.cleanWord.toLowerCase() === w2.cleanWord.toLowerCase() &&
      !['ngày', 'mỗi', 'ai', 'người', 'nhà', 'đêm'].includes(w1.cleanWord.toLowerCase()) // allow reduplication like "ngày ngày", "nhà nhà"
    ) {
      results.push({
        index: w1.index,
        word: `${w1.word} ${w2.word}`,
        suggestion: w1.word,
        type: 'duplicate',
        reason: 'Lặp từ trùng lặp',
      });
    }
  }

  // 3. Check for dictionary typos & shorthand
  for (const item of wordsWithIndex) {
    const lowerClean = item.cleanWord.toLowerCase();
    if (COMMON_TYPOS_MAP[lowerClean]) {
      const suggestedClean = COMMON_TYPOS_MAP[lowerClean];
      // preserve capitalization if original word was capitalized
      const isCapitalized = item.cleanWord[0] && item.cleanWord[0] === item.cleanWord[0].toUpperCase();
      const finalSuggestion = isCapitalized
        ? suggestedClean.charAt(0).toUpperCase() + suggestedClean.slice(1)
        : suggestedClean;

      const fullReplacement = item.word.replace(item.cleanWord, finalSuggestion);

      results.push({
        index: item.index,
        word: item.word,
        suggestion: fullReplacement,
        type: lowerClean.length <= 3 ? 'shorthand' : 'spelling',
        reason: lowerClean.length <= 3 ? 'Từ viết tắt / Teen-code' : 'Lỗi chính tả / gõ nhầm Telex',
      });
    }
  }

  // Sort by index
  return results.sort((a, b) => a.index - b.index);
}

/**
 * Finds synonyms for a given word or phrase
 */
export function getSynonymsForWord(word: string): string[] {
  if (!word) return [];
  const clean = word.trim().toLowerCase();

  // Direct match
  if (VIETNAMESE_SYNONYMS[clean]) {
    return VIETNAMESE_SYNONYMS[clean];
  }

  // Partial or root match
  for (const key of Object.keys(VIETNAMESE_SYNONYMS)) {
    if (clean.includes(key) || key.includes(clean)) {
      return VIETNAMESE_SYNONYMS[key];
    }
  }

  return [];
}
