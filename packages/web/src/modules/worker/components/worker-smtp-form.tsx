"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SfxButton } from "@/components/sfx-ui";
import { Check, Eye, EyeOff, Send, X, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { updateWorkerConfigAction, sendSmtpTestAction } from "../actions";
import type { WorkerConfig } from "../types";

interface WorkerSmtpFormProps {
  config: WorkerConfig;
}

export function WorkerSmtpForm({ config }: WorkerSmtpFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showPass, setShowPass] = useState(false);

  const [host, setHost] = useState(config.smtpHost);
  const [port, setPort] = useState(config.smtpPort);
  const [secure, setSecure] = useState(config.smtpSecure);
  const [user, setUser] = useState(config.smtpUser);
  const [from, setFrom] = useState(config.smtpFrom);
  // Mot de passe — vide = inchangé (on affiche •••• si déjà configuré)
  const [pass, setPass] = useState("");
  const hasExistingPass = config.smtpPass === "••••••••";

  // Modal de test
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState(config.smtpUser);
  const [testState, setTestState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testError, setTestError] = useState("");

  function handleSave() {
    startTransition(async () => {
      await updateWorkerConfigAction({
        smtpHost: host,
        smtpPort: port,
        smtpSecure: secure,
        smtpUser: user,
        smtpFrom: from,
        // N'envoyer le pass que s'il a été modifié
        ...(pass ? { smtpPass: pass } : {}),
      });
      toast.success("Configuration SMTP mise à jour");
      setPass(""); // reset après sauvegarde
    });
  }

  function handleOpenTest() {
    setTestState("idle");
    setTestError("");
    setTestEmail(user || config.smtpUser);
    setShowTestModal(true);
  }

  function handleSendTest() {
    if (!testEmail) return;
    setTestState("loading");
    startTransition(async () => {
      const result = await sendSmtpTestAction(testEmail);
      if (result.success) {
        setTestState("success");
      } else {
        setTestState("error");
        setTestError(result.error ?? "Erreur inconnue");
      }
    });
  }

  return (
    <div>
      <div className="pb-1">
        <div className="text-[16px] font-semibold text-[#0a2540] tracking-[-0.015em]">
          Configuration SMTP & expéditeur
        </div>
        <div className="text-[12.5px] text-[#697386] mt-0.5">
          Paramètres du serveur d'envoi d'emails.
        </div>
      </div>

      <SettingRow label="Serveur SMTP" hint="Hôte et port du serveur d'envoi." compact>
        <div className="flex items-center gap-2">
          <SmtpInput value={host} onChange={setHost} placeholder="smtp.gmail.com" className="flex-1" />
          <SmtpInput value={String(port)} onChange={(v) => setPort(Number(v))} placeholder="587" className="w-20" type="number" />
          <button
            type="button"
            onClick={() => setSecure((v) => !v)}
            className="flex items-center gap-1.5 h-8.5 px-3 rounded-[7px] text-[12.5px] font-medium transition-all"
            style={{
              background: secure ? "#e7efff" : "#fff",
              color: secure ? "#0057ff" : "#697386",
              border: `1px solid ${secure ? "#0057ff" : "#d8dee6"}`,
            }}
          >
            <div className="w-7 h-3.75 rounded-full p-0.5 transition-colors" style={{ background: secure ? "#0057ff" : "#d8dee6" }}>
              <div className="w-3 h-3 rounded-full bg-white transition-transform" style={{ transform: secure ? "translateX(12px)" : "translateX(0)" }} />
            </div>
            TLS
          </button>
        </div>
      </SettingRow>

      <SettingRow label="Authentification" hint="Identifiants de connexion au serveur SMTP." compact>
        <div className="flex items-center gap-2">
          <SmtpInput value={user} onChange={setUser} placeholder="user@gmail.com" className="flex-1" />
          <div className="flex items-center gap-2 h-8.5 px-3 bg-white border border-[#d8dee6] rounded-[7px] sfx-shadow-sm flex-1">
            <input
              type={showPass ? "text" : "password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder={hasExistingPass ? "••••••••  (inchangé)" : "Mot de passe"}
              className="flex-1 text-[13px] font-mono text-[#0a2540] bg-transparent outline-none placeholder:text-[#8898aa]"
            />
            <button type="button" onClick={() => setShowPass((v) => !v)} className="text-[#8898aa] hover:text-[#425466] transition-colors">
              {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        {hasExistingPass && !pass && (
          <div className="mt-1.5 text-[11px] text-[#0e9f6e] flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Mot de passe configuré et chiffré — laissez vide pour conserver
          </div>
        )}
      </SettingRow>

      <SettingRow label="Adresse expéditeur" hint='Affiché dans le champ "De" des emails envoyés.' compact>
        <SmtpInput value={from} onChange={setFrom} placeholder='"SFX Relance" <cotations@sfx.com>' className="w-full max-w-sm" />
      </SettingRow>

      <div className="pt-4 flex items-center justify-between">
        <SfxButton variant="secondary" size="sm" icon={Send} onClick={handleOpenTest}>
          Envoyer un email de test
        </SfxButton>
        <SfxButton variant="primary" size="sm" icon={Check} onClick={handleSave} disabled={isPending}>
          {isPending ? "Enregistrement…" : "Enregistrer la config SMTP"}
        </SfxButton>
      </div>

      {/* ── Modal de test ─────────────────────────────────────────────────── */}
      {showTestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(10,37,64,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowTestModal(false); }}
        >
          <div className="bg-white rounded-xl w-110 sfx-shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6ebf1]">
              <div>
                <div className="text-sm font-semibold text-[#0a2540]">Envoyer un email de test</div>
                <div className="text-xs text-[#697386] mt-0.5">Vérifie que la configuration SMTP est opérationnelle</div>
              </div>
              <button onClick={() => setShowTestModal(false)} className="text-[#8898aa] hover:text-[#425466] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5">
              {testState === "idle" && (
                <>
                  <div className="text-[12.5px] text-[#425466] mb-3">
                    Un email de test sera envoyé depuis <b className="text-[#0a2540]">{from || user}</b> via{" "}
                    <b className="text-[#0a2540]">{host}:{port}</b>.
                  </div>
                  <label className="block text-[11.5px] font-semibold text-[#697386] uppercase tracking-[0.04em] mb-1.5">
                    Destinataire
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full h-10 px-3.5 bg-white border border-[#d8dee6] rounded-lg text-[14px] text-[#0a2540] outline-none focus:border-[#0057ff] focus:shadow-[0_0_0_3px_#f2f6ff] transition-all"
                    style={{ boxShadow: "0 1px 2px rgba(10,37,64,0.04)" }}
                  />
                </>
              )}

              {testState === "loading" && (
                <div className="flex items-center gap-3 py-4">
                  <Loader className="h-5 w-5 text-[#0057ff] animate-spin" />
                  <span className="text-[13px] text-[#425466]">Envoi en cours…</span>
                </div>
              )}

              {testState === "success" && (
                <div className="flex items-start gap-3 py-2">
                  <CheckCircle className="h-5 w-5 text-[#0e9f6e] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[13px] font-semibold text-[#0a2540]">Email envoyé avec succès !</div>
                    <div className="text-[12px] text-[#697386] mt-0.5">
                      Vérifiez la boîte de réception de <b>{testEmail}</b>.
                    </div>
                  </div>
                </div>
              )}

              {testState === "error" && (
                <div className="flex items-start gap-3 py-2">
                  <AlertCircle className="h-5 w-5 text-[#cd3d64] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[13px] font-semibold text-[#0a2540]">Échec de l'envoi</div>
                    <div className="text-[12px] text-[#cd3d64] mt-1 font-mono bg-[#ffe1e6] px-2 py-1.5 rounded">
                      {testError}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#e6ebf1] flex justify-end gap-2">
              <SfxButton variant="ghost" size="sm" onClick={() => setShowTestModal(false)}>
                {testState === "success" ? "Fermer" : "Annuler"}
              </SfxButton>
              {(testState === "idle" || testState === "error") && (
                <SfxButton
                  variant="primary"
                  size="sm"
                  icon={Send}
                  onClick={handleSendTest}
                  disabled={!testEmail || isPending}
                >
                  Envoyer le test
                </SfxButton>
              )}
              {testState === "error" && (
                <SfxButton variant="secondary" size="sm" onClick={() => setTestState("idle")}>
                  Réessayer
                </SfxButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingRow({ label, hint, children, compact }: {
  label: string; hint?: string; children: React.ReactNode; compact?: boolean;
}) {
  return (
    <div
      className="grid py-4.5 border-b border-[#e6ebf1]"
      style={{ gridTemplateColumns: "280px 1fr", gap: 32, alignItems: compact ? "center" : "flex-start" }}
    >
      <div>
        <div className="text-[13.5px] font-semibold text-[#0a2540] tracking-[-0.005em]">{label}</div>
        {hint && <div className="text-[12px] text-[#697386] mt-1 leading-normal">{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SmtpInput({ value, onChange, placeholder, className, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`h-8.5 px-3 bg-white border border-[#d8dee6] rounded-[7px] text-[13px] text-[#0a2540] font-mono outline-none focus:border-[#0057ff] focus:shadow-[0_0_0_3px_#f2f6ff] transition-all sfx-shadow-sm placeholder:text-[#8898aa] ${className ?? ""}`}
    />
  );
}
