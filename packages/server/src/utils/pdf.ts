import fs from "fs";
import path from "path";

export interface PdfSearchResult {
  filePath?: string;
  error?: "DIR_NOT_FOUND" | "NO_PDF_FOUND" | "FILE_INACCESSIBLE";
  errorDetails?: string;
}

/**
 * Recherche le PDF associé à une cotation dans le répertoire configuré.
 * 
 * @param quotationId Numéro de cotation (ex: FM1XX250595)
 * @param paysCode Code du pays de la cotation (ex: CMR)
 * @param agenceCode Code de l'agence de la cotation (ex: DLA)
 */
export function findQuotationPdf(
  quotationId: string,
  paysCode: string,
  agenceCode: string
): PdfSearchResult {
  const pdfStorageRoot = process.env.PDF_STORAGE_PATH;
  if (!pdfStorageRoot) {
    return {
      error: "DIR_NOT_FOUND",
      errorDetails: "Le répertoire des PDF de cotation est introuvable (variable PDF_STORAGE_PATH non configurée)."
    };
  }

  // Résoudre le dossier cible : {PDF_STORAGE_PATH}/{paysCode}/{agenceCode}
  const dirPath = path.resolve(pdfStorageRoot, paysCode, agenceCode);
  
  if (!fs.existsSync(dirPath)) {
    return {
      error: "DIR_NOT_FOUND",
      errorDetails: `Le répertoire des PDF de cotation est introuvable (${dirPath}).`
    };
  }

  try {
    const files = fs.readdirSync(dirPath);
    const quotationIdLower = quotationId.toLowerCase();
    
    // Filtrer les fichiers qui commencent par le numéro de cotation et finissent par .pdf (insensible à la casse)
    const matchingFiles = files.filter((file) => {
      const lowerFile = file.toLowerCase();
      return lowerFile.startsWith(quotationIdLower) && lowerFile.endsWith(".pdf");
    });

    if (matchingFiles.length === 0) {
      return {
        error: "NO_PDF_FOUND",
        errorDetails: `Aucun fichier PDF associé à la cotation ${quotationId} n'a été trouvé.`
      };
    }

    let selectedFile = matchingFiles[0];
    
    // Si plusieurs fichiers sont trouvés, sélectionner le plus récent (date de modification la plus récente)
    if (matchingFiles.length > 1) {
      let newestTime = 0;
      for (const file of matchingFiles) {
        const fullPath = path.join(dirPath, file);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.mtimeMs > newestTime) {
            newestTime = stat.mtimeMs;
            selectedFile = file;
          }
        } catch {
          // Ignorer en cas d'erreur de lecture du fichier
        }
      }
    }

    const filePath = path.join(dirPath, selectedFile);

    // Vérifier l'accessibilité en lecture
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch {
      return {
        error: "FILE_INACCESSIBLE",
        errorDetails: "Le PDF de la cotation existe mais ne peut pas être lu."
      };
    }

    return { filePath };
  } catch (err: any) {
    return {
      error: "DIR_NOT_FOUND",
      errorDetails: `Erreur d'accès au répertoire : ${err.message}`
    };
  }
}
