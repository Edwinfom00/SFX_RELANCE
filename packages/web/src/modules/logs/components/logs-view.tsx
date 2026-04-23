import { getLogs } from "../models";
import { LogsTable } from "./logs-table";
import { LogsFilters } from "./logs-filters";
import type { LogFilters } from "../types";

interface LogsViewProps {
  searchParams?: { status?: string };
}

export async function LogsView({ searchParams = {} }: LogsViewProps) {
  const filters: LogFilters = {
    ...(searchParams.status && { status: searchParams.status as any }),
  };
  const logs = await getLogs(filters);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <LogsFilters />
        <span className="text-[12.5px] text-[#697386]">
          <b className="text-[#0a2540]">{logs.length}</b> entrée{logs.length > 1 ? "s" : ""}
          {logs.length === 200 && " (limité à 200)"}
        </span>
      </div>
      <LogsTable logs={logs as any} />
    </div>
  );
}
