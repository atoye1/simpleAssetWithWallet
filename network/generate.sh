#!/bin/bash

set -x
# ENV setting, PATH setting, FABRIC_CFG_PATH ...
export FABRIC_CFG_PATH=${PWD}

if [ ! -d config ]; then
    mkdir config
fi

rm -rf ./config/*
rm -rf ./crypto-config

# cryptogen
cryptogen generate --config=./crypto-config.yaml

# configtxgen - geneis.block
configtxgen -profile TwoOrgsOrdererGenesis -channelID system-channel -outputBlock ./config/genesis.block

# configtxgen - channel tx
configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ./config/mychannel.tx -channelID mychannel
