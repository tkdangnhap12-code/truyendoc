import React from 'react';
import { Character, Relationship } from '../../types';

interface RelationshipGraphProps {
  characters: Character[];
  relationships: Relationship[];
}

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({ characters, relationships }) => {
  if (characters.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
        Chưa có nhân vật nào để hiển thị sơ đồ quan hệ.
      </div>
    );
  }

  // Calculate position in circle
  const radius = Math.min(160, characters.length * 40 + 60);
  const centerX = 250;
  const centerY = 220;

  const charPositions: Record<string, { x: number; y: number; char: Character }> = characters.reduce((acc, char, index) => {
    const angle = (index / characters.length) * 2 * Math.PI - Math.PI / 2;
    acc[char.name] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      char,
    };
    return acc;
  }, {} as Record<string, { x: number; y: number; char: Character }>);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Nam chính':
      case 'Nữ chính':
        return '#3b82f6'; // blue
      case 'Phản diện':
        return '#ef4444'; // red
      case 'Đồng hành':
        return '#10b981'; // green
      default:
        return '#8b5cf6'; // purple
    }
  };

  return (
    <div className="bg-white dark:bg-[#0F0F12] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs relative overflow-hidden transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🕸️</span> Sơ Đồ Quan Hệ Nhân Vật
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Trực quan hóa sự liên kết và mối quan hệ giữa các nhân vật</p>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Nhân vật chính
          </span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Đồng hành
          </span>
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Phản diện
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto flex justify-center py-4">
        <svg width="500" height="440" className="max-w-full">
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
          </defs>

          {/* Relationship Lines */}
          {relationships.map((rel) => {
            const posFrom = charPositions[rel.from];
            const posTo = charPositions[rel.to];
            if (!posFrom || !posTo) return null;

            const midX = (posFrom.x + posTo.x) / 2;
            const midY = (posFrom.y + posTo.y) / 2;

            return (
              <g key={rel.id}>
                <line
                  x1={posFrom.x}
                  y1={posFrom.y}
                  x2={posTo.x}
                  y2={posTo.y}
                  stroke="#475569"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
                <rect
                  x={midX - 45}
                  y={midY - 12}
                  width="90"
                  height="22"
                  rx="4"
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x={midX}
                  y={midY + 3}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="11"
                  fontWeight="500"
                >
                  {rel.relation}
                </text>
              </g>
            );
          })}

          {/* Character Nodes */}
          {Object.entries(charPositions).map(([name, pos]) => {
            const color = getRoleColor(pos.char.role);
            return (
              <g key={name} className="cursor-pointer group">
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="26"
                  fill="#0f172a"
                  stroke={color}
                  strokeWidth="3"
                  className="transition-all duration-300 group-hover:r-28"
                />
                <text
                  x={pos.x}
                  y={pos.y - 2}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {name.slice(0, 2)}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 12}
                  textAnchor="middle"
                  fill={color}
                  fontSize="9"
                  fontWeight="600"
                >
                  {pos.char.role}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 40}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="12"
                  fontWeight="600"
                >
                  {name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
