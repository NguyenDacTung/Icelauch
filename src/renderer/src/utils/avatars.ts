export interface AvatarPreset {
  id: string;
  name: string;
  category: 'gaming' | 'cyber' | 'anime' | 'creature' | 'retro';
  gradient: string;
  emoji: string;
  svgColor: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'avatar_cyber_ninja', name: 'Cyber Ninja', category: 'cyber', gradient: 'from-cyan-500 to-blue-600', emoji: '🥷', svgColor: '#06b6d4' },
  { id: 'avatar_neon_gamer', name: 'Neon Gamer', category: 'gaming', gradient: 'from-purple-500 to-indigo-600', emoji: '🎮', svgColor: '#a855f7' },
  { id: 'avatar_pixel_knight', name: 'Hiệp Sĩ Pixel', category: 'retro', gradient: 'from-amber-400 to-orange-600', emoji: '⚔️', svgColor: '#f59e0b' },
  { id: 'avatar_mecha_robot', name: 'Mecha Vàng', category: 'cyber', gradient: 'from-yellow-400 to-amber-600', emoji: '🤖', svgColor: '#eab308' },
  { id: 'avatar_flame_dragon', name: 'Hỏa Long', category: 'creature', gradient: 'from-red-500 to-rose-700', emoji: '🐉', svgColor: '#ef4444' },
  { id: 'avatar_frost_wizard', name: 'Pháp Sư Băng', category: 'anime', gradient: 'from-sky-400 to-teal-600', emoji: '🧙‍♂️', svgColor: '#38bdf8' },
  { id: 'avatar_retro_arcade', name: 'Arcade Master', category: 'retro', gradient: 'from-fuchsia-500 to-pink-600', emoji: '🕹️', svgColor: '#d946ef' },
  { id: 'avatar_space_ranger', name: 'Chiến Binh Không Gian', category: 'gaming', gradient: 'from-blue-600 to-violet-800', emoji: '🚀', svgColor: '#3b82f6' },
  { id: 'avatar_shadow_assassin', name: 'Bóng Ma', category: 'anime', gradient: 'from-slate-700 to-zinc-900', emoji: '👤', svgColor: '#64748b' },
  { id: 'avatar_golden_champion', name: 'Nhà Vô Địch', category: 'gaming', gradient: 'from-amber-300 to-yellow-500', emoji: '🏆', svgColor: '#fbbf24' },
  { id: 'avatar_cyber_cat', name: 'Mèo Cyberpunk', category: 'creature', gradient: 'from-pink-500 to-rose-600', emoji: '🐱', svgColor: '#ec4899' },
  { id: 'avatar_laser_fox', name: 'Hồ Ly Lửa', category: 'creature', gradient: 'from-orange-500 to-red-600', emoji: '🦊', svgColor: '#f97316' },
  { id: 'avatar_alien_invader', name: 'Người Ngoài Hành Tinh', category: 'creature', gradient: 'from-emerald-400 to-green-600', emoji: '👽', svgColor: '#10b981' },
  { id: 'avatar_steampunk_pilot', name: 'Phi Công Cổ Điển', category: 'retro', gradient: 'from-stone-600 to-amber-900', emoji: '🧭', svgColor: '#78716c' },
  { id: 'avatar_electric_spark', name: 'Tia Sét Xanh', category: 'cyber', gradient: 'from-blue-400 to-indigo-500', emoji: '⚡', svgColor: '#60a5fa' },
  { id: 'avatar_ghost_phantom', name: 'Bóng Đêm', category: 'creature', gradient: 'from-violet-900 to-purple-950', emoji: '👻', svgColor: '#7c3aed' },
  { id: 'avatar_samurai_legend', name: 'Samurai Huyền Thoại', category: 'anime', gradient: 'from-red-600 to-slate-900', emoji: '👺', svgColor: '#dc2626' },
  { id: 'avatar_music_dj', name: 'DJ Âm Nhạc', category: 'gaming', gradient: 'from-teal-400 to-cyan-600', emoji: '🎧', svgColor: '#14b8a6' },
  { id: 'avatar_diamond_vip', name: 'Kim Cương Băng', category: 'gaming', gradient: 'from-cyan-300 to-blue-500', emoji: '💎', svgColor: '#67e8f9' },
  { id: 'avatar_lucky_clover', name: 'Cỏ Bốn Lá', category: 'creature', gradient: 'from-green-500 to-emerald-700', emoji: '🍀', svgColor: '#22c55e' },
];

export function getAvatarPreset(avatarId?: string): AvatarPreset {
  const found = AVATAR_PRESETS.find((p) => p.id === avatarId);
  return found || AVATAR_PRESETS[0];
}

export function isCustomImageAvatar(avatar?: string): boolean {
  if (!avatar) return false;
  return (
    avatar.startsWith('http://') ||
    avatar.startsWith('https://') ||
    avatar.startsWith('data:') ||
    avatar.startsWith('file://') ||
    avatar.includes('/') ||
    avatar.includes('\\')
  );
}
