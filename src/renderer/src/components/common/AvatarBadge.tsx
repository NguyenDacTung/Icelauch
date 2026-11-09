import React from 'react';
import { getAvatarPreset, isCustomImageAvatar } from '../../utils/avatars';

interface AvatarBadgeProps {
  avatar?: string;
  nickname?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
  onClick?: () => void;
}

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  avatar,
  nickname,
  size = 'md',
  className = '',
  showBorder = true,
  onClick,
}) => {
  const isCustom = isCustomImageAvatar(avatar);
  const preset = !isCustom ? getAvatarPreset(avatar) : null;

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-24 h-24 text-4xl',
    '2xl': 'w-32 h-32 text-5xl',
  }[size];

  const borderClass = showBorder
    ? 'border-2 border-white/20 shadow-md group-hover:border-ice-accent transition-all'
    : '';

  if (isCustom && avatar) {
    return (
      <div
        onClick={onClick}
        className={`relative rounded-2xl overflow-hidden bg-[#161922] flex items-center justify-center flex-shrink-0 select-none ${sizeClasses} ${borderClass} ${className}`}
      >
        <img
          src={avatar}
          alt={nickname || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initial if image fails
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center font-bold text-white uppercase bg-ice-card">
          {(nickname || 'U').charAt(0)}
        </div>
      </div>
    );
  }

  // Preset avatar with gorgeous gaming gradient & emoji
  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl flex items-center justify-center bg-gradient-to-br ${
        preset?.gradient || 'from-cyan-500 to-blue-600'
      } flex-shrink-0 select-none shadow-lg transform transition-transform group-hover:scale-105 ${sizeClasses} ${borderClass} ${className}`}
      style={{
        boxShadow: `0 4px 14px ${preset?.svgColor || '#06b6d4'}40`,
      }}
    >
      <span className="drop-shadow-md">{preset?.emoji || '🎮'}</span>
    </div>
  );
};

