ALTER TABLE [quotations]
  ADD [client_language] NVARCHAR(10) NOT NULL CONSTRAINT [quotations_client_language_df] DEFAULT 'FR';
