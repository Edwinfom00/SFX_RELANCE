export type OutgoingQuotationStatus = "PENDING" | "SENDING" | "SENT" | "FAILED";

export interface OutgoingQuotation {
  id:              number;
  noPiece:         string;
  noProvisoire:    string | null;
  clientCode:      string;
  clientName:      string;
  clientEmail:     string;
  clientLanguage:  string;
  libelle:         string;
  transportType:   string;
  typeActivite:    string;
  agenceCode:      string;
  agence:          string;
  dossierRef:      string;
  division:        string;
  devise:          string;
  montant:         number | null;
  dateTransaction: Date | string | null;
  dateExpiration:  Date | string | null;
  responsable:     string;
  observations:    string;
  paysCode:        string;
  status:          OutgoingQuotationStatus;
  sentAt:          Date | string | null;
  errorMessage:    string | null;
  createdAt:       Date | string;
  updatedAt:       Date | string;
}

export interface OutgoingQuotationFilters {
  transportType?: string;
  search?:        string;
}
