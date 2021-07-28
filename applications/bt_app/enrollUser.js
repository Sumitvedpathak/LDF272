'use strict';

const fs = require('fs');
const path = require('path');
const FabricCAService = require('fabric-ca-client');
const { Wallets } = require('fabric-network');

const testNetworkRoot = path.resolve(require('os').homedir(),'go/src/github.com/hyperledger/fabric-samples/test-network');

async function main(){
    try{
        let args = process.argv.slice(2);
        console.log(args);
        const identityLabel = args[0];
        const orgName = identityLabel.split('@')[1];

        //Check if new user exists or not
        const wallet = await Wallets.newFileSystemWallet('./wallets');
        console.log('Getting identity of '+ identityLabel);
        let identity = await wallet.get(identityLabel);
        if(identity) {
            console.log(`Identity ${identityLabel} already exists in the wallet`);
            return ;
        }

        const orgNameWithoutDomain = orgName.split('.')[0];
        console.log(`Arguments - ${args}, identityLabel - ${identityLabel}, orgName - ${orgName}, orgNameWithoutDomain - ${orgNameWithoutDomain}`);
        let connectionProfile = JSON.parse(fs.readFileSync(path.join(testNetworkRoot,'organizations/peerOrganizations',orgName,`/connection-${orgNameWithoutDomain}.json`),'utf8'));

        //Access Service
        const ca = new FabricCAService(connectionProfile['certificateAuthorities'][`ca.${orgName}`].url);

        //Enroll a Server Administrator
        const enrollId = args[1];
        const enrollSecret = args[2];
        let enrollAttrs = [];
        if(args.length >3 ){
            enrollAttrs = JSON.parse(args[3]);
        }

        let enrollRequest = {
            enrollmentID:enrollId,
            enrollmentSecret:enrollSecret,
            attr_reqs:enrollAttrs
        };

        const enrollment = await ca.enroll(enrollRequest);

        const orgNameCapitalized = orgNameWithoutDomain.charAt(0).toUpperCase()+orgNameWithoutDomain.slice(1);

        //Add a newly create identity to wallet
        identity = {
            credentials:{
                certificate:enrollment.certificate,
                privateKey:enrollment.key.toBytes()
            },
            mspId:`${orgNameCapitalized}MSP`,
            type:'X.509'
        }

        await wallet.put(identityLabel,identity);


    }catch(error){
        console.error(`Failed to enroll user ${error}`);
        // console.log(error.stack)
        process.exit(1);
    }
}

main().then(() => {
    console.log('User enrollment completed.');
}).catch((e)=>{
    console.log('User enrollment exception - ' + e);
    console.log(e.stack);
    process.exit(1);
})