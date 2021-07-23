const fs = require('fs');
const path = require('path');
const {Wallets, Gateway} = require('fabric-network');

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
            wallet : wallet,
            discovery:{enabled:true, asLocalhost:true}
        };

        await gateway.connect(connectionProfile,connectionOptions);
    } catch(error) {
        console.log(`Error adding to Wallet. ${error}`);
        console.log(error.stack);
    }
}