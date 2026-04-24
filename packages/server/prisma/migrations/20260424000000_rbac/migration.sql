-- Ajout colonnes sur users
ALTER TABLE [users]
  ADD [is_active]           BIT           NOT NULL CONSTRAINT [users_is_active_df]            DEFAULT 1,
      [must_change_password] BIT          NOT NULL CONSTRAINT [users_must_change_password_df]  DEFAULT 0,
      [updated_at]          DATETIME2     NOT NULL CONSTRAINT [users_updated_at_df]            DEFAULT GETDATE();

-- Roles
CREATE TABLE [roles] (
  [id]          INT           NOT NULL IDENTITY(1,1),
  [name]        NVARCHAR(50)  NOT NULL,
  [label]       NVARCHAR(100) NOT NULL,
  [description] NVARCHAR(500) NOT NULL CONSTRAINT [roles_description_df] DEFAULT '',
  [created_at]  DATETIME2     NOT NULL CONSTRAINT [roles_created_at_df]  DEFAULT GETDATE(),
  CONSTRAINT [roles_pkey]        PRIMARY KEY ([id]),
  CONSTRAINT [roles_name_unique] UNIQUE      ([name])
);

-- Permissions
CREATE TABLE [permissions] (
  [id]          INT           NOT NULL IDENTITY(1,1),
  [name]        NVARCHAR(100) NOT NULL,
  [label]       NVARCHAR(200) NOT NULL,
  [description] NVARCHAR(500) NOT NULL CONSTRAINT [permissions_description_df] DEFAULT '',
  CONSTRAINT [permissions_pkey]        PRIMARY KEY ([id]),
  CONSTRAINT [permissions_name_unique] UNIQUE      ([name])
);

-- Role ↔ Permission
CREATE TABLE [role_permissions] (
  [role_id]       INT NOT NULL,
  [permission_id] INT NOT NULL,
  CONSTRAINT [role_permissions_pkey] PRIMARY KEY ([role_id], [permission_id]),
  CONSTRAINT [role_permissions_role_fk]       FOREIGN KEY ([role_id])       REFERENCES [roles]([id])       ON DELETE CASCADE,
  CONSTRAINT [role_permissions_permission_fk] FOREIGN KEY ([permission_id]) REFERENCES [permissions]([id]) ON DELETE CASCADE
);

-- User ↔ Role
CREATE TABLE [user_roles] (
  [user_id] INT NOT NULL,
  [role_id] INT NOT NULL,
  CONSTRAINT [user_roles_pkey]    PRIMARY KEY ([user_id], [role_id]),
  CONSTRAINT [user_roles_user_fk] FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE,
  CONSTRAINT [user_roles_role_fk] FOREIGN KEY ([role_id]) REFERENCES [roles]([id]) ON DELETE CASCADE
);

-- ── Seed des rôles et permissions ──────────────────────────────────────────

INSERT INTO [permissions] ([name], [label], [description]) VALUES
  ('users:manage',      'Gérer les utilisateurs',   'Créer, modifier, désactiver des comptes'),
  ('worker:manage',     'Configurer le worker',     'Modifier planification, SMTP, cadences'),
  ('templates:manage',  'Gérer les templates',      'Créer, modifier, supprimer des templates email'),
  ('quotations:cancel', 'Annuler des relances',     'Stopper les relances d''une cotation'),
  ('quotations:send',   'Envoyer manuellement',     'Déclencher une relance immédiate'),
  ('logs:view',         'Voir les logs',            'Accéder à l''historique des envois');

INSERT INTO [roles] ([name], [label], [description]) VALUES
  ('ADMIN',   'Administrateur', 'Accès total à toutes les fonctionnalités'),
  ('MANAGER', 'Manager',        'Gestion des cotations et templates, lecture des logs'),
  ('VIEWER',  'Lecteur',        'Lecture seule — dashboard, cotations, logs');

-- ADMIN → toutes les permissions
INSERT INTO [role_permissions] ([role_id], [permission_id])
SELECT r.id, p.id FROM [roles] r, [permissions] p WHERE r.name = 'ADMIN';

-- MANAGER → templates, cotations, logs
INSERT INTO [role_permissions] ([role_id], [permission_id])
SELECT r.id, p.id FROM [roles] r
JOIN [permissions] p ON p.name IN ('templates:manage','quotations:cancel','quotations:send','logs:view')
WHERE r.name = 'MANAGER';

-- VIEWER → logs uniquement
INSERT INTO [role_permissions] ([role_id], [permission_id])
SELECT r.id, p.id FROM [roles] r
JOIN [permissions] p ON p.name = 'logs:view'
WHERE r.name = 'VIEWER';

-- Assigner ADMIN à l'utilisateur admin@sfx.com
INSERT INTO [user_roles] ([user_id], [role_id])
SELECT u.id, r.id FROM [users] u, [roles] r
WHERE u.email = 'admin@sfx.com' AND r.name = 'ADMIN';
