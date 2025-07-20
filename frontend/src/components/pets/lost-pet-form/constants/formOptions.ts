export const BREED_OPTIONS = {
  dog: ['米克斯', '柴犬', '柯基', '貴賓/泰迪', '博美', '臘腸', '吉娃娃', '法鬥', '黃金獵犬', '拉布拉多', '雪納瑞'],
  cat: ['米克斯', '美國短毛貓', '英國短毛貓', '布偶貓', '波斯貓', '橘貓'],
  reptile: ['巴西龜', '斑龜', '蘇卡達象龜', '陸龜', '水龜'],
  rabbit: ['家兔', '道奇兔', '獅子兔', '垂耳兔'],
  other: []
} as const;

export const COLOR_OPTIONS = [
  '黑色', '白色', '灰色', '黃色', '橘色', '棕色', '奶油色', 
  '虎斑', '三花', '玳瑁', '賓士貓', '斑點', '雙色', '重點色'
] as const;

export const APPEARANCE_OPTIONS = [
  '垂耳', '立耳', '摺耳', '大耳朵', '小耳朵', '長毛', '短毛', '捲毛',
  '長尾', '短尾/麒麟尾', '斷尾', '藍眼', '綠眼', '黃眼', '異色瞳', '大臉', '尖臉'
] as const;

export const PERSONALITY_OPTIONS = [
  '親人', '膽小', '怕生', '貪吃', '愛叫', '穩定', '活潑', '好奇', '懶洋洋', '會握手'
] as const;

export const PET_TYPES = [
  { value: 'dog', label: '狗' },
  { value: 'cat', label: '貓' },
  { value: 'bird', label: '鳥' },
  { value: 'rabbit', label: '兔子' },
  { value: 'hamster', label: '倉鼠' },
  { value: 'fish', label: '魚' },
  { value: 'reptile', label: '爬蟲類' },
  { value: 'other', label: '其他' }
] as const;

export const GENDER_OPTIONS = [
  { value: 'male', label: '公' },
  { value: 'female', label: '母' },
  { value: 'unknown', label: '不確定' }
] as const;

export const AGE_OPTIONS = [
  { value: 'puppy', label: '幼體' },
  { value: 'young', label: '青年' },
  { value: 'adult', label: '成年' },
  { value: 'senior', label: '老年' }
] as const;

export const SIZE_OPTIONS = [
  { value: 'small', label: '小型' },
  { value: 'medium', label: '中型' },
  { value: 'large', label: '大型' }
] as const;

export const CONTACT_PREFERENCE_OPTIONS = [
  { value: 'phone', label: '電話' },
  { value: 'email', label: '電子郵件' }
] as const;