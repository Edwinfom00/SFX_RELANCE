ALTER TABLE [quotations]
  ADD [libelle] NVARCHAR(1000) NOT NULL CONSTRAINT [quotations_libelle_df] DEFAULT '';
