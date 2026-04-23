ALTER TABLE [email_templates]
  ADD [subject_en] NVARCHAR(1000) NOT NULL CONSTRAINT [email_templates_subject_en_df] DEFAULT '',
      [body_en]    NVARCHAR(MAX)  NOT NULL CONSTRAINT [email_templates_body_en_df]    DEFAULT '';
