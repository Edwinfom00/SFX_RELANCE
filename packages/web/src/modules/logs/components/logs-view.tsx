import { getLogs } from "../models";
import { LogsTable } from "./logs-table";
import { LogsFilters } from "./logs-filters";
import { LogsPagination } from "./logs-pagination";
import type { LogFilters } from "../types";

interface LogsViewProps {
  searchParams?: { status?: string; page?: string };
}

export async function LogsView({ searchParams = {} }: LogsViewProps) {
  const filters: LogFilters = {
    ...(searchParams.status && { status: searchParams.status as any }),
  };
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const { logs, total, pageCount, pageSize } = await getLogs(filters, page);

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <LogsFilters />
        <span className="text-[12.5px] text-[#697386]">
          {total > 0 ? (
            <>
              <b className="text-[#0a2540]">{from}–{to}</b> sur{" "}
              <b className="text-[#0a2540]">{total}</b> entrée{total > 1 ? "s" : ""}
            </>
          ) : (
            "Aucune entrée"
          )}
        </span>
      </div>

      <LogsTable logs={logs as any} />

      {pageCount > 1 && (
        <LogsPagination
          page={page}
          pageCount={pageCount}
          status={searchParams.status}
        />
      )}
    </div>
  );
}
