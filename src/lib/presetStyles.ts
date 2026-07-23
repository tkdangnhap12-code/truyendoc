import { StyleProfile } from '../types';

export const PRESET_STYLE_PROFILES: StyleProfile[] = [
  // 1. Kiếm Hiệp
  {
    id: 'preset-kim-dung',
    name: 'Kiếm Hiệp / Võ Lâm Cổ Điển (Kim Dung)',
    category: 'Kiếm Hiệp & Tu Tiên',
    description: 'Giọng văn hào hùng tráng lệ, từ ngữ Hán Việt đắt giá, tả trận đánh đao quang kiếm ảnh và tình trúng khí hiếm có.',
    perspective: 'Ngôi thứ ba toàn năng, uy nghi và cổ kính',
    pacing: 'Nhịp điệu biến chuyển linh hoạt, đan xen giữa đối thoại thâm thúy và võ thuật nảy lửa',
    sentenceStructure: 'Mạch văn đăng đối, sử dụng nhiều thành ngữ Hán Việt và lối diễn đạt cổ điển',
    vocabularyStyle: 'Cổ phong trang trọng, đậm chất kiếm hiệp giang hồ',
    dialogueStyle: 'Mực thước, trật tự, mang trọn phong thái hiệp khách võ lâm',
    sensoryDetailing: 'Tả ánh thép, âm thanh khí giới va chạm, luồng chưởng lực và không khí kiêu hùng',
    summaryGuideline: 'Sử dụng giọng văn tráng lệ cổ điển, miêu tả sinh động thế giới giang hồ, xưng hô chuẩn kiếm hiệp.',
    isPreset: true,
  },
  // 2. Tiên Hiệp
  {
    id: 'preset-tien-hiep',
    name: 'Tiên Hiệp / Huyền Huyễn Hoành Tráng',
    category: 'Kiếm Hiệp & Tu Tiên',
    description: 'Khí thế bàng bạc, miêu tả sinh động thế giới tu tiên rộng lớn, linh lực cuồng bạo và chí hướng ngút trời.',
    perspective: 'Ngôi thứ ba toàn năng, tầm vóc vũ trụ',
    pacing: 'Nhịp dồn dập kịch tính trong giao tranh, tĩnh lặng lúc ngộ đạo',
    sentenceStructure: 'Mạch văn hào hùng, giàu câu miêu tả linh lực, bối cảnh thiên địa quy tắc',
    vocabularyStyle: 'Hán Việt uy nghi, tráng lệ, đậm chất tu tiên xé rách hư không',
    dialogueStyle: 'Quả quyết, bộc lộ chí hướng kiên định, uy áp nghẹt thở',
    sensoryDetailing: 'Tả linh quang ngũ sắc, uy áp đại đạo, bầu trời nứt nẻ, rung chuyển núi sông',
    summaryGuideline: 'Thể hiện không khí tu tiên hoành tráng, giao tranh bộc phát sinh tử, miêu tả cảnh quan kỳ vĩ.',
    isPreset: true,
  },
  // 3. Lãng Mạn Hoài Niệm
  {
    id: 'preset-nguyen-nhat-anh',
    name: 'Lãng Mạn / Hoài Niệm Tuổi Trẻ (Nguyễn Nhật Ánh)',
    category: 'Ngôn Tình & Lãng Mạn',
    description: 'Giọng văn mộc mạc, trong trẻo, giàu chất thơ, miêu tả những rung động nhẹ nhàng và ký ức đẹp đẽ.',
    perspective: 'Ngôi thứ nhất "Tôi" chân thành hoặc ngôi thứ ba hoài niệm',
    pacing: 'Chậm rãi, sâu lắng, nhịp nhàng như khúc ca êm dịu',
    sentenceStructure: 'Câu văn ngắn gọn, tự nhiên như lời tâm sự chân thành, giàu hình ảnh thơ mộng',
    vocabularyStyle: 'Giản dị, mộc mạc, giàu chất thơ và giàu cảm xúc hoài niệm',
    dialogueStyle: 'Hồn nhiên, hóm hỉnh nhẹ nhàng, đong đầy tình cảm',
    sensoryDetailing: 'Tả ánh nắng qua kẽ lá, mùi mưa ngâu, hoa phượng rực đỏ, tiếng ve ngân',
    summaryGuideline: 'Giữ giọng văn hoài niệm, nhẹ nhàng, trong trẻo, đong đầy cảm xúc chân thành và tinh tế.',
    isPreset: true,
  },
  // 4. Ngôn Tình Trọng Sinh Cung Đấu
  {
    id: 'preset-cung-dau',
    name: 'Ngôn Tình Cung Đấu / Gia Đấu Cổ Đại',
    category: 'Ngôn Tình & Lãng Mạn',
    description: 'Trọng sinh thù sâu, mưu trí thâm trầm, câu văn nhã nhặn nhưng giấu giếm dao sắc dưới lụa là.',
    perspective: 'Ngôi thứ ba theo chân nữ chính trầm ổn, sắc bén',
    pacing: 'Âm thầm tích tụ sóng ngầm, bùng nổ bất ngờ ở các bước ngoặt lật kèo',
    sentenceStructure: 'Mạch văn trau chuốt, ý tại ngôn ngoại, ẩn chứa nhiều ẩn dụ tinh tế',
    vocabularyStyle: 'Cổ phong đài các, sử dụng từ ngữ cung đình, trâm anh thế phiệt',
    dialogueStyle: 'Lịch sự, xã giao thâm sâu, mỗi lời thốt ra đều là mưu đố sắc bén',
    sensoryDetailing: 'Tả mùi trầm hương, tà áo thêu gấm, chén trà bốc khói, ánh mắt lạnh lẽo sau nụ cười',
    summaryGuideline: 'Duy trì phong thái cổ đại quý phái, tạo không khí đấu trí thâm trầm và cảm xúc thâm sâu.',
    isPreset: true,
  },
  // 5. Ngôn Tình Đô Thị Sủng Ngọt
  {
    id: 'preset-do-thi-sung',
    name: 'Ngôn Tình Đô Thị / Sủng Ngọt Hiện Đại',
    category: 'Ngôn Tình & Lãng Mạn',
    description: 'Ấm áp, cưng chiều, nhịp sống hiện đại ngọt ngào, tạo cảm giác thư thái và ngập tràn hạnh phúc.',
    perspective: 'Ngôi thứ ba hoán đổi linh hoạt giữa hai nhân vật chính',
    pacing: 'Nhẹ nhàng, mượt mà, chú trọng các khoảnh khắc tương tác tình cảm',
    sentenceStructure: 'Câu văn mềm mại, hiện đại, giàu nhịp điệu cảm xúc',
    vocabularyStyle: 'Trẻ trung, mượt mà, tinh tế và ngọt ngào',
    dialogueStyle: 'Ngọt ngào, trêu đùa hóm hỉnh, chứa chan sự quan tâm chiều chuộng',
    sensoryDetailing: 'Tả hương nước hoa thoang thoảng, cái ôm ấm áp, ánh đèn thành phố đêm, nụ cười chiều chuộng',
    summaryGuideline: 'Tập trung vào phản ứng hóa học ngọt ngào, câu từ hiện đại mềm mại, mang lại cảm giác dễ chịu.',
    isPreset: true,
  },
  // 6. Trinh Thám U Tối
  {
    id: 'preset-trinh-tham-u-toi',
    name: 'Trinh Thám / U Tối Gay Cấn (Scandinavian Noir)',
    category: 'Trinh Thám & Kinh Dị',
    description: 'Nhịp dồn dập, gãy gọn, nhấn mạnh chi tiết quan sát, tâm lý tội phạm và bầu không khí nghẹt thở.',
    perspective: 'Ngôi thứ ba quan sát sắc bén hoặc ngôi thứ nhất nhà điều tra',
    pacing: 'Căng thẳng, dồn dập, nhiều nút thắt nghi vấn',
    sentenceStructure: 'Câu ngắn súc tích, dốc sức dồn tâm trí vào tình tiết phá án',
    vocabularyStyle: 'Lạnh lùng, thực tế, u tối, giàu thuật ngữ quan sát',
    dialogueStyle: 'Dồn ép, hỏi đáp sắc bén, ẩn chứa dối trá và bí mật',
    sensoryDetailing: 'Tả bóng tối mù sương, dấu vết rải rác, mùi âm ẩm và tiếng bước chân dồn dập',
    summaryGuideline: 'Duy trì nhịp văn căng thẳng, câu văn gãy gọn, gài gắm manh mối suy luận tự nhiên.',
    isPreset: true,
  },
  // 7. Kinh Dị Tâm Lý
  {
    id: 'preset-kinh-di',
    name: 'Kinh Dị U Tối / Tâm Lý Ma Mị (Lovecraftian)',
    category: 'Trinh Thám & Kinh Dị',
    description: 'Bầu không khí u ám rợn người, khai thác nỗi sợ tâm lý, sinh vật cổ xưa và cái vô tận kỳ dị.',
    perspective: 'Ngôi thứ nhất run rẩy hoặc ngôi thứ ba theo sát tâm lý hoảng loạn',
    pacing: 'Mơ hồ chầm chậm dâng trào nỗi sợ, bùng nổ cảm giác điên loạn',
    sentenceStructure: 'Câu văn kéo dài rùng rợn, giàu miêu tả nội tâm giằng xé',
    vocabularyStyle: 'U ám, kỳ quái, sâu thẫm, giàu tính gợi hình ám ảnh',
    dialogueStyle: 'Thì thầm thoi hóp, ngắt quãng vì hoảng sợ hoặc gào thét mất khống chế',
    sensoryDetailing: 'Tả mùi tanh nồng, tiếng thì thầm vô hình, ánh sáng chập chờn và cảm giác lạnh sống lưng',
    summaryGuideline: 'Tạo dựng bầu không khí rợn người, tập trung tả biến chuyển tâm lý sợ hãi và bí ẩn vượt tầm hiểu biết.',
    isPreset: true,
  },
  // 8. Đô Thị Trùng Sinh Sảng Văn
  {
    id: 'preset-do-thi-trung-sinh',
    name: 'Đô Thị Trùng Sinh / Bá Đạo Sảng Văn',
    category: 'Đô Thị & Sảng Văn',
    description: 'Góc nhìn bá đạo, nhịp dồn dập, lật kèo nghẹt thở, vung tay vạch mặt kẻ thù, tạo cảm giác sảng khoái vỡ òa.',
    perspective: 'Ngôi thứ ba bám sát nam chính trùng sinh tài trí vô song',
    pacing: 'Nhanh, dồn dập, vung đòn dứt khoát, giải quyết xung đột gọn gàng',
    sentenceStructure: 'Câu ngắn, sắc bén, nhịp điệu mạnh mẽ và dứt khoát',
    vocabularyStyle: 'Hiện đại, sắc bộc, giàu từ ngữ dứt khoát và phong thái cao thủ',
    dialogueStyle: 'Sắc bén, chớp thời cơ, tự tin tuyệt đối, tát lật mặt đám nhân vật phản diện',
    sensoryDetailing: 'Tả tiếng xì xào của đám đông, khí thế áp đảo, cái nhìn sắc như dao cạo',
    summaryGuideline: 'Nhịp văn nhanh, xử lý tình huống sảng khoái dứt khoát, làm nổi bật bản lĩnh bá đạo.',
    isPreset: true,
  },
  // 9. Vô Địch Lưu / Linh Khí Khôi Phục
  {
    id: 'preset-vo-dich-luu',
    name: 'Vô Địch Lưu / Linh Khí Khôi Phục',
    category: 'Đô Thị & Sảng Văn',
    description: 'Thế giới biến đổi, nhân vật chính sức mạnh tuyệt đối, phong thái ung dung giải quyết mọi đại họa.',
    perspective: 'Ngôi thứ ba toàn năng ung dung',
    pacing: 'Thong thả, hài hước nhẹ nhàng trước khi bùng nổ chiêu thức chấn động',
    sentenceStructure: 'Mạch văn mạch lạc, tạo sự tương phản giữa vẻ bình thản và sức mạnh áp đảo',
    vocabularyStyle: 'Mạnh mẽ, hiện đại pha trộn thuật ngữ dị năng linh khí',
    dialogueStyle: 'Tự tại, chút bất cần đời nhưng vô cùng uy lực',
    sensoryDetailing: 'Tả luồng khí áp khổng lồ, bầu trời đổi màu, đám đông kinh hãi sùng bái',
    summaryGuideline: 'Tạo đà tương phản tốt giữa phản diện tự cao và sức mạnh áp đảo của main, đọc vô cùng giải trí.',
    isPreset: true,
  },
  // 10. Khoa Học Viễn Tưởng
  {
    id: 'preset-khoa-hoc-vien-tuong',
    name: 'Khoa Học Viễn Tưởng / Cyberpunk Hiện Đại',
    category: 'Viễn Tưởng & Mạt Thế',
    description: 'Văn phong gãy gọn, logic, sử dụng tư duy công nghệ kết hợp triết lý tương lai và góc khuất xã hội.',
    perspective: 'Ngôi thứ ba toàn năng hoặc quan sát logic',
    pacing: 'Nhanh, gãy gọn, dồn dập sự kiện',
    sentenceStructure: 'Cấu trúc câu hiện đại, chuẩn xác, nhịp nhàng',
    vocabularyStyle: 'Chuyên nghiệp, giàu từ ngữ viễn tưởng và kỹ thuật số',
    dialogueStyle: 'Trực diện, thông minh, mang sắc thái trí tuệ',
    sensoryDetailing: 'Tả ánh đèn neon, kim loại bóng lạnh, hologram và âm thanh máy móc',
    summaryGuideline: 'Giữ văn phong hiện đại, logic, giàu tính viễn tưởng công nghệ.',
    isPreset: true,
  },
  // 11. Mạt Thế Sinh Tồn
  {
    id: 'preset-mat-the',
    name: 'Mạt Thế Sinh Tồn / Thảm Họa Tận Thế',
    category: 'Viễn Tưởng & Mạt Thế',
    description: 'Khốc liệt, chân thật, nhấn mạnh ranh giới nhân tính, sự thiếu thốn tài nguyên và ý chí sinh tồn kiên cường.',
    perspective: 'Ngôi thứ ba hoặc ngôi thứ nhất tỉnh táo, thực tế',
    pacing: 'Găng tay căng thẳng, nhịp thở dồn dập giữa ranh giới sống chết',
    sentenceStructure: 'Câu văn thực tế, cô đọng, dồn dập tình huống nguy kịch',
    vocabularyStyle: 'Góc cạnh, lạnh lùng, miêu tả hiện thực trần trụi',
    dialogueStyle: 'Thực dụng, kiệm lời, chú trọng trao đổi sinh tồn',
    sensoryDetailing: 'Tả mùi khói bùng cháy, tiếng còi báo động, đống đổ nát và ánh mắt thèm khát sự sống',
    summaryGuideline: 'Khắc họa bức tranh mạt thế chân thực, đề cao bản năng sinh tồn và chiều sâu nhân tính.',
    isPreset: true,
  },
  // 12. Hài Hước Giễu Nhại
  {
    id: 'preset-hai-huoc',
    name: 'Hài Hước Giễu Nhại / Vô Đầu Sảng',
    category: 'Hài Hước & Đời Thường',
    description: 'Tào lao duyên dáng, nhiều câu thoại bá đạo, tình huống bẻ lái bất ngờ gây cười nghiêng ngả.',
    perspective: 'Ngôi thứ ba tự do hoặc ngôi thứ nhất tào lao dí dỏm',
    pacing: 'Biến hóa khôn lường, liên tục tạo điểm nhấn hài hước',
    sentenceStructure: 'Tự do, phá cách, kết hợp lối ví von dí dỏm bất ngờ',
    vocabularyStyle: 'Duyệt mượt, gần gũi, hóm hỉnh, giàu tính trào phúng',
    dialogueStyle: 'Bật lạichan chát, cà khịa duyên dáng, bẻ lái khéo léo',
    sensoryDetailing: 'Tả biểu cảm ngơ ngác, những pha xử lý đi vào lòng đất, tiếng cười sảng khoái',
    summaryGuideline: 'Đảm bảo tình huống dí dỏm, thoại cà khịa duyên dáng, mang đến trải nghiệm giải trí cao.',
    isPreset: true,
  },
  // 13. Sử Việt Cổ Phong
  {
    id: 'preset-su-viet',
    name: 'Sử Việt Cổ Phong / Dân Tộc Hào Hùng',
    category: 'Văn Học & Lịch Sử',
    description: 'Âm hưởng hào hùng Nam Quốc, hào khí Đông A, miêu tả núi sông gấm vóc và ý chí giữ nước bất khuất.',
    perspective: 'Ngôi thứ ba uy nghi, đậm chất chấn hưng dân tộc',
    pacing: 'Trầm hùng như tiếng trống đồng, bùng nổ ở các trận đánh vang dội',
    sentenceStructure: 'Trang trọng, giàu chất thơ lịch sử, đăng đối cổ kính',
    vocabularyStyle: 'Từ ngữ Hán Việt thuần Việt đắt giá, giàu nhạc điệu hào hùng',
    dialogueStyle: 'Dũng khí, khí phách kiên cường, coi nhẹ cái chết vì đại nghĩa',
    sensoryDetailing: 'Tả mây trời sông Bạch Đằng, tiếng tù và thúc giục, tà áo chàm và ngọn lửa yêu nước',
    summaryGuideline: 'Tôn vinh khí phách lịch sử Việt Nam, từ ngữ trang trọng tráng lệ và hào hùng.',
    isPreset: true,
  },
  // 14. Văn Học Hiện Thực Đời Thường
  {
    id: 'preset-van-hoc-hien-thuc',
    name: 'Văn Học Hiện Thực / Đời Thường Sâu Sắc (Nam Cao)',
    category: 'Văn Học & Lịch Sử',
    description: 'Đào sâu tâm lý con người, miêu tả tỉ mỉ cuộc sống đời thường, đắt giá từng chi tiết và giàu lòng nhân ái.',
    perspective: 'Ngôi thứ ba đồng cảm sâu sắc hoặc ngôi thứ nhất trăn trở',
    pacing: 'Trầm lắng, đi sâu vào suy tư nội tâm và biến chuyển số phận',
    sentenceStructure: 'Tỉ mỉ, sâu sắc, sử dụng những câu văn giàu sức gợi tâm lý',
    vocabularyStyle: 'Chân thực, đời thường nhưng ẩn chứa triết lý nhân sinh đắt giá',
    dialogueStyle: 'Chân thật như hơi thở cuộc sống, bộc lộ rõ tính cách và hoàn cảnh',
    sensoryDetailing: 'Tả mái nhà tranh xiêu vẹo, ngọn đèn dầu tù mù, bữa cơm đạm bạc và nụ cười cay đắng',
    summaryGuideline: 'Chú trọng khắc họa nội tâm nhân vật, tạo dựng bối cảnh chân thực và giàu giá trị nhân văn.',
    isPreset: true,
  },
  // 15. Epic High Fantasy
  {
    id: 'preset-epic-fantasy',
    name: 'Huyền Huyễn Tây Phương / Epic High Fantasy',
    category: 'Viễn Tưởng & Mạt Thế',
    description: 'Thế giới thần thoại phương Tây rộng lớn, rồng cổ xưa, chú thuật kỳ bí và cuộc chiến ánh sáng - bóng tối.',
    perspective: 'Ngôi thứ ba đa góc nhìn sử thi (Multi-POV)',
    pacing: 'Trầm hùng xây dựng thế giới, dồn dập trong các đại chiến thiên hà',
    sentenceStructure: 'Giàu tính sử thi, sử dụng tính từ tả cảnh hoành tráng',
    vocabularyStyle: 'Trang trọng phương Tây, giàu thuật ngữ thần thoại ma pháp',
    dialogueStyle: 'Mực thước, mang trọng trách vương quốc và lý tưởng cổ xưa',
    sensoryDetailing: 'Tả tiếng rồng gầm, vầng sáng ma pháp cổ, lâu đài đá rêu phong và giáp trụ sáng láng',
    summaryGuideline: 'Đảm bảo không khí huyền huyễn phương Tây hoành tráng, miêu tả thế giới sâu rộng và kỳ vĩ.',
    isPreset: true,
  },
];

const GLOBAL_STYLES_KEY = 'aistudio_saved_styles_library';

export const getGlobalSavedStyles = (): StyleProfile[] => {
  try {
    const raw = localStorage.getItem(GLOBAL_STYLES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse global saved styles:', e);
    return [];
  }
};

export const saveGlobalStyle = (style: StyleProfile): StyleProfile[] => {
  try {
    const current = getGlobalSavedStyles();
    // check if already exists
    const existsIdx = current.findIndex((s) => s.id === style.id || (s.name && s.name === style.name));
    let updated: StyleProfile[];
    if (existsIdx >= 0) {
      updated = [...current];
      updated[existsIdx] = style;
    } else {
      updated = [style, ...current];
    }
    localStorage.setItem(GLOBAL_STYLES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save global style:', e);
    return [];
  }
};

export const deleteGlobalStyle = (styleId: string): StyleProfile[] => {
  try {
    const current = getGlobalSavedStyles();
    const updated = current.filter((s) => s.id !== styleId);
    localStorage.setItem(GLOBAL_STYLES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete global style:', e);
    return [];
  }
};
