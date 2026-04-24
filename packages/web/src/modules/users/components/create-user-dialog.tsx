"use client";

import { useState, useTransition } from "react";
import { X, Copy, Check, RefreshCw } from "lucide-react";
import { SfxButton, Pill } from "@/components/sfx-ui";
import { toast } from "sonner";
import { createUserAction } from "../actions";
import { generateTempPassword } from "../utils";

interface Role { id: number; name: string; label: string; }

interface CreateUserDialogProps {
  roles: Role[];
  onClose: () => void;
}

const ROLE_TONE: Record<string, "blue" | "amber" | "neutral"> = {
  ADMIN: "blue", MANAGER: "amber", VIEWER: "neutral",
};

export function CreateUserDialog({ roles, onClose }: CreateUserDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function toggleRole(id: number) {
    setSelectedRoles((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    setError("");
    if (!name.trim()) { setError("Le nom est requis."); return; }
    if (!email.trim()) { setError("L'email est requis."); return; }
    if (selectedRoles.length === 0) { setError("Sélectionnez au moins un rôle."); return; }

    startTransition(async () => {
      const result = await createUserAction({ name, email, roleIds: selectedRoles });
      if (result.success && result.tempPassword) {
        setCreated({ tempPassword: result.tempPassword });
      } else {
        setError(result.error ?? "Erreur inconnue");
      }
    });
  }

  async function handleCopy() {
    if (!created) return;
    await navigator.clipboard.writeText(created.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <div className="text-sm font-semibold text-[#0a2540]">Nouvel utilisateur</div>
            <div className="text-xs text-[#697386] mt-0.5">Un email d'invitation sera envoyé automatiquement</div>
          </div>
          {!isPending && (
            <button onClick={onClose} className="text-[#8898aa] hover:text-[#425466] transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {!created ? (
            <div className="flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="block text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.04em] mb-1.5">
                  Nom complet
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean Dupont"
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
                  placeholder="jean.dupont@sfx.com"
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-[#0a2540]">{role.label}</span>
                            <Pill tone={ROLE_TONE[role.name] ?? "neutral"} size="xs">{role.name}</Pill>
                          </div>
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
          ) : (
            /* Succès — afficher le mot de passe temporaire */
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#defbe6] flex items-center justify-center shrink-0">
                  <Check className="h-5 w-5 text-[#0e9f6e]" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#0a2540]">Utilisateur créé avec succès</div>
                  <div className="text-[12px] text-[#697386] mt-0.5">
                    Un email d'invitation a été envoyé à <b>{email}</b>.
                  </div>
                </div>
              </div>

              <div className="bg-[#fafbfc] border border-[#e6ebf1] rounded-lg p-4">
                <div className="text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.04em] mb-2">
                  Mot de passe temporaire
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[18px] font-mono font-bold text-[#0057ff] tracking-[2px]">
                    {created.tempPassword}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium transition-all"
                    style={{
                      background: copied ? "#defbe6" : "#e7efff",
                      color: copied ? "#0e9f6e" : "#0057ff",
                    }}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copié !" : "Copier"}
                  </button>
                </div>
                <div className="text-[11px] text-[#c28b00] mt-2 flex items-center gap-1">
                  ⚠️ L'utilisateur devra changer ce mot de passe à sa première connexion.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e6ebf1] flex justify-end gap-2">
          {!created ? (
            <>
              <SfxButton variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
                Annuler
              </SfxButton>
              <SfxButton variant="primary" size="sm" onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Création…" : "Créer l'utilisateur"}
              </SfxButton>
            </>
          ) : (
            <SfxButton variant="primary" size="sm" onClick={onClose}>
              Fermer
            </SfxButton>
          )}
        </div>
      </div>
    </div>
  );
}
