import { getTemplatesWithStats } from "../models";
import { TemplatesSplit } from "./templates-split";

export async function TemplatesView() {
  const templates = await getTemplatesWithStats();
  return <TemplatesSplit templates={templates as any} />;
}
