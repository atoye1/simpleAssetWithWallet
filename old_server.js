

// 2. Fabric Connetion setting
const { Gateway, Wallets } = require('fabric-network');
const FabricCaServices = require('fabric-ca-client');

const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('./CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('./AppUtil.js');
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');

const ccp = buildCCPOrg1();
const caClient = buildCAClient(FabricCaServices, ccp, 'ca.org1.example.com');
// 3. Middlewares setting
var app = express();
app.use('/public', express.static(path.join(__dirname, 'public')));

// 4. /asset POST routing
app.post('/asset', async (req, res) => {
    var key = req.body.key;
    var value = req.body.value;

    console.log("/asset post start --", key, value);
    const gateway = new Gateway();

    try {
        const wallet = await buildWallet(Wallets, walletPath);

        await gateway.connect(ccp, {
            wallet,
            identity: "appUser",
            discovery: { enabled: true, asLocalhost: true }
        });
        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("simpleasset");
        await contract.submitTransaction('Set', key, value);
    } catch (error) {
        var result = `{"result":"fail", "message":"tx has NOT submitted"}`;
        var obj = JSON.parse(result);
        console.log("/asset end -- failed ", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }

    var result = `{"result":"success", "message":"tx has submitted"}`;
    var obj = JSON.parse(result);
    console.log("/asset end - success");
    res.status(200).send(obj);
});

// 5. /asset GET routing
app.get('/asset', async (req, res) => {
    var key = req.query.key;
    console.log("/asset get start --", key);

    const gateway = new Gateway();

    try {
        const wallet = await buildWallet(Wallets, walletPath);

        await gateway.connect(ccp, {
            wallet,
            identity: "appUser",
            discoery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("simpleasset");
        var result = await contract.evaluateTransaction("Get", key);
        var result = `{"result":"success", "message":${result}}`;
        console.log("/asset get end -- success", result);
        var obj = JSON.parse(result);
        res.status(200).send(obj);
    } catch (error) {
        var result = `{"result":"fail", "message":"Get has a error"}`;
        var obj = JSON.parse(result);
        console.log("/asset getend -- failed", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }
});

app.get('/history', async (req, res) => {
    var key = req.query.key;
    console.log("/asset get start --", key);

    const gateway = new Gateway();

    try {
        const wallet = await buildWallet(Wallets, walletPath);

        await gateway.connect(ccp, {
            wallet,
            identity: "appUser",
            discoery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("simpleasset");
        var result = await contract.evaluateTransaction("History", key);
        var result = `{"result":"success", "message":${result}}`;
        console.log("/asset get end -- success", result);
        var obj = JSON.parse(result);
        res.status(200).send(obj);
    } catch (error) {
        var result = `{"result":"fail", "message":"Get has a error"}`;
        var obj = JSON.parse(result);
        console.log("/asset getend -- failed", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }
});

app.get('/allAssets', async (req, res) => {
    console.log("/assetAssets get start --");

    const gateway = new Gateway();

    try {
        const wallet = await buildWallet(Wallets, walletPath);

        await gateway.connect(ccp, {
            wallet,
            identity: "appUser",
            discoery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("simpleasset");
        var result = await contract.evaluateTransaction("GetKeyRange");
        var result = `{"result":"success", "message":${result}}`;
        console.log("/asset get end -- success", result);
        var obj = JSON.parse(result);
        res.status(200).send(obj);
    } catch (error) {
        var result = `{"result":"fail", "message":"Get has a error"}`;
        var obj = JSON.parse(result);
        console.log("/allAssets get end -- failed", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }
});
// 6 Server listen

app.listen(3000, () => {
    console.log('Express server is running at port 3000');
});