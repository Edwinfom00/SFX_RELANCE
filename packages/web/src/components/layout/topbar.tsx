"use client";

import { Bell, Search } from "lucide-react";
import { KBD, SfxAvatar } from "@/components/sfx-ui";
import { logoutAction } from "@/modules/auth/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  userName?: string;
  userEmail?: string;
}

export function Topbar({ title, subtitle, actions, userName = "Admin", userEmail = "" }: TopbarProps) {
  return (
    <header className="h-[60px] border-b border-[#e6ebf1] flex items-center px-7 gap-5 bg-white shrink-0">
      {/* Title */}
      <div className="flex-1 min-w-0">
        {title && (
          <div className="flex items-center gap-2.5">
            <h1 className="text-[17px] font-semibold text-[#0a2540] tracking-[-0.02em] m-0">
              {title}
            </h1>
            {subtitle && (
              <span className="text-[13px] text-[#697386] font-[450]">{subtitle}</span>
            )}
          </div>
        )}
      </div>

      {/* Command palette */}
      <div className="flex items-center gap-2 h-8 px-2.5 min-w-[280px] bg-[#f6f8fa] border border-[#e6ebf1] rounded-[7px] text-[#697386] text-[13px]">
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1">Rechercher cotations, clients…</span>
        <KBD>⌘K</KBD>
      </div>

      {/* Actions slot */}
      {actions}

      {/* Notifications */}
      <div className="relative w-8 h-8 rounded-[7px] bg-[#f6f8fa] border border-[#e6ebf1] flex items-center justify-center text-[#697386] cursor-pointer hover:bg-[#f0f2f5] transition-colors">
        <Bell className="h-[15px] w-[15px]" />
        <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] bg-[#cd3d64] rounded-full border-[1.5px] border-white" />
      </div>

      {/* User */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-none p-0" />
          }
        >
          <SfxAvatar name={userName} size={30} />
          <div className="leading-[1.15]">
            <div className="text-[12.5px] font-semibold text-[#0a2540]">{userName}</div>
            <div className="text-[11px] text-[#697386]">Admin</div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-2 border-b border-[#e6ebf1] mb-1">
            <div className="flex items-center gap-2.5">
              <SfxAvatar name={userName} size={32} />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium leading-tight text-[#0a2540]">{userName}</span>
                <span className="text-xs text-[#697386] leading-tight truncate">{userEmail}</span>
              </div>
            </div>
          </div>
          <DropdownMenuItem
            className="text-destructive cursor-pointer gap-2"
            onClick={() => logoutAction()}
          >
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
