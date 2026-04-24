"use client";


interface SparklineProps {
  data: number[];
  color?: string;
  w?: number;
  h?: number;
  fill?: boolean;
}

export function Sparkline({ data, color = "#0057ff", w = 120, h = 36, fill = true }: SparklineProps) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * (h - 4) - 2,
  ]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const dFill = `${d} L${w},${h} L0,${h} Z`;
  const gradId = `spg-${color.replace("#", "")}`;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      {fill && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={dFill} fill={`url(#${gradId})`} />
        </>
      )}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


interface LineSeries {
  color: string;
  data: number[];
  dashed?: boolean;
}

interface LineChartProps {
  series: LineSeries[];
  labels: string[];
  w?: number;
  h?: number;
  yTicks?: number;
}

export function LineChart({ series, labels, w = 640, h = 236, yTicks = 4 }: LineChartProps) {
  const pad = { t: 18, r: 16, b: 30, l: 36 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const all = series.flatMap((s) => s.data);
  const max = Math.ceil(Math.max(...all) / 10) * 10 || 10;
  const min = 0;
  const step = max / yTicks;
  const border = "#e6ebf1";
  const faint = "#8898aa";
  const font = '"Geist", -apple-system, system-ui, sans-serif';

  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = pad.t + (i / yTicks) * ch;
        const val = max - i * step;
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={pad.l + cw} y2={y}
              stroke={border} strokeWidth="1" strokeDasharray={i === yTicks ? "0" : "2,3"} />
            <text x={pad.l - 8} y={y + 3.5} textAnchor="end"
              fontSize="10.5" fill={faint} fontFamily={font}>{val}</text>
          </g>
        );
      })}
      {labels.map((l, i) => {
        const x = labels.length > 1
          ? pad.l + (i / (labels.length - 1)) * cw
          : pad.l + cw / 2;
        return (
          <text key={i} x={x} y={h - pad.b + 16} textAnchor="middle"
            fontSize="10.5" fill={faint} fontFamily={font}>{l}</text>
        );
      })}
      {series.map((s, si) => {
        const pts = s.data.map((v, i) => [
          s.data.length > 1 ? pad.l + (i / (s.data.length - 1)) * cw : pad.l + cw / 2,
          pad.t + ch - ((v - min) / (max - min || 1)) * ch,
        ]);
        const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
        const dFill = `${d} L${pts[pts.length - 1][0]},${pad.t + ch} L${pts[0][0]},${pad.t + ch} Z`;
        const grad = `lcg-${si}-${s.color.replace("#", "")}`;
        return (
          <g key={si}>
            <defs>
              <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={si === 0 ? 0.18 : 0.08} />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            </defs>
            {si === 0 && <path d={dFill} fill={`url(#${grad})`} />}
            <path d={d} fill="none" stroke={s.color} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={s.dashed ? "4,4" : "0"} />
            {si === 0 && pts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="#fff" stroke={s.color} strokeWidth="1.5" />
            ))}
          </g>
        );
      })}
    </svg>
  );
}


interface DonutSegment {
  value: number;
  color: string;
}

interface DonutProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  center?: React.ReactNode;
}

export function Donut({ segments, size = 150, thickness = 20, center }: DonutProps) {
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  const border = "#e6ebf1";
  let offset = 0;
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <g transform={`translate(${size / 2},${size / 2}) rotate(-90)`}>
        <circle r={r} fill="none" stroke={border} strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * C;
          const el = (
            <circle key={i} r={r} fill="none" stroke={s.color}
              strokeWidth={thickness} strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset} strokeLinecap="butt" />
          );
          offset += len;
          return el;
        })}
      </g>
      {center && (
        <foreignObject x="0" y="0" width={size} height={size}>
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontFamily: '"Geist", -apple-system, system-ui, sans-serif',
            }}
          >
            {center}
          </div>
        </foreignObject>
      )}
    </svg>
  );
}


interface HeatmapProps {
  data: number[][];
  w?: number;
  days?: string[];
}

export function Heatmap({ data, w = 640, days = ["L", "M", "M", "J", "V", "S", "D"] }: HeatmapProps) {
  const rows = 7;
  const cols = 24;
  const gap = 3;
  const cell = (w - 28 - (cols - 1) * gap) / cols;
  const h = rows * cell + (rows - 1) * gap;
  const max = Math.max(...data.flat()) || 1;
  const faint = "#8898aa";
  const font = '"Geist", -apple-system, system-ui, sans-serif';
  return (
    <svg width={w} height={h + 20} style={{ display: "block" }}>
      {days.map((d, r) => (
        <text key={r} x="0" y={r * (cell + gap) + cell * 0.7 + 2}
          fontSize="10.5" fill={faint} fontFamily={font}>{d}</text>
      ))}
      {data.map((row, r) =>
        row.map((v, c) => {
          const intensity = v / max;
          const bg = intensity === 0
            ? "#f6f8fa"
            : `rgba(0,87,255,${(0.08 + intensity * 0.85).toFixed(2)})`;
          return (
            <rect key={`${r}-${c}`}
              x={22 + c * (cell + gap)}
              y={r * (cell + gap)}
              width={cell} height={cell}
              rx="2.5" fill={bg} />
          );
        })
      )}
      {[0, 6, 12, 18, 23].map((c) => (
        <text key={c} x={22 + c * (cell + gap) + cell / 2} y={h + 14}
          textAnchor="middle" fontSize="10" fill={faint} fontFamily={font}>
          {String(c).padStart(2, "0")}h
        </text>
      ))}
    </svg>
  );
}


interface BarItem {
  label: string;
  value: number;
  color?: string;
}

interface BarListProps {
  items: BarItem[];
  max?: number;
}

export function BarList({ items, max }: BarListProps) {
  const m = max ?? Math.max(...items.map((i) => i.value));
  return (
    <div className="flex flex-col gap-2.75">
      {items.map((it, i) => (
        <div key={i}>
          <div className="flex justify-between mb-1.25">
            <span className="text-[12.5px] text-[#0a2540] font-medium">{it.label}</span>
            <span className="text-xs text-[#697386] font-mono tabular-nums">{it.value}</span>
          </div>
          <div className="h-1.5 bg-[#f6f8fa] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${(it.value / m) * 100}%`, background: it.color ?? "#0057ff" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
