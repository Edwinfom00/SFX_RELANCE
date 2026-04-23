export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[110px] bg-white border border-[#e6ebf1] rounded-xl" />
        ))}
      </div>
      {/* Charts row 1 */}
      <div className="grid grid-cols-[1.7fr_1fr] gap-3.5">
        <div className="h-[320px] bg-white border border-[#e6ebf1] rounded-xl" />
        <div className="h-[320px] bg-white border border-[#e6ebf1] rounded-xl" />
      </div>
      {/* Charts row 2 */}
      <div className="grid grid-cols-[1.7fr_1fr] gap-3.5">
        <div className="h-[220px] bg-white border border-[#e6ebf1] rounded-xl" />
        <div className="h-[220px] bg-white border border-[#e6ebf1] rounded-xl" />
      </div>
      {/* Activity row */}
      <div className="grid grid-cols-[1.3fr_1fr] gap-3.5">
        <div className="h-[320px] bg-white border border-[#e6ebf1] rounded-xl" />
        <div className="h-[320px] bg-white border border-[#e6ebf1] rounded-xl" />
      </div>
    </div>
  );
}
