"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, ArrowRight, Check, Zap, Lock, Mail, TrendingUp, Send } from "lucide-react";
import { Sparkline } from "@/components/sfx-charts";
import { Pill } from "@/components/sfx-ui";
import { loginAction } from "../actions";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    startTransition(async () => {
      const result = await loginAction(email, password);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex w-full h-full" style={{ fontFamily: '"Geist", -apple-system, system-ui, sans-serif', color: "#0a2540" }}>
      {/* LEFT — Form */}
      <div className="flex flex-col" style={{ flex: "0 0 52%", padding: "40px 56px" }}>
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
            style={{ background: "linear-gradient(135deg, #0057ff, #0094ff)", boxShadow: "0 1px 2px rgba(0,87,255,0.25), 0 4px 12px rgba(0,87,255,0.15)" }}
          >
            <Zap className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.02em]">SFX Relance</span>
        </div>

        {/* Form centered */}
        <div className="flex-1 flex flex-col justify-center" style={{ maxWidth: 380, width: "100%", margin: "0 auto" }}>
          <div className="text-[11.5px] font-semibold tracking-[0.08em] uppercase text-[#0057ff] mb-2.5">
            Espace administrateur
          </div>
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.1] m-0 text-[#0a2540]">
            Bon retour.
          </h1>
          <p className="text-[14.5px] text-[#425466] mt-2.5 leading-[1.55]">
            Connectez-vous pour piloter le worker et suivre les relances de cotations.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="block text-[12.5px] font-[550] text-[#425466] mb-1.5 tracking-[-0.005em]">
                Adresse email
              </label>
              <div
                className="flex items-center gap-2.5 h-[42px] px-3 bg-white rounded-lg"
                style={{ border: "1px solid #d8dee6", boxShadow: "0 1px 2px rgba(10,37,64,0.04)" }}
              >
                <Mail className="h-[15px] w-[15px] text-[#8898aa] shrink-0" />
                <input
                  name="email"
                  type="email"
                  required
                  disabled={isPending}
                  placeholder="vous@sfx-logistics.com"
                  className="flex-1 text-[14px] text-[#0a2540] bg-transparent outline-none placeholder:text-[#8898aa]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-[12.5px] font-[550] text-[#425466] tracking-[-0.005em]">
                  Mot de passe
                </label>
                <a className="text-[12.5px] text-[#0057ff] font-[550] cursor-pointer">Oublié ?</a>
              </div>
              <div
                className="flex items-center gap-2.5 h-[42px] px-3 bg-white rounded-lg"
                style={{ border: "1.5px solid #0057ff", boxShadow: "0 0 0 3px #f2f6ff" }}
              >
                <Lock className="h-[15px] w-[15px] text-[#8898aa] shrink-0" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isPending}
                  placeholder="••••••••••••"
                  className="flex-1 text-[14px] text-[#0a2540] bg-transparent outline-none placeholder:text-[#8898aa] font-mono tracking-[0.2em]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-[#8898aa] hover:text-[#425466] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-[15px] w-[15px]" /> : <Eye className="h-[15px] w-[15px]" />}
                </button>
              </div>
            </div>

            {/* Remember */}
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-4 h-4 rounded flex items-center justify-center text-white shrink-0"
                style={{ background: "#0057ff", border: "1px solid #0057ff" }}
              >
                <Check className="h-[11px] w-[11px]" strokeWidth={3} />
              </div>
              <span className="text-[13px] text-[#425466]">
                Se souvenir de cet appareil pendant 30 jours
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className="text-[13px] text-[#cd3d64] bg-[#ffe1e6] border border-[#cd3d64]/20 px-3 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="h-11 rounded-lg mt-2.5 text-white text-[14px] font-semibold tracking-[-0.01em] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
              style={{ background: "#0057ff", border: "none", boxShadow: "0 1px 2px rgba(0,87,255,0.25), 0 4px 12px rgba(0,87,255,0.15)", cursor: "pointer" }}
            >
              {isPending ? "Connexion en cours…" : "Se connecter"}
              {!isPending && <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2.25} />}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-2.5 my-1.5">
              <div className="flex-1 h-px bg-[#e6ebf1]" />
              <span className="text-[11.5px] text-[#8898aa] font-medium">OU CONTINUER AVEC</span>
              <div className="flex-1 h-px bg-[#e6ebf1]" />
            </div>

            {/* SSO */}
            <button
              type="button"
              className="h-[42px] rounded-lg bg-white text-[#0a2540] text-[13.5px] font-[550] flex items-center justify-center gap-2.5 transition-colors hover:bg-[#fafbfc]"
              style={{ border: "1px solid #d8dee6", boxShadow: "0 1px 2px rgba(10,37,64,0.04)", cursor: "pointer" }}
            >
              <svg width="16" height="16" viewBox="0 0 21 21">
                <path fill="#f35325" d="M1 1h9v9H1z" />
                <path fill="#81bc06" d="M11 1h9v9h-9z" />
                <path fill="#05a6f0" d="M1 11h9v9H1z" />
                <path fill="#ffba08" d="M11 11h9v9h-9z" />
              </svg>
              Compte Microsoft Entra ID (SSO)
            </button>
          </form>

          {/* Status */}
          <div className="mt-8 text-[12px] text-[#697386] leading-[1.55]">
            Environnement : <b className="text-[#0a2540]">production</b>
            <span className="text-[#8898aa] mx-1.5">·</span>
            <span className="inline-flex items-center gap-1 text-[#0e9f6e] font-[550]">
              <span className="w-1.5 h-1.5 bg-[#0e9f6e] rounded-full" style={{ boxShadow: "0 0 0 2px #defbe6" }} />
              Tous les services opérationnels
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between text-[11.5px] text-[#8898aa]">
          <span>© 2026 SFX Logistics · Outil interne</span>
          <span className="flex gap-[18px]">
            <a className="hover:text-[#425466] cursor-pointer">Confidentialité</a>
            <a className="hover:text-[#425466] cursor-pointer">Support IT</a>
            <a className="hover:text-[#425466] cursor-pointer">Changelog</a>
          </span>
        </div>
      </div>

      {/* RIGHT — Visual panel */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #f2f6ff 0%, #e7efff 55%, #dbe6ff 100%)",
          borderLeft: "1px solid #e6ebf1",
        }}
      >
        {/* Grid pattern */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
          <defs>
            <pattern id="lgrid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0H0V28" fill="none" stroke="#0057ff" strokeOpacity="0.12" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lgrid)" />
        </svg>

        {/* Ambient blobs */}
        <div style={{ position: "absolute", top: -120, right: -120, width: 400, height: 400, background: "radial-gradient(circle, rgba(0,87,255,0.2) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: -150, left: -80, width: 360, height: 360, background: "radial-gradient(circle, rgba(124,77,255,0.2) 0%, transparent 70%)", filter: "blur(40px)" }} />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col p-12 justify-between">
          <div>
            <div className="text-[12px] font-semibold tracking-[0.12em] uppercase text-[#0057ff] mb-3.5">
              Automatisation des relances
            </div>
            <h2 className="text-[36px] font-semibold tracking-[-0.03em] leading-[1.1] m-0 text-[#0a2540] max-w-[440px]">
              Plus une cotation ne passe entre les mailles.
            </h2>
          </div>

          {/* Preview cards */}
          <div className="flex flex-col gap-3 mt-8">
            {/* Metric card */}
            <div
              className="bg-white rounded-xl p-[18px] flex items-center gap-[18px]"
              style={{ border: "1px solid #e6ebf1", boxShadow: "0 12px 32px rgba(10,37,64,0.08)", transform: "rotate(-1deg)" }}
            >
              <div className="w-[42px] h-[42px] rounded-[10px] bg-[#defbe6] text-[#0e9f6e] flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div className="flex-1">
                <div className="text-[12px] text-[#697386] font-medium">Taux de réponse · 30j</div>
                <div className="text-[24px] font-semibold text-[#0a2540] tracking-[-0.02em] font-mono tabular-nums flex items-baseline gap-2">
                  68,4%
                  <span className="text-[12px] text-[#0e9f6e] font-semibold">+12,3pt</span>
                </div>
              </div>
              <Sparkline data={[40, 45, 42, 48, 52, 55, 60, 58, 64, 62, 68]} color="#0e9f6e" w={90} h={36} />
            </div>

            {/* Email event card */}
            <div
              className="bg-white rounded-xl p-4 flex items-center gap-3.5"
              style={{ border: "1px solid #e6ebf1", boxShadow: "0 12px 32px rgba(10,37,64,0.08)", transform: "translateX(40px)" }}
            >
              <div className="w-9 h-9 rounded-[10px] bg-[#e7efff] text-[#0057ff] flex items-center justify-center shrink-0">
                <Send className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#0a2540]">Relance #2 envoyée</div>
                <div className="text-[12px] text-[#697386] mt-0.5">COT-24810 · Bolloré Logistics · Maritime</div>
              </div>
              <span className="text-[11px] text-[#8898aa] font-mono">il y a 2min</span>
            </div>

            {/* Client answered card */}
            <div
              className="bg-white rounded-xl p-4 flex items-center gap-3.5"
              style={{ border: "1px solid #e6ebf1", boxShadow: "0 12px 32px rgba(10,37,64,0.08)", transform: "translateX(-24px)" }}
            >
              <div className="w-9 h-9 rounded-[10px] bg-[#defbe6] text-[#0e9f6e] flex items-center justify-center shrink-0">
                <Check className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#0a2540]">Client a répondu</div>
                <div className="text-[12px] text-[#697386] mt-0.5">COT-24801 · relances arrêtées automatiquement</div>
              </div>
              <Pill tone="green">Stop</Pill>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
