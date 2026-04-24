"use client";

import { useState } from "react";
import { Plus, Shield, UserCheck, UserX, RefreshCw, Copy, Check } from "lucide-react";
import { SfxButton, SfxAvatar, Pill } from "@/components/sfx-ui";
import { toast } from "sonner";
import { CreateUserDialog } from "./create-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import { toggleUserActiveAction, resetPasswordAction } from "../actions";

interface Permission { id: number; name: string; label: string; }
interface Role { id: number; name: string; label: string; permissions: Permission[]; }
interface User {
  id: number; email: string; name: string;
  isActive: boolean; mustChangePassword: boolean;
  createdAt: Date;
  userRoles: Array<{ role: Role }>;
}

interface UsersViewProps {
  users: User[];
  roles: Role[];
  currentUserId: number;
}

const ROLE_TONE: Record<string, "blue" | "amber" | "neutral"> = {
  ADMIN: "blue", MANAGER: "amber", VIEWER: "neutral",
};

export function UsersView({ users, roles, currentUserId }: UsersViewProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  async function handleToggleActive(user: User) {
    const result = await toggleUserActiveAction(user.id, !user.isActive);
    if (result.success) {
      toast.success(user.isActive ? `${user.name} désactivé` : `${user.name} activé`);
    } else {
      toast.error(result.error);
    }
  }

  async function handleResetPassword(user: User) {
    const result = await resetPasswordAction(user.id);
    if (result.success && result.tempPassword) {
      await navigator.clipboard.writeText(result.tempPassword);
      setCopiedId(user.id);
      setTimeout(() => setCopiedId(null), 3000);
      toast.success(`Mot de passe réinitialisé et copié dans le presse-papier`);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div>
      {/* Header actions */}
      <div className="flex justify-end mb-4">
        <SfxButton variant="primary" size="sm" icon={Plus} onClick={() => setShowCreate(true)}>
          Nouvel utilisateur
        </SfxButton>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e6ebf1] rounded-xl overflow-hidden sfx-shadow-sm">
        {/* Header */}
        <div
          className="grid gap-4 px-5 py-3 border-b border-[#e6ebf1] bg-[#fafbfc]"
          style={{ gridTemplateColumns: "2fr 2fr 1fr 1fr 120px" }}
        >
          {["Utilisateur", "Email", "Rôles", "Statut", ""].map((h, i) => (
            <div key={i} className="text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.02em]">{h}</div>
          ))}
        </div>

        {/* Rows */}
        {users.map((user, i) => {
          const isCurrentUser = user.id === currentUserId;
          return (
            <div
              key={user.id}
              className="grid gap-4 px-5 py-4 items-center hover:bg-[#fafbfc] transition-colors"
              style={{
                gridTemplateColumns: "2fr 2fr 1fr 1fr 120px",
                borderBottom: i < users.length - 1 ? "1px solid #e6ebf1" : "none",
                opacity: user.isActive ? 1 : 0.6,
              }}
            >
              {/* Name */}
              <div className="flex items-center gap-2.5">
                <SfxAvatar name={user.name} size={32} />
                <div>
                  <div className="text-[13px] font-semibold text-[#0a2540]">
                    {user.name}
                    {isCurrentUser && (
                      <span className="ml-1.5 text-[10.5px] text-[#697386] font-normal">(vous)</span>
                    )}
                  </div>
                  {user.mustChangePassword && (
                    <div className="text-[11px] text-[#c28b00] flex items-center gap-1 mt-0.5">
                      <Shield className="h-3 w-3" />
                      Doit changer son mot de passe
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="text-[12.5px] text-[#425466] font-mono truncate">{user.email}</div>

              {/* Roles */}
              <div className="flex flex-wrap gap-1">
                {user.userRoles.length === 0 ? (
                  <span className="text-[12px] text-[#8898aa]">Aucun rôle</span>
                ) : (
                  user.userRoles.map((ur) => (
                    <Pill key={ur.role.id} tone={ROLE_TONE[ur.role.name] ?? "neutral"} size="xs">
                      {ur.role.label}
                    </Pill>
                  ))
                )}
              </div>

              {/* Status */}
              <div>
                {user.isActive ? (
                  <Pill tone="green">Actif</Pill>
                ) : (
                  <Pill tone="neutral">Inactif</Pill>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 justify-end">
                <button
                  onClick={() => setEditUser(user)}
                  className="h-7 px-2.5 rounded-lg text-[12px] font-medium text-[#425466] hover:bg-[#f6f8fa] transition-colors"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleResetPassword(user)}
                  title="Réinitialiser le mot de passe"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#697386] hover:bg-[#f6f8fa] transition-colors"
                >
                  {copiedId === user.id
                    ? <Check className="h-3.5 w-3.5 text-[#0e9f6e]" />
                    : <RefreshCw className="h-3.5 w-3.5" />}
                </button>
                {!isCurrentUser && (
                  <button
                    onClick={() => handleToggleActive(user)}
                    title={user.isActive ? "Désactiver" : "Activer"}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#697386] hover:bg-[#f6f8fa] transition-colors"
                  >
                    {user.isActive
                      ? <UserX className="h-3.5 w-3.5 text-[#cd3d64]" />
                      : <UserCheck className="h-3.5 w-3.5 text-[#0e9f6e]" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      {showCreate && (
        <CreateUserDialog roles={roles} onClose={() => setShowCreate(false)} />
      )}
      {editUser && (
        <EditUserDialog user={editUser} roles={roles} onClose={() => setEditUser(null)} />
      )}
    </div>
  );
}
