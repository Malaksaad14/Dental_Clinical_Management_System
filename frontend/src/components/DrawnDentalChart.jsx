import React, { useState } from 'react';

const TOOTH_INFO = {
  1: { name: 'Upper Right 3rd Molar', cat: 'molar', roots: 3, upper: true },
  2: { name: 'Upper Right 2nd Molar', cat: 'molar', roots: 3, upper: true },
  3: { name: 'Upper Right 1st Molar', cat: 'molar', roots: 3, upper: true },
  4: { name: 'Upper Right 2nd Premolar', cat: 'premolar', roots: 2, upper: true },
  5: { name: 'Upper Right 1st Premolar', cat: 'premolar', roots: 2, upper: true },
  6: { name: 'Upper Right Canine', cat: 'canine', roots: 1, upper: true },
  7: { name: 'Upper Right Lateral Incisor', cat: 'incisor', roots: 1, upper: true },
  8: { name: 'Upper Right Central Incisor', cat: 'incisor', roots: 1, upper: true },
  9: { name: 'Upper Left Central Incisor', cat: 'incisor', roots: 1, upper: true },
  10: { name: 'Upper Left Lateral Incisor', cat: 'incisor', roots: 1, upper: true },
  11: { name: 'Upper Left Canine', cat: 'canine', roots: 1, upper: true },
  12: { name: 'Upper Left 1st Premolar', cat: 'premolar', roots: 2, upper: true },
  13: { name: 'Upper Left 2nd Premolar', cat: 'premolar', roots: 2, upper: true },
  14: { name: 'Upper Left 1st Molar', cat: 'molar', roots: 3, upper: true },
  15: { name: 'Upper Left 2nd Molar', cat: 'molar', roots: 3, upper: true },
  16: { name: 'Upper Left 3rd Molar', cat: 'molar', roots: 3, upper: true },

  32: { name: 'Lower Right 3rd Molar', cat: 'molar', roots: 2, upper: false },
  31: { name: 'Lower Right 2nd Molar', cat: 'molar', roots: 2, upper: false },
  30: { name: 'Lower Right 1st Molar', cat: 'molar', roots: 2, upper: false },
  29: { name: 'Lower Right 2nd Premolar', cat: 'premolar', roots: 1, upper: false },
  28: { name: 'Lower Right 1st Premolar', cat: 'premolar', roots: 1, upper: false },
  27: { name: 'Lower Right Canine', cat: 'canine', roots: 1, upper: false },
  26: { name: 'Lower Right Lateral Incisor', cat: 'incisor', roots: 1, upper: false },
  25: { name: 'Lower Right Central Incisor', cat: 'incisor', roots: 1, upper: false },
  24: { name: 'Lower Left Central Incisor', cat: 'incisor', roots: 1, upper: false },
  23: { name: 'Lower Left Lateral Incisor', cat: 'incisor', roots: 1, upper: false },
  22: { name: 'Lower Left Canine', cat: 'canine', roots: 1, upper: false },
  21: { name: 'Lower Left 1st Premolar', cat: 'premolar', roots: 1, upper: false },
  20: { name: 'Lower Left 2nd Premolar', cat: 'premolar', roots: 1, upper: false },
  19: { name: 'Lower Left 1st Molar', cat: 'molar', roots: 2, upper: false },
  18: { name: 'Lower Left 2nd Molar', cat: 'molar', roots: 2, upper: false },
  17: { name: 'Lower Left 3rd Molar', cat: 'molar', roots: 2, upper: false },
};

const CONDITION_COLORS = {
  healthy: { fill: '#fbfcf8', stroke: '#cbd5e1', occlusal: '#f1f5f9', label: 'Healthy' },
  caries: { fill: '#fee2e2', stroke: '#ef4444', occlusal: '#fca5a5', label: 'Caries' },
  filled: { fill: '#e0f2fe', stroke: '#0284c7', occlusal: '#7dd3fc', label: 'Filled' },
  crown: { fill: '#fef3c7', stroke: '#d97706', occlusal: '#fcd34d', label: 'Crown' },
  root_canal: { fill: '#f3e8ff', stroke: '#9333ea', occlusal: '#d8b4fe', label: 'Root Canal' },
  missing: { fill: '#f1f5f9', stroke: '#64748b', occlusal: '#cbd5e1', label: 'Missing' },
  implant: { fill: '#ccfbf1', stroke: '#0d9488', occlusal: '#5eead4', label: 'Implant' },
};

