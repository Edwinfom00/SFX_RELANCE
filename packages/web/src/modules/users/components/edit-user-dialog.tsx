"use client";

import { useState, useTransition } from "react";
import { X, Check } from "lucide-react";
import { SfxButton, Pill } from "@/components/sfx-ui";
import { toast } from "sonner";
import { updateUserAction } from "../actions";

interface Role { id: number; name: string; label: string; }
interface User {
  id: number; email: string; name: string; isActive: boolean;
  userRoles: Array<{ role: Role }>;
}

interface EditUserDialogProps {
  user: User;
  roles: Role[];
  onClose: () => void;
}

const ROLE_TONE: Record<string, "blue" | "amber" | "neutral"> = {
  ADMIN: "blue", MANAGER: "amber", VIEWER: "neutral",
};

export function EditUserDialog({ user, roles, onClose }: EditUserDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [selectedRoles, setSelectedRoles] = useState<number[]>(
    user.userRoles.map((ur) => ur.role.id)
  );
  const [error, setError] = useState("");

  function toggleRole(id: number) {
    setSelectedRoles((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }

  function handleSave() {
    setError("");
    if (!name.trim()) { setError("Le nom est requis."); return; }
    if (!email.trim()) { setError("L'email est requis."); return; }
    if (selectedRoles.length === 0) { setError("Sélectionnez au moins un rôle."); return; }

    startTransition(async () => {
      const result = await updateUserAction(user.id, { name, email, roleIds: selectedRoles });
      if (result.success) {
        toast.success("Utilisateur mis à jour");
        onClose();
      } else {
        setError(result.error ?? "Erreur inconnue");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(10,37,64,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !isPending) onClose(); }}
    >
      <div className="bg-white rounded-xl w-120 sfx-shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6ebf1]">
          <div>
            <div className="text-sm font-semibold text-[#0a2540]">Modifier l'utilisateur</div>
            <div className="text-xs text-[#697386] mt-0.5">{user.email}</div>
          </div>
          {!isPending && (
            <button onClick={onClose} className="text-[#8898aa] hover:text-[#425466] transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="block text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.04em] mb-1.5">
              Nom complet
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3.5 bg-white border border-[#d8dee6] rounded-lg text-[14px] text-[#0a2540] outline-none focus:border-[#0057ff] focus:shadow-[0_0_0_3px_#f2f6ff] transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.04em] mb-1.5">
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3.5 bg-white border border-[#d8dee6] rounded-lg text-[14px] text-[#0a2540] outline-none focus:border-[#0057ff] focus:shadow-[0_0_0_3px_#f2f6ff] transition-all"
            />
          </div>

          {/* Roles */}
          <div>
            <label className="block text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.04em] mb-2">
              Rôles
            </label>
            <div className="flex flex-col gap-2">
              {roles.map((role) => {
                const isSelected = selectedRoles.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-left transition-all"
                    style={{
                      background: isSelected ? "#f2f6ff" : "#fff",
                      border: `1.5px solid ${isSelected ? "#0057ff" : "#e6ebf1"}`,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                      style={{
                        background: isSelected ? "#0057ff" : "#fff",
                        border: `1.5px solid ${isSelected ? "#0057ff" : "#d8dee6"}`,
                      }}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[13px] font-semibold text-[#0a2540]">{role.label}</span>
                      <Pill tone={ROLE_TONE[role.name] ?? "neutral"} size="xs">{role.name}</Pill>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="text-[12.5px] text-[#cd3d64] bg-[#ffe1e6] px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e6ebf1] flex justify-end gap-2">
          <SfxButton variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
            Annuler
          </SfxButton>
          <SfxButton variant="primary" size="sm" icon={Check} onClick={handleSave} disabled={isPending}>
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </SfxButton>
        </div>
      </div>
    </div>
  );
}
