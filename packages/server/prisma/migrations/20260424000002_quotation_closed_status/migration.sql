-- Aucune modification de schéma nécessaire — le champ status est NVARCHAR
-- CLOSED est simplement une nouvelle valeur possible pour quotations.status
-- Ce fichier documente le changement de logique métier :
--
-- ACTIVE     = cotation en cours de relance
-- PROCESSING = verrou temporaire pendant l'envoi (quelques secondes)
-- COMPLETED  = client a répondu (cotation disparue de BrainOpx)
-- CLOSED     = 3 relances envoyées sans réponse du client
-- CANCELLED  = relances arrêtées manuellement par un opérateur
--
-- Mise à jour des cotations existantes mal classifiées :
-- Les COMPLETED avec currentReminder = 3 sont en réalité des CLOSED
UPDATE [quotations]
SET [status] = 'CLOSED'
WHERE [status] = 'COMPLETED'
  AND [current_reminder] = 3;
