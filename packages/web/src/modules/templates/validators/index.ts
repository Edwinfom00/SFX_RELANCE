import { z } from "zod";

export const templateSchema = z.object({
  name:           z.string().min(1, "Nom requis"),
  transportType:  z.enum(["AIR", "SEA", "ROAD"]),
  reminderNumber: z.number().int().min(1).max(3),
  subject:        z.string().min(1, "Sujet FR requis"),
  subjectEn:      z.string().default(""),
  body:           z.string().min(1, "Corps FR requis"),
  bodyEn:         z.string().default(""),
  isActive:       z.boolean().default(true),
});

export type TemplateInput = z.infer<typeof templateSchema>;
