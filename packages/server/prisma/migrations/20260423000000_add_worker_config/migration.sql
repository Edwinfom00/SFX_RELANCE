CREATE TABLE [worker_config] (
    [id] INT NOT NULL IDENTITY(1,1),
    [interval_minutes] INT NOT NULL CONSTRAINT [worker_config_interval_minutes_df] DEFAULT 30,
    [send_window_start] INT NOT NULL CONSTRAINT [worker_config_send_window_start_df] DEFAULT 8,
    [send_window_end] INT NOT NULL CONSTRAINT [worker_config_send_window_end_df] DEFAULT 19,
    [active_days] NVARCHAR(1000) NOT NULL CONSTRAINT [worker_config_active_days_df] DEFAULT '[1,2,3,4,5]',
    [send_delay_seconds] INT NOT NULL CONSTRAINT [worker_config_send_delay_seconds_df] DEFAULT 30,
    [cadence_air] NVARCHAR(MAX) NOT NULL CONSTRAINT [worker_config_cadence_air_df] DEFAULT '[{"reminderNumber":1,"delayHours":24},{"reminderNumber":2,"delayHours":48},{"reminderNumber":3,"delayHours":72}]',
    [cadence_sea] NVARCHAR(MAX) NOT NULL CONSTRAINT [worker_config_cadence_sea_df] DEFAULT '[{"reminderNumber":1,"delayHours":48},{"reminderNumber":2,"delayHours":96},{"reminderNumber":3,"delayHours":168}]',
    [cadence_road] NVARCHAR(MAX) NOT NULL CONSTRAINT [worker_config_cadence_road_df] DEFAULT '[{"reminderNumber":1,"delayHours":48},{"reminderNumber":2,"delayHours":96},{"reminderNumber":3,"delayHours":168}]',
    [smtp_host] NVARCHAR(1000) NOT NULL CONSTRAINT [worker_config_smtp_host_df] DEFAULT '',
    [smtp_port] INT NOT NULL CONSTRAINT [worker_config_smtp_port_df] DEFAULT 587,
    [smtp_secure] BIT NOT NULL CONSTRAINT [worker_config_smtp_secure_df] DEFAULT 0,
    [smtp_user] NVARCHAR(1000) NOT NULL CONSTRAINT [worker_config_smtp_user_df] DEFAULT '',
    [smtp_from] NVARCHAR(1000) NOT NULL CONSTRAINT [worker_config_smtp_from_df] DEFAULT '',
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [worker_config_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- Seed: une seule ligne de config par défaut
INSERT INTO [worker_config] (
    [interval_minutes],[send_window_start],[send_window_end],[active_days],
    [send_delay_seconds],[cadence_air],[cadence_sea],[cadence_road],
    [smtp_host],[smtp_port],[smtp_secure],[smtp_user],[smtp_from],[updated_at]
) VALUES (
    30, 8, 19, '[1,2,3,4,5]', 30,
    '[{"reminderNumber":1,"delayHours":24},{"reminderNumber":2,"delayHours":48},{"reminderNumber":3,"delayHours":72}]',
    '[{"reminderNumber":1,"delayHours":48},{"reminderNumber":2,"delayHours":96},{"reminderNumber":3,"delayHours":168}]',
    '[{"reminderNumber":1,"delayHours":48},{"reminderNumber":2,"delayHours":96},{"reminderNumber":3,"delayHours":168}]',
    '', 587, 0, '', '', GETDATE()
);
