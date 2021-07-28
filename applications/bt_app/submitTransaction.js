const fs = require('fs');
const path = require('path');
const {Wallets, Gateway} = require('fabric-network');
const { ContractImpl } = require('fabric-network/lib/contract');

const testNetworkRoot = path.resolve(require('os').homedir(),'go/src/github.com/hyperledger/fabric-samples/test-network');

async function main(){
    const gateway = new Gateway();
    const wallets = await Wallets.newFileSystemWallet('./wallets');

    try{
        let args = process.argv.slice(2);

        const identityLabel = args[0];
        const orgName = identityLabel.split('@')[1];
        const orgNameWithoutDomain = orgName.split('.')[0];

        let connectionProfile = JSON.parse(fs.readFileSync(
            path.join(testNetworkRoot,'organizations/peerOrganizations',orgName,`/connection-${orgNameWithoutDomain}.json`),
            'utf-8')
        );

        let connectionOptions = {
            identity: identityLabel,
            wallet : wallets,
            discovery:{enabled:true, asLocalhost:true}
        };

        console.log('Connect to Fabric Network');
        await gateway.connect(connectionProfile,connectionOptions);

        console.log('Get Network for Channel');
        const  network = await gateway.getNetwork('mychannel');

        console.log('Extracting chaincode');
        const contract = await network.getContract('balance_transfer');

        const functionName = args[1];
        const chaincodeArgs = args.slice(2);
        
        console.log('Submitting a transaction');
        const response = await contract.submitTransaction(functionName,...chaincodeArgs);
        if(`${response}` != ''){
            console.log(`Response from ${functionName} - ${response}` );
        }
    } catch(error) {
        console.log(`Error adding to Wallet. ${error}`);
        console.log(error.stack);
    } finally{
        gateway.disconnect();
    }
}
main().then(() => {
    console.log('done');
}).catch((e) => {
    console.log(e);
    console.log(e.stack);
    process.exit(-1);
});