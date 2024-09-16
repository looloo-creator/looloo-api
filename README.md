# one-pay-api

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
OnePayApi: http://localhost:3000/

# Adminer Login credentials 
    server: mysql, 
    username: root, 
    password: 12345
    
# Useful Comands 
    pm2 reload: sudo docker exec one-pay-api pm2 reload all --update-env
    Rebuild and Run Application : sudo docker compose build --no-cache && sudo docker compose up -d
