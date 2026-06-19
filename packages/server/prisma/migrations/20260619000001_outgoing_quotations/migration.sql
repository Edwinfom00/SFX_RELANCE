BEGIN TRY
  BEGIN TRANSACTION;

  -- 1. Ajout colonne category sur email_templates (par défaut REMINDER pour l'existant)
  ALTER TABLE [dbo].[email_templates]
    ADD [category] NVARCHAR(1000) NOT NULL CONSTRAINT [email_templates_category_default] DEFAULT N'REMINDER';

  -- 2. Suppression de l'ancien index unique (transport_type, reminder_number)
  DROP INDEX [email_templates_transport_reminder_unique] ON [dbo].[email_templates];

  -- 3. Nouvel index unique incluant category
  CREATE UNIQUE INDEX [email_templates_transport_reminder_category_unique]
    ON [dbo].[email_templates] ([transport_type], [reminder_number], [category]);

  -- 4. Table outgoing_quotations
  CREATE TABLE [dbo].[outgoing_quotations] (
    [id]               INT           NOT NULL IDENTITY(1,1),
    [no_piece]         NVARCHAR(1000) NOT NULL,
    [no_provisoire]    NVARCHAR(1000),
    [client_code]      NVARCHAR(1000) NOT NULL,
    [client_name]      NVARCHAR(1000) NOT NULL CONSTRAINT [oq_client_name_def]      DEFAULT N'',
    [client_email]     NVARCHAR(1000) NOT NULL CONSTRAINT [oq_client_email_def]     DEFAULT N'',
    [client_language]  NVARCHAR(1000) NOT NULL CONSTRAINT [oq_client_language_def]  DEFAULT N'FR',
    [libelle]          NVARCHAR(1000) NOT NULL CONSTRAINT [oq_libelle_def]           DEFAULT N'',
    [transport_type]   NVARCHAR(1000) NOT NULL,
    [type_activite]    NVARCHAR(1000) NOT NULL CONSTRAINT [oq_type_activite_def]    DEFAULT N'',
    [agence_code]      NVARCHAR(1000) NOT NULL CONSTRAINT [oq_agence_code_def]      DEFAULT N'',
    [agence]           NVARCHAR(1000) NOT NULL CONSTRAINT [oq_agence_def]           DEFAULT N'',
    [dossier_ref]      NVARCHAR(1000) NOT NULL CONSTRAINT [oq_dossier_ref_def]      DEFAULT N'',
    [division]         NVARCHAR(1000) NOT NULL CONSTRAINT [oq_division_def]         DEFAULT N'',
    [devise]           NVARCHAR(1000) NOT NULL CONSTRAINT [oq_devise_def]           DEFAULT N'',
    [montant]          FLOAT,
    [date_transaction] DATETIME2,
    [date_expiration]  DATETIME2,
    [responsable]      NVARCHAR(1000) NOT NULL CONSTRAINT [oq_responsable_def]      DEFAULT N'',
    [observations]     NVARCHAR(MAX)  NOT NULL CONSTRAINT [oq_observations_def]     DEFAULT N'',
    [pays_code]        NVARCHAR(1000) NOT NULL CONSTRAINT [oq_pays_code_def]        DEFAULT N'CMR',
    [status]           NVARCHAR(1000) NOT NULL CONSTRAINT [oq_status_def]           DEFAULT N'PENDING',
    [sent_at]          DATETIME2,
    [error_message]    NVARCHAR(MAX),
    [created_at]       DATETIME2      NOT NULL CONSTRAINT [oq_created_at_def]       DEFAULT CURRENT_TIMESTAMP,
    [updated_at]       DATETIME2      NOT NULL,
    CONSTRAINT [outgoing_quotations_pkey] PRIMARY KEY ([id])
  );

  CREATE UNIQUE INDEX [outgoing_quotations_no_piece_key]
    ON [dbo].[outgoing_quotations] ([no_piece]);

  COMMIT;
END TRY
BEGIN CATCH
  ROLLBACK;
  THROW;
END CATCH;
