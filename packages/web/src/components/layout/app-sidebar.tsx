"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  List,
  Clock,
  Mail,
  RefreshCw,
  Settings,
  User,
  ChevronDown,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Tableau de bord", href: "/dashboard",  icon: LayoutDashboard },
  { label: "Cotations",       href: "/quotations",  icon: List,            badge: null },
  { label: "Templates email", href: "/templates",   icon: Mail },
  { label: "Audit / Logs",    href: "/logs",         icon: RefreshCw },
];

const systemItems = [
  { label: "Worker",       href: "/worker",   icon: Settings },
  { label: "Utilisateurs", href: "/users",    icon: User },
];

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: number | null;
  href: string;
}

function SidebarItem({ icon: Icon, label, active, badge, href }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 h-[34px] px-2.5 rounded-[7px] text-[13.5px] font-medium tracking-[-0.01em] transition-colors",
        active
          ? "bg-[#f2f6ff] text-[#0057ff]"
          : "text-[#425466] hover:bg-[#f6f8fa] hover:text-[#0a2540]"
      )}
    >
      <Icon
        className={cn("h-4 w-4 shrink-0", active ? "stroke-[2]" : "stroke-[1.75]")}
      />
      <span className="flex-1">{label}</span>
      {badge != null && (
        <span
          className={cn(
            "min-w-[18px] h-[18px] px-1.5 rounded text-[11px] font-semibold inline-flex items-center justify-center",
            active ? "bg-[#0057ff] text-white" : "bg-[#e6ebf1] text-[#697386]"
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

interface AppSidebarProps {
  userName?: string;
  userEmail?: string;
  quotationsCount?: number;
  workerStatusCard?: React.ReactNode;
}

export function AppSidebar({ userName = "Admin", userEmail = "", quotationsCount, workerStatusCard }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-[232px] shrink-0 bg-[#fafbfc] border-r border-[#e6ebf1] flex flex-col h-full">
      {/* Workspace picker */}
      <div className="flex items-center gap-2.5 px-3.5 py-3.5 border-b border-[#e6ebf1]">
        <div
          className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0 text-white sfx-shadow-blue"
          style={{ background: "linear-gradient(135deg, #0057ff, #0094ff)" }}
        >
          <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-[#0a2540] tracking-[-0.01em]">SFX Relance</div>
          <div className="text-[11px] text-[#8898aa] mt-px">Production · v1.0.0</div>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-[#8898aa]" />
      </div>

      {/* Primary nav */}
      <div className="flex flex-col gap-0.5 px-3.5 pt-3.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive}
              href={item.href}
              badge={item.label === "Cotations" ? quotationsCount ?? null : null}
            />
          );
        })}
      </div>

      {/* System section */}
      <div className="px-3.5 mt-5">
        <div className="px-2.5 mb-2 text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[#8898aa]">
          Système
        </div>
        <div className="flex flex-col gap-0.5">
          {systemItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive}
                href={item.href}
              />
            );
          })}
        </div>
      </div>

      {/* Worker status card — dynamique depuis le layout */}
      <div className="mt-auto">
        {workerStatusCard ?? (
          <div className="mx-3.5 mb-3.5 p-3 bg-white border border-[#e6ebf1] rounded-[9px]">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.75 h-1.75 rounded-full bg-[#e6ebf1]" />
              <span className="text-xs font-semibold text-[#8898aa]">Chargement…</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
