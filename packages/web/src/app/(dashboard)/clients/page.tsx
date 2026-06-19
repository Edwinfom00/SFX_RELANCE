import { ClientsView } from "@/modules/clients/components/clients-view";
import { SyncClientsButton } from "@/modules/clients/components/sync-clients-button";

export const metadata = {
  title: "Clients — SFX Relance",
  description: "Gérez les adresses e-mails de relance de vos clients locaux.",
};

export default function ClientsPage() {
  return (
    <div className="px-7 py-6 pb-10">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] m-0 text-[#0a2540]">Clients</h2>
          <p className="text-[13px] text-[#697386] mt-1">Gérer les adresses e-mails de relance des clients</p>
        </div>
        <SyncClientsButton />
      </div>
      <ClientsView />
    </div>
  );
}
