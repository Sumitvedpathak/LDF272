'use strict';

const fs = require('fs');
const path = require('path');
const FabricCAService = require('fabric-ca-client');
const { Wallets } = require('fabric-network');

const testNetworkRoot = path.resolve(require('os').homedir(),'go/src/github.com/hyperledger/fabric-samples/test-network');

async function main(){
    try{
        let args = process.argv.slice(2);
        const identityLabel = args[0];
        const orgName = identityLabel.split('@')[1];
        const orgNameWithoutDomain = orgName.split('.')[0];
        console.log(`Arguments - ${args}, identityLabel - ${identityLabel}, orgName - ${orgName}, orgNameWithoutDomain - ${orgNameWithoutDomain}`);

        let connectionProfile = JSON.parse(fs.readFileSync(path.join(testNetworkRoot,'organizations/peerOrganizations',orgName,`/connection-${orgNameWithoutDomain}.json`),'utf8'));

        //Access Service
        const ca = new FabricCAService(connectionProfile['certificateAuthorities'][`ca.${orgName}`].url);

        //Enroll a Server Administrator
        const wallet = await Wallets.newFileSystemWallet('./wallets');
        console.log('Getting identity of '+ identityLabel);
        let identity = await wallet.get(identityLabel);
        if(identity) {
            console.log(`Identity ${identityLabel} already exists in the wallet`);
            return ;
        }

        const enrollId = args[1];
        const enrollSecret = args[2];
        console.log(`enrollId - ${enrollId}, enrollSecret - ${enrollSecret}`);

        let enrollRequest = {
            enrollmentId:enrollId,
            enrollmentSecret:enrollSecret
        };
        console.log(`enrollRequest - ${JSON.stringify(enrollRequest)}`);
        const enrollment = await ca.enroll(enrollRequest);

        console.log('orgNameWithoutDomain = '+orgNameWithoutDomain);
        const orgNameCapitalized = orgNameWithoutDomain.charAt(0).toUpperCase()+orgNameWithoutDomain.slice(1);
        console.log('orgNameCapitalized = '+orgNameCapitalized);

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