import { SfxCard } from "@/components/sfx-ui";
import { BarList, Donut, LineChart, Heatmap } from "@/components/sfx-charts";
import {
  getDailyActivity,
  getTransportBreakdown,
  getResponseRateByTransport,
  getHeatmapData,
} from "../models";

export async function DashboardCharts({ period = 30 }: { period?: number }) {
  const [activity, transport, responseRates, heatData] = await Promise.all([
    getDailyActivity(period),
    getTransportBreakdown(),
    getResponseRateByTransport(period),
    getHeatmapData(period),
  ]);

  const { sentByDay, completedByDay, totalSent, totalCompleted, labels } = activity;
  const { air, sea, road, total } = transport;

  const safeTotal = total || 1;

  return (
    <div className="flex flex-col gap-3.5">
      {/* Row 1: Line chart + Donut */}
      <div className="grid grid-cols-[1.7fr_1fr] gap-3.5">
        {/* Line chart */}
        <SfxCard padding={false} className="px-5 pt-4.5 pb-3.5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-sm font-semibold text-[#0a2540] tracking-tight">Activité des relances</div>
              <div className="text-xs text-[#697386] mt-0.5">
                Envoyées vs. réponses reçues · {period === 1 ? "24 dernières heures" : `${period} derniers jours`}
              </div>
            </div>
            <div className="flex gap-4.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0057ff]" />
                <span className="text-xs text-[#425466] font-medium">Relances</span>
                <span className="text-[12.5px] font-semibold text-[#0a2540] font-mono">
                  {totalSent.toLocaleString("fr-FR")}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0e9f6e]" />
                <span className="text-xs text-[#425466] font-medium">Réponses</span>
                <span className="text-[12.5px] font-semibold text-[#0a2540] font-mono">
                  {totalCompleted.toLocaleString("fr-FR")}
                </span>
              </div>
            </div>
          </div>
          <LineChart
            w={640}
            h={236}
            labels={labels}
            series={[
              { color: "#0057ff", data: sentByDay.filter((_, i) => i % 3 === 0) },
              { color: "#0e9f6e", data: completedByDay.filter((_, i) => i % 3 === 0) },
            ]}
          />
        </SfxCard>

        {/* Donut */}
        <SfxCard className="p-5">
          <div className="flex justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-[#0a2540] tracking-tight">Répartition transport</div>
              <div className="text-xs text-[#697386] mt-0.5">Cotations actives</div>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Donut
              size={150}
              thickness={20}
              segments={
                total === 0
                  ? [{ value: 1, color: "#e6ebf1" }]
                  : [
                      { value: air,  color: "#0057ff" },
                      { value: sea,  color: "#0e9f6e" },
                      { value: road, color: "#c28b00" },
                    ]
              }
              center={
                <div>
                  <div style={{ fontSize: 26, fontWeight: 600, color: "#0a2540", letterSpacing: "-0.02em", lineHeight: 1 }}>
                    {total}
                  </div>
                  <div style={{ fontSize: 10.5, color: "#697386", marginTop: 2, fontWeight: 550 }}>COTATIONS</div>
                </div>
              }
            />
            <div className="flex-1 flex flex-col gap-2.5">
              {[
                { label: "Aérien",   value: air,  color: "#0057ff", pct: `${Math.round((air  / safeTotal) * 100)}%` },
                { label: "Maritime", value: sea,  color: "#0e9f6e", pct: `${Math.round((sea  / safeTotal) * 100)}%` },
                { label: "Route",    value: road, color: "#c28b00", pct: `${Math.round((road / safeTotal) * 100)}%` },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: item.color }} />
                  <span className="text-[12.5px] text-[#0a2540] font-medium flex-1">{item.label}</span>
                  <span className="text-[12.5px] font-semibold text-[#0a2540] font-mono">{item.value}</span>
                  <span className="text-[11px] text-[#8898aa] font-mono w-9 text-right">{item.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </SfxCard>
      </div>

      {/* Row 2: Heatmap + BarList */}
      <div className="grid grid-cols-[1.7fr_1fr] gap-3.5">
        {/* Heatmap */}
        <SfxCard padding={false} className="px-5 pt-4.5 pb-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-sm font-semibold text-[#0a2540] tracking-tight">Heure × Jour · envois</div>
              <div className="text-xs text-[#697386] mt-0.5">
                Densité d'envois par créneau horaire · {period === 1 ? "24h" : `${period}j`}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] text-[#8898aa]">moins</span>
              {[0.08, 0.25, 0.5, 0.75, 0.95].map((o) => (
                <span key={o} className="w-2.75 h-2.75 rounded-sm" style={{ background: `rgba(0,87,255,${o})` }} />
              ))}
              <span className="text-[10.5px] text-[#8898aa]">plus</span>
            </div>
          </div>
          <Heatmap data={heatData} w={640} />
        </SfxCard>

        {/* BarList */}
        <SfxCard className="p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold text-[#0a2540] tracking-tight">Performance par type</div>
            <div className="text-xs text-[#697386] mt-0.5">Taux de réponse · {period === 1 ? "24h" : `${period}j`}</div>
          </div>
          <BarList
            items={[
              { label: "Aérien",   value: responseRates.AIR,  color: "#0057ff" },
              { label: "Maritime", value: responseRates.SEA,  color: "#0e9f6e" },
              { label: "Route",    value: responseRates.ROAD, color: "#c28b00" },
            ]}
            max={100}
          />
          <div className="mt-4.5 pt-3.5 border-t border-[#e6ebf1] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[7px] bg-[#e7efff] text-[#0057ff] flex items-center justify-center shrink-0">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div className="flex-1 text-xs text-[#425466] leading-[1.4]">
              {responseRates.AIR >= responseRates.SEA && responseRates.AIR >= responseRates.ROAD ? (
                <>
                  <b className="text-[#0a2540]">Aérien</b> est le transport avec le meilleur taux de réponse (
                  <b className="text-[#0a2540]">{responseRates.AIR}%</b>).
                </>
              ) : responseRates.SEA >= responseRates.ROAD ? (
                <>
                  <b className="text-[#0a2540]">Maritime</b> est le transport avec le meilleur taux de réponse (
                  <b className="text-[#0a2540]">{responseRates.SEA}%</b>).
                </>
              ) : (
                <>
                  <b className="text-[#0a2540]">Route</b> est le transport avec le meilleur taux de réponse (
                  <b className="text-[#0a2540]">{responseRates.ROAD}%</b>).
                </>
              )}
            </div>
          </div>
        </SfxCard>
      </div>
    </div>
  );
}
