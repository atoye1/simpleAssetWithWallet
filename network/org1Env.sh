#!/bin/bash
export PATH=$PATH:/home/${USER}/fabric-samples/bin;
export FABRIC_CFG_PATH=${PWD}

#환경설정 org1
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export FABRIC_CFG_PATH=/home/${USER}/fabric-samples/config