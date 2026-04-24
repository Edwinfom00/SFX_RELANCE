"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Check, RefreshCw, Copy } from "lucide-react";
import { SfxButton } from "@/components/sfx-ui";
import { toast } from "sonner";
import { changePasswordAction } from "../actions";
import { generateTempPassword } from "../utils";

const RULES = [
  { label: "8 caractères minimum",    test: (p: string) => p.length >= 8 },
  { label: "Une majuscule",           test: (p: string) => /[A-Z]/.test(p) },
  { label: "Une minuscule",           test: (p: string) => /[a-z]/.test(p) },
  { label: "Un chiffre",              test: (p: string) => /[0-9]/.test(p) },
  { label: "Un caractère spécial",    test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

interface ChangePasswordFormProps {
  forced?: boolean; // true = première connexion
}

export function ChangePasswordForm({ forced = false }: ChangePasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const rules = RULES.map((r) => ({ ...r, ok: r.test(next) }));
  const allRulesOk = rules.every((r) => r.ok);
  const passwordsMatch = next === confirm && next !== "";

  function handleGenerate() {
    const p = generateTempPassword();
    setNext(p);
    setConfirm(p);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(next);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSubmit() {
    setError("");
    if (!allRulesOk) { setError("Le mot de passe ne respecte pas les règles de sécurité."); return; }
    if (!passwordsMatch) { setError("Les mots de passe ne correspondent pas."); return; }

    startTransition(async () => {
      const result = await changePasswordAction(current, next);
      if (result.success) {
        toast.success("Mot de passe mis à jour");
        if (forced) window.location.href = "/dashboard";
      } else {
        setError(result.error ?? "Erreur inconnue");
      }
    });
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {forced && (
        <div className="mb-6 px-4 py-3 bg-[#fff3d6] border border-[#c28b00]/20 rounded-lg text-[13px] text-[#425466]">
          ⚠️ Vous devez changer votre mot de passe temporaire avant de continuer.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Mot de passe actuel */}
        <div>
          <label className="block text-[12px] font-semibold text-[#697386] mb-1.5">
            Mot de passe actuel
          </label>
          <div className="flex items-center gap-2 h-10 px-3.5 bg-white border border-[#d8dee6] rounded-lg">
            <input
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="flex-1 text-[14px] text-[#0a2540] bg-transparent outline-none"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowCurrent((v) => !v)} className="text-[#8898aa]">
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Nouveau mot de passe */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[12px] font-semibold text-[#697386]">Nouveau mot de passe</label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleGenerate}
                className="flex items-center gap-1 text-[11.5px] text-[#0057ff] hover:underline"
              >
                <RefreshCw className="h-3 w-3" /> Générer
              </button>
              {next && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11.5px] text-[#697386] hover:text-[#0a2540]"
                >
                  {copied ? <Check className="h-3 w-3 text-[#0e9f6e]" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copié" : "Copier"}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 h-10 px-3.5 bg-white border border-[#d8dee6] rounded-lg">
            <input
              type={showNext ? "text" : "password"}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="flex-1 text-[14px] text-[#0a2540] bg-transparent outline-none font-mono"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowNext((v) => !v)} className="text-[#8898aa]">
              {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Règles */}
          {next && (
            <div className="mt-2 grid grid-cols-2 gap-1">
              {rules.map((r) => (
                <div key={r.label} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: r.ok ? "#0e9f6e" : "#8898aa" }}>
                  <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: r.ok ? "#defbe6" : "#f6f8fa" }}>
                    {r.ok && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                  </div>
                  {r.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmation */}
        <div>
          <label className="block text-[12px] font-semibold text-[#697386] mb-1.5">
            Confirmer le nouveau mot de passe
          </label>
          <div
            className="flex items-center gap-2 h-10 px-3.5 bg-white rounded-lg transition-all"
            style={{
              border: confirm && !passwordsMatch ? "1.5px solid #cd3d64" : "1px solid #d8dee6",
              boxShadow: confirm && passwordsMatch ? "0 0 0 3px #defbe6" : undefined,
            }}
          >
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="flex-1 text-[14px] text-[#0a2540] bg-transparent outline-none font-mono"
              placeholder="••••••••"
            />
            {confirm && passwordsMatch && <Check className="h-4 w-4 text-[#0e9f6e]" />}
          </div>
          {confirm && !passwordsMatch && (
            <div className="text-[11.5px] text-[#cd3d64] mt-1">Les mots de passe ne correspondent pas.</div>
          )}
        </div>

        {error && (
          <div className="text-[12.5px] text-[#cd3d64] bg-[#ffe1e6] px-3 py-2 rounded-lg">{error}</div>
        )}

        <SfxButton
          variant="primary"
          size="md"
          icon={Check}
          onClick={handleSubmit}
          disabled={isPending || !allRulesOk || !passwordsMatch || !current}
          className="w-full justify-center"
        >
          {isPending ? "Mise à jour…" : "Mettre à jour le mot de passe"}
        </SfxButton>
      </div>
    </div>
  );
}
