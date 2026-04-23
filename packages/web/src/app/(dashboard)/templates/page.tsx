import { Suspense } from "react";
import { TemplatesView } from "@/modules/templates/components/templates-view";

export default function TemplatesPage() {
  return (
    <Suspense>
      <TemplatesView />
    </Suspense>
  );
}
