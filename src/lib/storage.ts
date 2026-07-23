import { Story } from '../types';

export interface TrashedStory extends Story {
  deletedAt: string;
}

const STORAGE_KEY = 'aistudio_stories_data_v1';
const TRASH_STORAGE_KEY = 'aistudio_trashed_stories_data_v1';
const ACTIVE_STORY_KEY = 'aistudio_active_story_id';

export const getStoredStories = (): Story[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored stories:', e);
    return [];
  }
};

export const saveStories = (stories: Story[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
  } catch (e) {
    console.error('Failed to save stories:', e);
  }
};

export const getTrashedStories = (): TrashedStory[] => {
  try {
    const raw = localStorage.getItem(TRASH_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse trashed stories:', e);
    return [];
  }
};

export const saveTrashedStories = (stories: TrashedStory[]): void => {
  try {
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(stories));
  } catch (e) {
    console.error('Failed to save trashed stories:', e);
  }
};

export const getActiveStoryId = (): string | null => {
  return localStorage.getItem(ACTIVE_STORY_KEY);
};

export const setActiveStoryId = (id: string): void => {
  localStorage.setItem(ACTIVE_STORY_KEY, id);
};

export const createSampleStory = (): Story => {
  const now = new Date().toISOString();
  return {
    id: 'story-sample-1',
    title: 'Hành Trình Xuyên Rừng Nguyên Sinh',
    author: 'Văn Nhân AI',
    pitch: 'Đoàn thám hiểm dấn thân vào khu rừng cấm bí ẩn Phong Sơn để tìm kiếm di tích thành phố cổ đã mất từ ngàn năm trước.',
    genres: ['Phiêu lưu', 'Kinh dị', 'Fantasy'],
    targetTone: 'Kịch tính, u uất, bí ẩn',
    lengthOption: 'Dài',
    worldRules: {
      setting: 'Rừng nguyên sinh Phong Sơn - vùng đất không có trên bản đồ hiện đại, nơi linh khí cổ đại bao phủ làm hỏng mọi thiết bị định vị vệ tinh.',
      magicOrTech: 'Sinh vật cổ đại mang năng lượng sinh học biến dị; cổ vật runes kích hoạt sinh lực.',
      historyAndFactions: 'Đế chế Phong Linh diệt vong 2000 năm trước để lại các vệ binh quái vật canh giữ bí mật trường sinh.'
    },
    characters: [
      {
        id: 'char-1',
        name: 'Lâm Bách',
        role: 'Nam chính',
        age: '28',
        appearance: 'Cao 1m80, cơ thể săn chắc, vết sẹo nhỏ trên lông mày trái, mắt sắc lạnh.',
        personality: 'Điềm tĩnh, quan sát tinh tế, mạo hiểm nhưng giữ nguyên tắc bảo vệ đồng đội.',
        goals: 'Tìm lại dấu vết cuốn nhật ký ký sự của người cha mất tích 10 năm trước.',
        strengths: 'Kỹ năng sinh tồn tuyệt vời, khả năng bắn cung và định hướng bằng sao.',
        weaknesses: 'Thương người, dễ ám ảnh bởi quá khứ.',
        items: ['Con dao găm bạc gia truyền', 'Dây thừng leo núi 50m', 'La bàn cổ'],
        skills: ['Sử dụng vũ khí cận chiến', 'Sơ cứu vết thương', 'Nhận biết thực vật độc']
      },
      {
        id: 'char-2',
        name: 'Yến Nhi',
        role: 'Nữ chính',
        age: '25',
        appearance: 'Thon thả, tóc ngắn cá tính, đeo kính thông minh bảo vệ mắt, phong thái nhanh nhẹn.',
        personality: 'Thông minh, kiêu hãnh, tôn thờ khoa học nhưng tò mò mãnh liệt.',
        goals: 'Chứng minh sự tồn tại của nền văn minh cổ đại Phong Linh.',
        strengths: 'Chuyên gia thực vật học và ngôn ngữ cổ.',
        weaknesses: 'Thể lực trung bình, sợ bóng tối khép kín.',
        items: ['Kính hiển vi cầm tay', 'Sổ ký họa thực vật', 'Bình xịt đuổi côn trùng cao cấp'],
        skills: ['Giải mã văn tự cổ', 'Bào chế dược liệu cấp tốc']
      }
    ],
    relationships: [
      { id: 'rel-1', from: 'Lâm Bách', to: 'Yến Nhi', relation: 'Bạn đồng hành tin cậy' }
    ],
    outlineNodes: [
      {
        id: 'node-1',
        title: 'Khởi đầu: Đi qua Đầm Lầy Tử Thần',
        description: 'Đoàn thám hiểm vượt qua ranh giới mù sương và đầm lầy lầy lội, phát hiện dấu vết sinh vật kỳ lạ.',
        expandedScenes: [
          'Cảnh 1: Đêm mù sương tại rìa rừng Phong Sơn, tiếng kêu quái dị.',
          'Cảnh 2: Lầy lội bẫy lầy rút chân Lâm Bách.',
          'Cảnh 3: Yến Nhi phát hiện loài rêu phát sáng báo hiệu nguy hiểm.'
        ],
        completed: true
      },
      {
        id: 'node-2',
        title: 'Bị Kiến Ăn Thịt Người Truy Đuổi & Trốn Vào Hang',
        description: 'Đàn kiến biến dị khổng lồ xuất hiện tràn ngập đầm lầy, buộc cả đoàn chạy thục mạng vào hang đá cổ.',
        expandedScenes: [
          'Cảnh 1: Tiếng rào rạt như mưa rào, đàn kiến đỏ thẫm bò kín mặt đất.',
          'Cảnh 2: Chạy đua với thời gian, Lâm Bách đốt đuốc chặn đường.',
          'Cảnh 3: Thoát vào hang đá tối om, lấp cửa hang kịp thời.'
        ],
        completed: false
      },
      {
        id: 'node-3',
        title: 'Mưa Rừng & Bầy Ong Sát Thủ',
        description: 'Mưa dội xối xả bên ngoài. Khi đi sâu vào hang, bầy ong biến dị quấy nhiễu.',
        expandedScenes: [
          'Cảnh 1: Mưa lớn chặn lối ra, tiếng sấm dội hang.',
          'Cảnh 2: Tiếng vo ve rùng rợn từ các tổ ong khổng lồ trên trần hang.',
          'Cảnh 3: Dùng khói từ lá thảo dược của Yến Nhi xua đuổi bầy ong.'
        ],
        completed: false
      },
      {
        id: 'node-4',
        title: 'Khám Phá Thành Phố Cổ & Đánh Thức Sinh Vật Cổ Đại',
        description: 'Cuối hang động mở ra một thung lũng lọt lòng núi, nơi thành phố cổ tráng lệ ẩn giấu.',
        expandedScenes: [
          'Cảnh 1: Cổng đá khổng lồ khắc chữ cổ.',
          'Cảnh 2: Kích hoạt đền thờ, một sinh vật cổ đại trỗi dậy canh giữ.',
          'Cảnh 3: Trận chiến sinh tử và con đường thoát khỏi rừng.'
        ],
        completed: false
      }
    ],
    timeline: [
      { id: 'tl-1', day: 'Ngày 1', event: 'Đoàn thám hiểm xuất phát từ trạm gác biên giới vào rừng Phong Sơn.' },
      { id: 'tl-2', day: 'Ngày 2', event: 'Vượt đầm lầy tử thần, giáp mặt loài kiến ăn thịt người.' }
    ],
    chapters: [],
    status: 'ongoing',
    createdAt: now,
    updatedAt: now
  };
};
