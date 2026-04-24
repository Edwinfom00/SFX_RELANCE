import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import {
  Plane,
  Ship,
  Truck,
  Send,
  Clock,
  TrendingUp,
  TrendingDown,
  X,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Search,
  Bell,
  Plus,
  Zap,
  User,
  Lock,
  Eye,
  EyeOff,
  Filter,
  MoreHorizontal,
  ExternalLink,
  Edit,
  Trash2,
  RefreshCw,
  Calendar,
  Play,
  Pause,
  Mail,
  Settings,
  LayoutDashboard,
  List,
  FileText,
  AlertCircle,
} from "lucide-react";


type TransportType = "AIR" | "SEA" | "ROAD";

const transportConfig: Record<TransportType, { label: string; icon: LucideIcon; className: string }> = {
  AIR:  { label: "Aérien",   icon: Plane, className: "bg-[#e7efff] text-[#0057ff]" },
  SEA:  { label: "Maritime", icon: Ship,  className: "bg-[#defbe6] text-[#0e9f6e]" },
  ROAD: { label: "Route",    icon: Truck, className: "bg-[#fff3d6] text-[#c28b00]" },
};

interface TransportBadgeProps {
  type: TransportType | string;
  size?: "sm" | "lg";
}

export function TransportBadge({ type, size = "sm" }: TransportBadgeProps) {
  const cfg = transportConfig[type as TransportType] ?? transportConfig.AIR;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium leading-none",
        cfg.className,
        size === "lg" ? "h-7 px-2.5 text-[13px]" : "h-5.5 px-2 text-[11.5px]"
      )}
    >
      <Icon className={size === "lg" ? "h-3.5 w-3.5" : "h-3 w-3"} strokeWidth={2} />
      {cfg.label}
    </span>
  );
}


type PillTone = "neutral" | "blue" | "green" | "amber" | "red" | "purple";

const pillTones: Record<PillTone, string> = {
  neutral: "bg-[#f6f8fa] text-[#697386] border border-[#e6ebf1]",
  blue:    "bg-[#e7efff] text-[#0057ff]",
  green:   "bg-[#defbe6] text-[#0e9f6e]",
  amber:   "bg-[#fff3d6] text-[#c28b00]",
  red:     "bg-[#ffe1e6] text-[#cd3d64]",
  purple:  "bg-[#ece5ff] text-[#7c4dff]",
};

interface PillProps {
  children: React.ReactNode;
  tone?: PillTone;
  size?: "xs" | "sm";
  className?: string;
}

export function Pill({ children, tone = "neutral", size = "sm", className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium leading-none whitespace-nowrap",
        pillTones[tone],
        size === "xs" ? "h-4.5 px-1.5 text-[10.5px]" : "h-5.5 px-2 text-[11.5px]",
        className
      )}
    >
      {children}
    </span>
  );
}


export function QuotationStatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: PillTone; label: string }> = {
    ACTIVE:    { tone: "blue",    label: "Actif" },
    COMPLETED: { tone: "green",   label: "Terminé" },
    CANCELLED: { tone: "neutral", label: "Annulé" },
  };
  const cfg = map[status] ?? { tone: "neutral", label: status };
  return <Pill tone={cfg.tone}>{cfg.label}</Pill>;
}

export function EmailStatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: PillTone; label: string }> = {
    SENT:    { tone: "green",  label: "Envoyé" },
    FAILED:  { tone: "red",    label: "Échec" },
    PENDING: { tone: "amber",  label: "En attente" },
    RETRIED: { tone: "purple", label: "Retenté" },
  };
  const cfg = map[status] ?? { tone: "neutral", label: status };
  return <Pill tone={cfg.tone}>{cfg.label}</Pill>;
}


type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
type BtnSize = "sm" | "md" | "lg";

const btnVariants: Record<BtnVariant, string> = {
  primary:   "bg-[#0057ff] text-white border border-[#0057ff] sfx-shadow-blue hover:bg-[#0047d6] hover:border-[#0047d6]",
  secondary: "bg-white text-[#0a2540] border border-[#d8dee6] sfx-shadow-sm hover:bg-[#fafbfc]",
  ghost:     "bg-transparent text-[#697386] border border-transparent hover:bg-[#f6f8fa] hover:text-[#0a2540]",
  danger:    "bg-white text-[#cd3d64] border border-[#d8dee6] sfx-shadow-sm hover:bg-[#ffe1e6]",
};

const btnSizes: Record<BtnSize, string> = {
  sm: "h-7 px-2.5 text-[12.5px] gap-1.5",
  md: "h-[34px] px-3.5 text-[13.5px] gap-1.5",
  lg: "h-10 px-4.5 text-sm gap-2",
};

interface SfxButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  children?: React.ReactNode;
}

export function SfxButton({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  children,
  className,
  ...props
}: SfxButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[7px] font-medium leading-none transition-colors cursor-pointer",
        btnVariants[variant],
        btnSizes[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />}
      {children}
      {IconRight && <IconRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />}
    </button>
  );
}


interface SfxCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function SfxCard({ children, className, padding = true }: SfxCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-[#e6ebf1] rounded-xl sfx-shadow-sm",
        padding && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}


export function KBD({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 bg-white border border-[#e6ebf1] border-b-[#d8dee6] border-b-[1.5px] rounded text-[11px] font-medium text-[#697386] font-mono">
      {children}
    </span>
  );
}


const avatarColors = ["#0057ff", "#0e9f6e", "#c28b00", "#7c4dff", "#e11d74", "#0891b2"];

interface SfxAvatarProps {
  name: string;
  size?: number;
}

export function SfxAvatar({ name, size = 24 }: SfxAvatarProps) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const color = avatarColors[name.charCodeAt(0) % avatarColors.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.4,
        borderRadius: "50%",
        flexShrink: 0,
      }}
      className="inline-flex items-center justify-center text-white font-semibold leading-none"
    >
      {initials}
    </div>
  );
}


export function ReminderSteps({ current, total = 3 }: { current: number; total?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold font-mono",
            i < current
              ? "bg-[#0057ff] text-white"
              : "bg-[#f6f8fa] text-[#8898aa]"
          )}
        >
          {i + 1}
        </span>
      ))}
    </div>
  );
}


interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, children }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6ebf1]">
      <div>
        <div className="text-sm font-semibold text-[#0a2540] tracking-tight">{title}</div>
        {subtitle && <div className="text-xs text-[#697386] mt-0.5">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}


export {
  Plane, Ship, Truck, Send, Clock, TrendingUp, TrendingDown,
  X, Check, ChevronRight, ChevronDown, ChevronLeft,
  ArrowUp, ArrowDown, ArrowRight, Search, Bell, Plus, Zap,
  User, Lock, Eye, EyeOff, Filter, MoreHorizontal, ExternalLink,
  Edit, Trash2, RefreshCw, Calendar, Play, Pause, Mail,
  Settings, LayoutDashboard, List, FileText, AlertCircle,
};
