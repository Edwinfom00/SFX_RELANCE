# SFX Relance — Guide de déploiement Docker

## Prérequis

- Docker Desktop (Windows) ou Docker Engine (Linux) installé
- SQL Server accessible depuis la machine hôte sur le port 1433
- La vue `v_sfx_active_quotations` créée dans `SFX_Relance` (voir migrations)

---

## 1. Préparer l'environnement

```bash
# Copier le fichier d'exemple
cp .env.docker.example .env.docker

# Éditer avec vos vraies valeurs
notepad .env.docker   # Windows
nano .env.docker      # Linux
```

Variables **obligatoires** à remplir :

| Variable | Description |
|---|---|
| `DB_NAME` | Nom de la base SQL Server (`SFX_Relance`) |
| `DB_USER` | Utilisateur SQL Server |
| `DB_PASSWORD` | Mot de passe SQL Server |
| `ENCRYPTION_KEY` | Clé AES-256 (64 hex chars) — générer une fois, ne jamais changer |
| `AUTH_SECRET` | Secret Next-Auth (32 chars random) |
| `AUTH_URL` | URL publique du web, ex: `http://192.168.1.50:3001` |
| `WORKER_API_TOKEN` | Token Bearer pour l'API worker |
| `SMTP_*` | Configuration email |

---

## 2. Autoriser SQL Server depuis Docker

Sur la machine hôte, SQL Server doit accepter les connexions TCP depuis Docker.

**Windows — SQL Server Configuration Manager :**
1. Ouvrir SQL Server Configuration Manager
2. SQL Server Network Configuration → Protocols for MSSQLSERVER
3. Activer **TCP/IP**
4. Redémarrer le service SQL Server

**Firewall Windows :**
```powershell
New-NetFirewallRule -DisplayName "SQL Server Docker" -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow
```

---

## 3. Démarrer

```bash
# Premier démarrage (build + start)
pnpm docker:up

# Ou directement
docker-compose up -d
```

---

## 4. Commandes utiles

```bash
# Voir les logs en temps réel
pnpm docker:logs

# Logs d'un service spécifique
pnpm docker:logs:web
pnpm docker:logs:server

# Arrêter
pnpm docker:down

# Rebuild complet après modification du code
pnpm docker:rebuild

# Redémarrer un service
docker-compose restart web
docker-compose restart server

# Accéder au shell d'un container
docker exec -it sfx-server sh
docker exec -it sfx-web sh
```

---

## 5. URLs

| Service | URL |
|---|---|
| Application web | http://localhost:3001 |
| API worker | http://localhost:3002/status |

---

## 6. Mise à jour du code

```bash
# Rebuild et redémarrage sans downtime
docker-compose build web && docker-compose up -d web
docker-compose build server && docker-compose up -d server
```

---

## 7. Résolution de problèmes

**"Cannot connect to SQL Server"**
→ Vérifier que SQL Server écoute sur TCP/IP et que le firewall autorise le port 1433
→ Sur Linux, remplacer `host.docker.internal` par l'IP de la machine hôte dans `DATABASE_URL`

**"Worker injoignable" dans l'UI**
→ Vérifier que le container `sfx-server` tourne : `docker ps`
→ `WORKER_API_URL` doit être `http://server:3002` (nom du service Docker, pas localhost)

**Build échoue sur Prisma**
→ S'assurer que `DATABASE_URL` est accessible depuis le container au moment du build
→ Si non, utiliser `prisma generate` sans connexion BD (le schéma suffit)
