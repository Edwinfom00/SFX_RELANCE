-- Vue cross-database dans SFX_Relance qui lit BopxFMT
-- Les deux bases sont sur le même serveur SQL Server (localhost:1433)
-- Le nom de la base BrainOpx est injecté dynamiquement via sp_executesql
-- mais ici on le hardcode car c'est toujours BopxFMT sur ce serveur.

CREATE OR ALTER VIEW [dbo].[v_sfx_active_quotations] AS
SELECT
  p.[Num Piece]                        AS quotation_id,
  p.[Libelle Compta]                   AS libelle,
  c.[Code Client]                      AS client_code,
  c.[Emails]                           AS client_email,
  pv.[Date Transmission]               AS transmission_date,
  CASE mo.[Code Module]
    WHEN 'LIN' THEN 'AIR'
    WHEN 'SHI' THEN 'SEA'
    WHEN 'TRA' THEN 'ROAD'
    ELSE            'AIR'
  END                                  AS transport_type

FROM       BopxFMT.dbo.tn_Pieces              p
INNER JOIN BopxFMT.dbo.tn_Types_Pieces        tp  ON p.[Type Piece]              = tp.[Code Type Piece]
INNER JOIN BopxFMT.dbo.tn_Agences             ag  ON p.Agence                    = ag.[Code Agence]
INNER JOIN BopxFMT.dbo.tn_Pieces_Ventes       pv  ON p.[Num Piece]               = pv.[Num Piece Vente]
INNER JOIN BopxFMT.dbo.tn_Clients             c   ON pv.Client                   = c.[Code Client]
LEFT  JOIN BopxFMT.dbo.tn_Sous_Dossiers       sd  ON pv.[Dossier Reference]      = sd.[Code Sous-Dossier]
LEFT  JOIN BopxFMT.dbo.tn_Dossiers            d   ON sd.[Dossier]                = d.[Num Dossier]
LEFT  JOIN BopxFMT.dbo.tn_Types_Dossiers      td  ON d.[Type Dossier]            = td.[Code Type Dossier]
LEFT  JOIN BopxFMT.dbo.tn_Activites           a   ON td.Activite                 = a.[Code Activite]
LEFT  JOIN BopxFMT.dbo.tn_Modules_Operations  mo  ON a.[Module Operation]        = mo.[Code Module]

WHERE
  p.[Statut Piece]          = 'ECR'
  AND tp.[Categorie Piece]  = 'E'
  AND mo.[Code Module]      IN ('LIN', 'SHI', 'TRA')
  AND p.[Agence]            = 'FM1'
  AND pv.[Date Transmission] IS NOT NULL;
