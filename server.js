'use strict';

// Import Modules
const express = require('express');
const path = require('path');
const fs = require('fs');

let serveIndex = require('serve-index');

// Import Fabric Modules
const FabricCaServices = require("fabric-ca-client");
const { Gateway, Wallets } = require("fabric-network");
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('./CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('./AppUtil.js');
const mspOrg1 = 'Org1MSP';
const ccp = buildCCPOrg1();
const caClient = buildCAClient(FabricCaServices, ccp, 'ca.org1.example.com');
const walletPath = path.join(__dirname, 'wallet');

// Fabric settings done


// Get express object
let app = express();

// Set envs
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
const currentId = 'admin';


app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, '/')));
app.use(express.static(__dirname + "/"));
app.use('/static', serveIndex(__dirname + '/'));

// main page routing -done
app.get('/', (req, res) => {
    res.render('index', (err, html) => {
        res.end(html);
    });
});
// admin page routing -done
app.get('/admin', (req, res) => {
    res.render('admin-wallet', (err, html) => {
        res.end(html);
    });
});
// user page routing - done
app.get('/user', (req, res) => {
    res.render('user-wallet', (err, html) => {
        res.end(html);
    });
});

// admin post request - TODO
app.post('/process/admin', async (req, res) => {
    const id = req.body.id;
    const pw = req.body.password;
    console.log(id, pw);
    try {
        const caInfo = ccp.certificateAuthorities["ca.org1.example.com"];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCaServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.canName);

        const walletPath = path.join(process.cwd(), "wallet");
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const identity = await wallet.get(id);
        if (identity) {
            console.log(`An identiy for the admin user ${id} already exists in the wallet`);
            const res_str = `{"result":"failed", "msg":"An identity for the admin user ${id} already exists in the wallet"}`;
            res.json(JSON.parse(res_str));
            return;
        }
        const enrollment = await ca.enroll({ enrollmentID: id, enrollmentSecret: pw });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: "Org1MSP",
            type: "X.509",
        };
        await wallet.put(id, x509Identity);

        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
        const res_str = `{"result":"success", "msg":"Successfully enrolled adminuser ${id} in the wallet"}`;
        res.status(200).json(JSON.parse(res_str));
    } catch (error) {
        console.error(`Failed to enrol admin user ${id}`);
        const res_str = `{"result":"failed","msg":"failed to enrol admin user - ${id} : ${error}"}`;
        res.json(JSON.parse(res_str));
    }
});

app.get('/process/userlist', async (req, res) => {
    const walletPath = path.join(process.cwd(), "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    try {
        const walletData = await wallet.list();
        const walletPrivoder = await wallet.getProviderRegistry();
        console.log(walletPrivoder);
        console.log(walletData);
        const returnData = {
            result: "success",
            ids: walletData,
        };
        res.send(returnData);

    } catch (error) {
        res.send({
            result: "Fail",
            ids: null,
        });
    }
});

app.post('/process/user', async (req, res) => {
    var id = req.body.id;
    var userrole = req.body.userrole;
    console.log(id, userrole);
    try {
        const caInfo = ccp.certificateAuthorities["ca.org1.example.com"];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCaServices(caInfo.url, {
            trustedRoots: caTLSCACerts, verify: false
        }, caInfo.caName);

        const walletPath = path.join(process.cwd(), "wallet");
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user
        const userIdentity = await wallet.get(id);
        if (userIdentity) {
            console.log(`An identity for the user ${id} already exists in the wallet`);
            const res_str = `{"result":"failed","msg":"An identity for the user ${id} already exists in the wallet}`;
            res.json(JSON.parse(res_str));
            return;
        }

        const adminIdentity = await wallet.get("admin");
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            const res_str = `{"result":"failed", "msg":"An identity for the admin user ${id} does not exists in the wallet"}`;
            res.json(JSON.parse(res_str));
            return;
        }

        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, "admin");

        console.log(1);
        const secret = await ca.register({
            affiliation: "org1.department1",
            enrollmentID: id,
            role: userrole,
        },
            adminUser);
        console.log(2);
        const enrollment = await ca.enroll({
            enrollmentID: id,
            enrollmentSecret: secret,
        });
        console.log(3);
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: "Org1MSP",
            type: "X.509",
        };
        await wallet.put(id, x509Identity);
        console.log('Successfully registered and enrolled admin user "appUser" and imported it into the wallet');
        const res_str = `{"result":"Success", "msg":"Successfully enrolled user ${id}} in the wallet"}`;
        res.status(200).json(JSON.parse(res_str));
    } catch (error) {
        console.error(`Failed to enroll admin user ${id}`);
        const res_str = `{"result":"failed", "msg":"failed to register user - ${id} : ${error}"}`;
        res.json(JSON.parse(res_str));
    }
});

// called /process/create inside
app.get('/create', (req, res) => {
    res.render('create_template', (err, html) => {
        res.end(html);
    });
});

