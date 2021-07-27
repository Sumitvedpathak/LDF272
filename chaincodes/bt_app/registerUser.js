'use strict';

const fs = require('fs');
const path = require('path');
const FabricCAService = require('fabric-ca-client');
const {Wallets, Gateway} = require('fabric-network');

const testNetworkRoot = path.resolve(require('os').homedir(),'go/src/github.com/hyperledger/fabric-samples/test-network');

async function main() {
    try{
        const wallet = await Wallets.newFileSystemWallet('./wallets');
        let args = process.argv.slice(2);
        const registrarLabel = args[0];
        console.log(args);
        let registrarIdentity = await wallet.get(registrarLabel);
        if(!registrarIdentity){
            console.log(`Registrar user ${registrarIdentity} does not exists`);
            console.log('Execute Enroll User first');
            return;
        }

        const orgName = registrarLabel.split('@')[1];
        const orgNameWithoutDomain = orgName.split('.')[0];

        let connectionProfile = JSON.parse(fs.readFileSync(path.join(testNetworkRoot,'organizations/peerOrganizations',orgName,`/connection-${orgNameWithoutDomain}.json`),'utf8'));
        const ca = new FabricCAService(connectionProfile['certificateAuthorities'][`ca.${orgName}`].url);

        //To obtain registrar identity
        const provider = wallet.getProviderRegistry().getProvider(registrarIdentity.type);
        const registrarUser = await provider.getUserContext(registrarIdentity,registrarLabel);

        const enrollmentID = args[1];
        let optional = {};
        if(args.length > 2) {
            optional = JSON.parse(args[2]);
        }

        let registerRequest = {
            enrollmentID: enrollmentID,
            enrollmentSecret: optional.secret || "",
            role:'client'
        };

        const secret = await ca.register(registerRequest,registrarUser);
        console.log(`Successfully registered the user with ${enrollmentID} enrollment ID and ${secret} enrollment secret.`)



    }catch(error){
        console.error(`Failed to enroll user ${error}`);
        // console.log(error.stack)
        process.exit(1);
    }
}

main().then(()=>{
    console.log('Registered User Complete');
}).catch((e)=>{
    onsole.log('User enrollment exception - ' + e);
    console.log(e.stack);
    process.exit(1);
});

