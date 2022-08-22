echo "**************** WARNING ****************"
echo "Below Script will initialize current network and remove data"
read -p "PROCEED? (y/n)  " answer
if [ $answer != "y" ]; then
    exit 0
fi

set +x
localDIR=${PWD}
cd ~/fabric-samples/test-network
./network.sh down
./network.sh up createChannel -ca -c mychannel -s couchdb
./network.sh deployCC -ccn simpleasset -ccp $localDIR/simpleasset -ccv 1.0 -ccl go

cd ~/fabric-samples/test-network

source $localDIR/checkChaincodeDeployment.sh

clear
echo "Network Setup Succeed!"
echo "Running Backend Server"
cd $localDIR
rm -rf wallet
npm run dev
