-- Intervalles indépendants pour chaque worker de relance (en minutes)
ALTER TABLE [worker_config]
  ADD [interval_r1] INT NOT NULL CONSTRAINT [worker_config_interval_r1_df] DEFAULT 30,
      [interval_r2] INT NOT NULL CONSTRAINT [worker_config_interval_r2_df] DEFAULT 30,
      [interval_r3] INT NOT NULL CONSTRAINT [worker_config_interval_r3_df] DEFAULT 60;
