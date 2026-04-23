BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(1000) NOT NULL,
    [password_hash] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [users_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[quotations] (
    [id] INT NOT NULL IDENTITY(1,1),
    [quotation_id] NVARCHAR(1000) NOT NULL,
    [client_code] NVARCHAR(1000) NOT NULL,
    [client_email] NVARCHAR(1000) NOT NULL,
    [transmission_date] DATETIME2 NOT NULL,
    [transport_type] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [quotations_status_df] DEFAULT 'ACTIVE',
    [current_reminder] INT NOT NULL CONSTRAINT [quotations_current_reminder_df] DEFAULT 0,
    [next_reminder_at] DATETIME2,
    [cancelled_by] INT,
    [cancelled_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [quotations_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [quotations_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [quotations_quotation_id_key] UNIQUE NONCLUSTERED ([quotation_id])
);

-- CreateTable
CREATE TABLE [dbo].[email_logs] (
    [id] INT NOT NULL IDENTITY(1,1),
    [quotation_id] INT NOT NULL,
    [reminder_number] INT NOT NULL,
    [sent_at] DATETIME2,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [email_logs_status_df] DEFAULT 'PENDING',
    [retry_count] INT NOT NULL CONSTRAINT [email_logs_retry_count_df] DEFAULT 0,
    [template_id] INT NOT NULL,
    [recipient_email] NVARCHAR(1000) NOT NULL,
    [error_message] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [email_logs_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [email_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[email_templates] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [transport_type] NVARCHAR(1000) NOT NULL,
    [reminder_number] INT NOT NULL,
    [subject] NVARCHAR(1000) NOT NULL,
    [body] TEXT NOT NULL,
    [is_active] BIT NOT NULL CONSTRAINT [email_templates_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [email_templates_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [email_templates_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [email_templates_transport_type_reminder_number_key] UNIQUE NONCLUSTERED ([transport_type],[reminder_number])
);

-- AddForeignKey
ALTER TABLE [dbo].[quotations] ADD CONSTRAINT [quotations_cancelled_by_fkey] FOREIGN KEY ([cancelled_by]) REFERENCES [dbo].[users]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[email_logs] ADD CONSTRAINT [email_logs_quotation_id_fkey] FOREIGN KEY ([quotation_id]) REFERENCES [dbo].[quotations]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[email_logs] ADD CONSTRAINT [email_logs_template_id_fkey] FOREIGN KEY ([template_id]) REFERENCES [dbo].[email_templates]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
