ALTER TABLE [worker_config]
  ADD [timezone] NVARCHAR(100) NOT NULL CONSTRAINT [worker_config_timezone_df] DEFAULT 'Africa/Douala';