export default function DrawnDentalChart({ teethData = {}, onSelectTooth }) {
  const [hoveredTooth, setHoveredTooth] = useState(null);

  const upperList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  const lowerList = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

  const colWidth = 54;
  const startX = 40;

  // Render Upper Tooth (Roots pointing UP, Crown below, then Occlusal below that)
  const renderUpperTooth = (num, idx) => {
    const cx = startX + idx * colWidth + colWidth / 2;
    const info = TOOTH_INFO[num];
    const records = teethData[num] || [];
    const latest = records[0];
    const cond = latest?.condition || 'healthy';
    const colors = CONDITION_COLORS[cond] || CONDITION_COLORS.healthy;
    const isHovered = hoveredTooth === num;
    const isMissing = cond === 'missing';

    const toothW = info.cat === 'molar' ? 44 : info.cat === 'premolar' ? 36 : info.cat === 'canine' ? 32 : 30;
    const halfW = toothW / 2;

    return (
      <g
        key={num}
        className="cursor-pointer transition-all duration-150"
        onMouseEnter={() => setHoveredTooth(num)}
        onMouseLeave={() => setHoveredTooth(null)}
        onClick={() => onSelectTooth({ num, name: info.name })}
      >
        {/* Hover / Selection Column Highlight Background */}
        <rect
          x={cx - colWidth / 2 + 2}
          y="10"
          width={colWidth - 4}
          height="186"
          rx="12"
          fill={isHovered ? 'rgba(14, 165, 233, 0.12)' : 'transparent'}
          stroke={isHovered ? '#0ea5e9' : 'transparent'}
          strokeWidth="1.5"
        />

        {/* 1. Upper Roots (y: 25 to 80) */}
        {!isMissing ? (
          info.cat === 'molar' ? (
            // 3 roots for upper molars
            <g fill={colors.fill} stroke={colors.stroke} strokeWidth="1.5">
              <path d={`M ${cx - 14} 75 C ${cx - 20} 55, ${cx - 16} 28, ${cx - 10} 25 C ${cx - 6} 28, ${cx - 8} 50, ${cx - 6} 75 Z`} />
              <path d={`M ${cx - 4} 75 C ${cx - 5} 50, ${cx - 3} 25, ${cx} 22 C ${cx + 3} 25, ${cx + 5} 50, ${cx + 4} 75 Z`} />
              <path d={`M ${cx + 6} 75 C ${cx + 8} 50, ${cx + 6} 28, ${cx + 10} 25 C ${cx + 16} 28, ${cx + 20} 55, ${cx + 14} 75 Z`} />
            </g>
          ) : info.cat === 'canine' ? (
            // Long single pointed root
            <path
              d={`M ${cx - 10} 78 C ${cx - 8} 45, ${cx - 3} 20, ${cx} 18 C ${cx + 3} 20, ${cx + 8} 45, ${cx + 10} 78 Z`}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth="1.5"
            />
          ) : (
            // Incisor / Premolar tapered root
            <path
              d={`M ${cx - 9} 78 C ${cx - 7} 48, ${cx - 2} 24, ${cx} 22 C ${cx + 2} 24, ${cx + 7} 48, ${cx + 9} 78 Z`}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth="1.5"
            />
          )
        ) : null}

        {/* 2. Upper Crown (y: 75 to 125) */}
        {!isMissing ? (
          <g fill={colors.fill} stroke={colors.stroke} strokeWidth="1.5">
            <path
              d={`M ${cx - halfW} 76 C ${cx - halfW - 2} 90, ${cx - halfW + 2} 115, ${cx - halfW + 4} 122 C ${cx - 4} 125, ${cx + 4} 125, ${cx + halfW - 4} 122 C ${cx + halfW - 2} 115, ${cx + halfW + 2} 90, ${cx + halfW} 76 Z`}
            />
            {/* Crown Shading line */}
            <path
              d={`M ${cx - halfW + 5} 84 Q ${cx} 87 ${cx + halfW - 5} 84`}
              fill="none"
              stroke={colors.stroke}
              strokeWidth="0.8"
              opacity="0.6"
            />
          </g>
        ) : null}

        {/* 3. Upper Occlusal View (Chewing surface, y: 132 to 172) */}
        {!isMissing ? (
          <g>
            <ellipse
              cx={cx}
              cy="152"
              rx={halfW - 2}
              ry="16"
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth="1.5"
            />
            {/* Cusps / Grooves */}
            {info.cat === 'molar' ? (
              <g stroke={colors.stroke} strokeWidth="1" fill={colors.occlusal}>
                <circle cx={cx} cy="152" r="5" />
                <line x1={cx - halfW + 4} y1="152" x2={cx + halfW - 4} y2="152" />
                <line x1={cx} y1="138" x2={cx} y2="166" />
              </g>
            ) : info.cat === 'premolar' ? (
              <g stroke={colors.stroke} strokeWidth="1" fill={colors.occlusal}>
                <line x1={cx - halfW + 5} y1="152" x2={cx + halfW - 5} y2="152" />
                <circle cx={cx} cy="152" r="3" />
              </g>
            ) : (
              // Incisal line
              <line
                x1={cx - halfW + 4}
                y1="152"
                x2={cx + halfW - 4}
                y2="152"
                stroke={colors.stroke}
                strokeWidth="2"
              />
            )}
          </g>
        ) : null}

        {/* Missing Cross Overlay */}
        {isMissing && (
          <g stroke="#ef4444" strokeWidth="2.5" opacity="0.85">
            <line x1={cx - halfW} y1="30" x2={cx + halfW} y2="165" />
            <line x1={cx + halfW} y1="30" x2={cx - halfW} y2="165" />
          </g>
        )}

        {/* 4. Tooth Number Label (y: 190) */}
        <text
          x={cx}
          y="192"
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          fontFamily="ui-monospace, monospace"
          fill={isHovered ? '#0284c7' : latest && cond !== 'healthy' ? colors.stroke : '#334155'}
        >
          {num}
        </text>
      </g>
    );
  };

  // Render Lower Tooth (Number at top, Occlusal below that, then Crown, then Roots pointing DOWN)
  const renderLowerTooth = (num, idx) => {
    const cx = startX + idx * colWidth + colWidth / 2;
    const info = TOOTH_INFO[num];
    const records = teethData[num] || [];
    const latest = records[0];
    const cond = latest?.condition || 'healthy';
    const colors = CONDITION_COLORS[cond] || CONDITION_COLORS.healthy;
    const isHovered = hoveredTooth === num;
    const isMissing = cond === 'missing';

    const toothW = info.cat === 'molar' ? 44 : info.cat === 'premolar' ? 36 : info.cat === 'canine' ? 32 : 28;
    const halfW = toothW / 2;

    return (
      <g
        key={num}
        className="cursor-pointer transition-all duration-150"
        onMouseEnter={() => setHoveredTooth(num)}
        onMouseLeave={() => setHoveredTooth(null)}
        onClick={() => onSelectTooth({ num, name: info.name })}
      >
        {/* Hover / Selection Column Highlight Background */}
        <rect
          x={cx - colWidth / 2 + 2}
          y="215"
          width={colWidth - 4}
          height="195"
          rx="12"
          fill={isHovered ? 'rgba(14, 165, 233, 0.12)' : 'transparent'}
          stroke={isHovered ? '#0ea5e9' : 'transparent'}
          strokeWidth="1.5"
        />

        {/* 1. Tooth Number Label (y: 228) */}
        <text
          x={cx}
          y="230"
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          fontFamily="ui-monospace, monospace"
          fill={isHovered ? '#0284c7' : latest && cond !== 'healthy' ? colors.stroke : '#334155'}
        >
          {num}
        </text>

        {/* 2. Lower Occlusal View (Chewing surface, y: 245 to 285) */}
        {!isMissing ? (
          <g>
            <ellipse
              cx={cx}
              cy="265"
              rx={halfW - 2}
              ry="16"
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth="1.5"
            />
            {/* Cusps / Grooves */}
            {info.cat === 'molar' ? (
              <g stroke={colors.stroke} strokeWidth="1" fill={colors.occlusal}>
                <circle cx={cx} cy="265" r="5" />
                <line x1={cx - halfW + 4} y1="265" x2={cx + halfW - 4} y2="265" />
                <line x1={cx} y1="251" x2={cx} y2="279" />
              </g>
            ) : info.cat === 'premolar' ? (
              <g stroke={colors.stroke} strokeWidth="1" fill={colors.occlusal}>
                <line x1={cx - halfW + 5} y1="265" x2={cx + halfW - 5} y2="265" />
                <circle cx={cx} cy="265" r="3" />
              </g>
            ) : (
              // Incisal line
              <line
                x1={cx - halfW + 4}
                y1="265"
                x2={cx + halfW - 4}
                y2="265"
                stroke={colors.stroke}
                strokeWidth="2"
              />
            )}
          </g>
        ) : null}

        {/* 3. Lower Crown (y: 295 to 345) */}
        {!isMissing ? (
          <g fill={colors.fill} stroke={colors.stroke} strokeWidth="1.5">
            <path
              d={`M ${cx - halfW + 4} 295 C ${cx - halfW + 2} 302, ${cx - halfW - 2} 325, ${cx - halfW} 340 C ${cx - 2} 345, ${cx + 2} 345, ${cx + halfW} 340 C ${cx + halfW + 2} 325, ${cx + halfW - 2} 302, ${cx + halfW - 4} 295 Z`}
            />
            {/* Crown line */}
            <path
              d={`M ${cx - halfW + 4} 335 Q ${cx} 332 ${cx + halfW - 4} 335`}
              fill="none"
              stroke={colors.stroke}
              strokeWidth="0.8"
              opacity="0.6"
            />
          </g>
        ) : null}

        {/* 4. Lower Roots (pointing DOWN, y: 345 to 400) */}
        {!isMissing ? (
          info.cat === 'molar' ? (
            // 2 roots for lower molars
            <g fill={colors.fill} stroke={colors.stroke} strokeWidth="1.5">
              <path d={`M ${cx - 14} 342 C ${cx - 18} 365, ${cx - 14} 390, ${cx - 8} 398 C ${cx - 4} 390, ${cx - 6} 365, ${cx - 4} 342 Z`} />
              <path d={`M ${cx + 4} 342 C ${cx + 6} 365, ${cx + 4} 390, ${cx + 8} 398 C ${cx + 14} 390, ${cx + 18} 365, ${cx + 14} 342 Z`} />
            </g>
          ) : info.cat === 'canine' ? (
            // Long single pointed root pointing down
            <path
              d={`M ${cx - 9} 342 C ${cx - 8} 365, ${cx - 3} 395, ${cx} 402 C ${cx + 3} 395, ${cx + 8} 365, ${cx + 9} 342 Z`}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth="1.5"
            />
          ) : (
            // Incisor / Premolar slim root pointing down
            <path
              d={`M ${cx - 8} 342 C ${cx - 7} 365, ${cx - 2} 392, ${cx} 398 C ${cx + 2} 392, ${cx + 7} 365, ${cx + 8} 342 Z`}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth="1.5"
            />
          )
        ) : null}

        {/* Missing Cross Overlay */}
        {isMissing && (
          <g stroke="#ef4444" strokeWidth="2.5" opacity="0.85">
            <line x1={cx - halfW} y1="250" x2={cx + halfW} y2="395" />
            <line x1={cx + halfW} y1="250" x2={cx - halfW} y2="395" />
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto pb-2">
        <svg
          viewBox="0 0 960 425"
          className="w-full min-w-[850px] max-w-4xl mx-auto block filter drop-shadow-2xs select-none"
        >
          {/* Horizontal Midline divider */}
          <line x1="20" y1="205" x2="940" y2="205" stroke="#94a3b8" strokeWidth="1.5" />

          {/* Lateral Labels */}
          <text x="15" y="190" textAnchor="start" fontSize="11" fontWeight="bold" fill="#64748b">
            Your
          </text>
          <text x="15" y="222" textAnchor="start" fontSize="11" fontWeight="bold" fill="#64748b">
            Right
          </text>

          <text x="945" y="190" textAnchor="end" fontSize="11" fontWeight="bold" fill="#64748b">
            Your
          </text>
          <text x="945" y="222" textAnchor="end" fontSize="11" fontWeight="bold" fill="#64748b">
            Left
          </text>

          {/* Upper Arch Teeth (1 to 16) */}
          {upperList.map((num, idx) => renderUpperTooth(num, idx))}

          {/* Lower Arch Teeth (32 down to 17) */}
          {lowerList.map((num, idx) => renderLowerTooth(num, idx))}
        </svg>
      </div>

      {/* Hover Info Banner */}
      <div className="h-7 flex items-center justify-between text-xs px-2 text-slate-500 border-t border-slate-100 pt-3">
        {hoveredTooth ? (
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded font-mono">
              Tooth #{hoveredTooth}
            </span>
            <span className="font-semibold text-slate-800">
              {TOOTH_INFO[hoveredTooth]?.name}
            </span>
            {teethData[hoveredTooth] && teethData[hoveredTooth][0] && (
              <span className="text-amber-600 font-medium">
                • Status: {teethData[hoveredTooth][0].condition} ({teethData[hoveredTooth][0].surface || 'Whole'})
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400">
            Hover over any tooth to view details, click to record diagnosis or add to treatment plan.
          </span>
        )}

        <span className="text-[11px] text-slate-400">
          Upper Maxillary (1-16) • Lower Mandibular (32-17)
        </span>
      </div>
    </div>
  );
}
