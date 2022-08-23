
#!/bin/bash
export PATH=$PATH:/home/${USER}/fabric-samples/bin;
export FABRIC_CFG_PATH=${PWD}

# set env for org2
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051
