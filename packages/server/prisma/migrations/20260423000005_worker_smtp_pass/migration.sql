ALTER TABLE [worker_config]
  ADD [smtp_pass] NVARCHAR(1000) NOT NULL CONSTRAINT [worker_config_smtp_pass_df] DEFAULT '';
