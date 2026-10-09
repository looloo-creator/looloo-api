# looloo-api

## Environment and secrets

Keep credentials and signing keys in the untracked `.env` file. To create one from
the tracked template, including new cryptographically strong JWT and refresh-token
secrets, run:

```bash
npm run env:init
```

The command never overwrites an existing `.env`. Fill in the database and OAuth
settings afterward. For deployments, set the same values through the platform's
secret store rather than copying `.env` into an image or committing it.

For a local Kubernetes deployment, see the [Looloo Helm chart guide](../looloo-deploy/helm/looloo/README.md).

The E2E-only `/users/test-token` endpoint is disabled by default and always
returns `404` in production. For local E2E runs, set `ENABLE_TEST_TOKEN=true` in
the API's untracked `.env` file, then restart the API.

# Docker Installation
If Docker Not Installed in Local system Run this Comand else Ignore this
sudo sh ./docker.sh

# Create Network
sudo docker network create one_pay_network

# Build & Run Application
docker compose up --build

# Run Applications
docker compose up -d

# Endpoints
Looloo API: http://localhost:3000/

# Useful Comands 
    Rebuild and Run Application : docker compose build --no-cache && docker compose up -d

## PostgreSQL schema and legacy data

Set the PostgreSQL connection values in `.env`, then run `npm run db:migrate` to
create the tour, member, and account tables. Install the PostgreSQL 18 extension package on the host with `sudo apt-get update && sudo apt-get install -y postgresql-18-pgvector`, then run `DB_HOST=127.0.0.1 npm run db:migrate:rag` to add assistant knowledge search. To transfer
existing Mongo records, export the `tours`, `tour_members`, and `accounts`
collections as JSON files named `tours.json`, `tour_members.json`, and
`accounts.json` in one folder. After confirming users are already in PostgreSQL,
run `npm run db:import-mongo-json -- /path/to/export-folder`. The importer keeps
the old record IDs and relationship references. Do not drop the old data until
the imported row counts and app reports have been checked.