app.post('/process/create', async (req, res) => {
    console.log('/process/create called');
    console.log(req);

    const key = req.body.key;
    const value = req.body.value;

    console.log(key, value);
    const gateway = new Gateway();
    let result;
    try {
        const wallet = await buildWallet(Wallets, walletPath);

        await gateway.connect(ccp, {
            wallet,
            identity: currentId,
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("simpleasset");
        result = await contract.submitTransaction('Set', key, value);
        // result 가 byte array라고 생각하고
    } catch (error) {
        result = `{"result":"fail", "message":"create asset Failed"}`;
        var obj = JSON.parse(result);
        console.log("/process/create end -- failed", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }
    console.log(result);
    result = `{"result":"success", "message":"${result}"}`;
    var obj = JSON.parse(result);
    console.log("/process/create end - success");
    res.status(200).send(obj);
});

app.get('/query', (req, res) => {
    res.render('query_template', (err, html) => {
        res.end(html);
    });
});

app.get('/process/query', async (req, res) => {
    console.log('/process/query called');
    const key = req.query.key;
    console.log(key);
    const gateway = new Gateway();
    let result;
    try {
        const wallet = await buildWallet(Wallets, walletPath);

        await gateway.connect(ccp, {
            wallet,
            identity: currentId,
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("simpleasset");
        result = await contract.evaluateTransaction('Get', key);
        // result 가 byte array라고 생각하고

    } catch (error) {
        result = `{"result":"fail", "message":"query asset Failed"}`;
        var obj = JSON.parse(result);
        console.log("/process/create end -- failed", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }
    result = `{"result":"success", "message":${result}}`;
    console.log("/process/query  end -- success", result);
    var obj = JSON.parse(result);
    res.status(200).send(obj);
});

app.get('/transfer', async (req, res) => {
    res.render('transfer_template', (err, html) => {
        res.end(html);
    });
});

app.post('/process/transfer', async (req, res) => {
    const userid = req.body.userid;
    const from = req.body.from;
    const to = req.body.to;
    const amount = req.body.amount;
    console.log('/process/transfer called');
    console.log(from, to, amount);

    const gateway = new Gateway();
    let result;
    try {
        const wallet = await buildWallet(Wallets, walletPath);

        await gateway.connect(ccp, {
            wallet,
            identity: userid,
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("simpleasset");
        result = await contract.submitTransaction('Transfer', from, to, amount);
        // result 가 byte array라고 생각하고
    } catch (error) {
        result = `{"result":"fail", "message":"transfer asset Failed"}`;
        var obj = JSON.parse(result);
        console.log("/process/transfer end -- failed", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }

    //console.log("DEBUG POINT");
    //result = JSON.stringify(result);
    //console.log(result);
    result = `{"result":"success", "message":"${result}"}`;
    console.log("/process/transfer end - success");
    var obj = JSON.parse(result);
    res.status(200).send(obj);
});

app.get('/history', (req, res) => {
    res.render('history_template', (err, html) => {
        res.end(html);
    });
});

app.get('/process/history', async (req, res) => {
    console.log('/process/history called');
    const key = req.query.key;
    console.log(key);
    const gateway = new Gateway();
    let result;
    try {
        const wallet = await buildWallet(Wallets, walletPath);

        await gateway.connect(ccp, {
            wallet,
            identity: currentId,
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("simpleasset");
        result = await contract.evaluateTransaction('History', key);
        // result 가 byte array라고 생각하고

    } catch (error) {
        result = `{"result":"fail", "message":"History asset Failed"}`;
        var obj = JSON.parse(result);
        console.log("/process/history end -- failed", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }
    //console.log("before", result);
    result = String.fromCharCode(...result);
    //console.log('Bytes to string: ', bytesString);
    result = `{"result":"success", "message":${result}}`;
    console.log("after", result);
    console.log("/process/history end -- success", result);
    var obj = JSON.parse(result);
    res.status(200).send(obj);
});
// /query called /process/query inside

app.get('/queryAll', (req, res) => {
    res.render('queryAll_template', (err, html) => {
        res.end(html);
    });
});
app.get('/process/queryAll', async (req, res) => {
    console.log('/process/queryAll called');
    const gateway = new Gateway();
    let result;
    try {
        const wallet = await buildWallet(Wallets, walletPath);

        await gateway.connect(ccp, {
            wallet,
            identity: currentId,
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("simpleasset");
        result = await contract.evaluateTransaction('GetKeyRange', key);
        // result 가 byte array라고 생각하고

    } catch (error) {
        result = `{"result":"fail", "message":"Query All Failed"}`;
        var obj = JSON.parse(result);
        console.log("/process/queryAll end -- failed", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }
    result = `{"result":"success", "message":${result}}`;
    console.log("/asset get end -- success", result);
    var obj = JSON.parse(result);
    res.status(200).send(obj);
});

// Running server on port 3000
app.listen(3000, () => {
    console.log('Express server is running at port 3000');
});