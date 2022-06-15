# Prometheus Chia Exporter 🌱

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

Can also be built and deployed as a Docker image. Check the example [docker-compose.dev.yaml](/docker-compose.dev.yaml)

#### Set environment vars

```
PORT=9133

FARMER_ENABLED=true
FARMER_HOST=localhost
FARMER_PORT=8559
FARMER_KEY_PATH=/home/dudeofawesome/.chia/mainnet/config/ssl/farmer/private_farmer.key
FARMER_CERT_PATH=/home/dudeofawesome/.chia/mainnet/config/ssl/farmer/private_farmer.crt

FULL_NODE_ENABLED=true
FULL_NODE_HOST=localhost
FULL_NODE_PORT=8555
FULL_NODE_KEY_PATH=/home/dudeofawesome/.chia/mainnet/config/ssl/full_node/private_full_node.key
FULL_NODE_CERT_PATH=/home/dudeofawesome/.chia/mainnet/config/ssl/full_node/private_full_node.crt

HARVESTER_ENABLED=true
HARVESTER_HOST=localhost
HARVESTER_PORT=8560
HARVESTER_KEY_PATH=/home/dudeofawesome/.chia/mainnet/config/ssl/harvester/private_harvester.key
HARVESTER_CERT_PATH=/home/dudeofawesome/.chia/mainnet/config/ssl/harvester/private_harvester.crt

WALLET_ENABLED=true
WALLET_HOST=localhost
WALLET_PORT=9256
WALLET_KEY_PATH=/home/dudeofawesome/.chia/mainnet/config/ssl/wallet/private_wallet.key
WALLET_CERT_PATH=/home/dudeofawesome/.chia/mainnet/config/ssl/wallet/private_wallet.crt

PLOTTER_ENABLED=true
PLOT_LOGS=/var/log/chia
DOCKER_SOCKET=/var/run/docker.sock
PROC_DIR=/host/proc
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```
