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
sudo docker compose up --build -d

# Run Applications
sudo docker compose up -d

# Endpoints
Adminer: http://localhost:8081/
Mongo Express: http://localhost:8082/
Looloo API: http://localhost:3000/

# Adminer Login credentials 
    server: mysql, 
    username: root, 
    password: 12345
    
# Useful Comands 
    pm2 reload: sudo docker exec looloo-api pm2 reload all --update-env
    Rebuild and Run Application : sudo docker compose build --no-cache && sudo docker compose up -d
