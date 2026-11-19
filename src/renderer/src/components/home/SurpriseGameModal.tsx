import React, { useState, useEffect } from 'react';
import { Sparkles, Dices, Play, Info, RotateCw, X, Trophy } from 'lucide-react';
import type { Game } from '../../types';
import { sfx } from '../../utils/sfx';
import { useTheme } from '../../hooks/useTheme';

interface SurpriseGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  onSelectGame: (game: Game) => void;
  onLaunch: (id: string) => void;
}

export const SurpriseGameModal: React.FC<SurpriseGameModalProps> = ({
  isOpen,
  onClose,
  games,
  onSelectGame,
  onLaunch,
}) => {
  const { theme } = useTheme();
  const isLightMode = ['solar', 'aer', 'aqua'].includes(theme);
  const [spinning, setSpinning] = useState(false);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const availableGames = games.filter((g) => !g.hidden);

  const startSpin = () => {
    if (availableGames.length === 0 || spinning) return;
    setSpinning(true);
    setSelectedGame(null);

    let speed = 60;
    let iterations = 0;
    const maxIterations = 28 + Math.floor(Math.random() * 12);
    let currentIdx = Math.floor(Math.random() * availableGames.length);

    const step = () => {
      currentIdx = (currentIdx + 1) % availableGames.length;
      setCandidateIndex(currentIdx);
      sfx.playTick(500 + iterations * 15);
      iterations++;

      if (iterations < maxIterations) {
        if (iterations > maxIterations - 10) {
          speed += 35; // slow down at the end
        }
        setTimeout(step, speed);
      } else {
        // Landed on chosen game
        const winner = availableGames[currentIdx];
        setSelectedGame(winner);
        setSpinning(false);
        sfx.playWin();
      }
    };

    step();
  };

  useEffect(() => {
    if (isOpen && !selectedGame && !spinning) {
      startSpin();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDisplayGame = selectedGame || availableGames[candidateIndex] || availableGames[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-ice-card border border-ice-accent/40 rounded-2xl p-6 shadow-2xl space-y-6 text-center overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-ice-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            theme === 'aer'
              ? 'bg-[#0284C7]/15 border border-[#0284C7]/40 text-[#0284C7]'
              : theme === 'aqua'
              ? 'bg-sky-500/15 border border-sky-400/40 text-sky-600'
              : theme === 'solar'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-900 font-black'
              : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
          }`}>
            <Dices className="w-4 h-4 animate-bounce" />
            <span>HÔM NAY CHƠI GÌ?</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ice-subtext hover:text-ice-text hover:bg-ice-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Box Spotlight */}
        <div className="relative z-10 space-y-4">
          <div className={`relative mx-auto w-44 aspect-[2/3] rounded-xl overflow-hidden border-2 shadow-2xl bg-black/50 group ${
            theme === 'aer'
              ? 'border-[#0284C7]'
              : theme === 'aqua'
              ? 'border-sky-400 shadow-sky-500/20'
              : theme === 'solar'
              ? 'border-amber-500 shadow-amber-500/20'
              : 'border-ice-accent/60'
          }`}>
            {currentDisplayGame?.coverPath ? (
              <img
                src={currentDisplayGame.coverPath.startsWith('http') || currentDisplayGame.coverPath.startsWith('data:') ? currentDisplayGame.coverPath : `file://${currentDisplayGame.coverPath}`}
                alt={currentDisplayGame.name}
                className={`w-full h-full object-cover transition-transform duration-300 ${spinning ? 'scale-110 blur-[1px]' : 'scale-100'}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-ice-bg text-ice-muted">
                <Dices className="w-12 h-12" />
              </div>
            )}

            {selectedGame && (
              <div className={`absolute top-2 right-2 p-1.5 rounded-full shadow-lg animate-bounce ${
                theme === 'aer'
                  ? 'bg-[#0284C7] text-white'
                  : theme === 'aqua'
                  ? 'bg-sky-500 text-white'
                  : theme === 'solar'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-amber-500 text-black'
              }`}>
                <Trophy className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-ice-text tracking-wide truncate">
              {currentDisplayGame ? currentDisplayGame.name : 'Đang chọn game...'}
            </h3>
            <p className={`text-xs font-semibold ${
              theme === 'aer'
                ? 'text-[#0284C7]'
                : theme === 'aqua'
                ? 'text-sky-600'
                : theme === 'solar'
                ? 'text-amber-800'
                : 'text-ice-accent'
            }`}>
              {currentDisplayGame?.genre || currentDisplayGame?.tags?.join(', ') || 'Game Đỉnh Cao'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="relative z-10 flex flex-col gap-2 pt-2">
          {selectedGame ? (
            <div className="space-y-2">
              <button
                onClick={() => {
                  sfx.playClick();
                  onLaunch(selectedGame.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-[0.98] ${
                  theme === 'aer'
                    ? 'bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-none'
                    : theme === 'aqua'
                    ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/25'
                    : theme === 'solar'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/20'
                    : 'bg-gradient-to-r from-blue-600 to-ice-accent hover:from-blue-500 hover:to-blue-400 text-white shadow-ice-accent/30'
                }`}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>CHƠI NGAY</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    sfx.playClick();
                    onSelectGame(selectedGame);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-ice-bg hover:bg-ice-hover text-ice-text hover:text-white border border-ice-border text-xs font-semibold transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Xem Chi Tiết</span>
                </button>

                <button
                  onClick={() => {
                    sfx.playClick();
                    startSpin();
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                    isLightMode
                      ? 'bg-ice-card text-slate-800 hover:text-slate-950 border-ice-border hover:bg-ice-hover'
                      : 'bg-ice-bg hover:bg-ice-hover text-amber-300 hover:text-amber-200 border-amber-500/30'
                  }`}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Quay Lại Lượt Khác</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              disabled
              className="w-full py-3 rounded-xl bg-ice-bg text-ice-muted font-bold text-sm flex items-center justify-center gap-2"
            >
              <RotateCw className="w-4 h-4 animate-spin text-ice-accent" />
              <span>Đang quay may mắn...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

