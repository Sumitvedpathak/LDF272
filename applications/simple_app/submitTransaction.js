const fs = require('fs');
const path = require('path');
const util = require('util');
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

        console.log('Add block listeren');
        const blockListener = await network.addBlockListener(
            async (blockEnvent) => {
                console.log();
                console.log('-----------Block Listener----------------');
                console.log(`Block header: ${util.inspect(blockEnvent.blockData.header,{showHidden: false, depth: 5})}`);
                console.log('###############################################');
                console.log(`Blcok data: ${util.inspect(blockEnvent.blockData.data,{showHidden:false,depth:5})}`);
                console.log('###############################################');
                console.log(`Block Metadata: ${util.inspect(blockEnvent.blockData.metadata,{showHidden:false,depth:5})}`);
                console.log('###############################################');
                console.log();
            }
        );

        console.log('Extracting chaincode');
        const contract = await network.getContract('simple_chaincode');

        console.log('Add contract listener');
        const contractListener = await contract.addContractListener(
            async (contractEvent) => {
                console.log();
                console.log('-----------Contract Listener----------------');
                console.log(`Event name: ${contractEvent.eventName}, payload: ${contractEvent.payload.toString()}`);
                console.log('---------------------------------------------');
                console.log();
            }
        );

        const functionName = args[1];
        const chaincodeArgs = args.slice(2);
        
        console.log('Add commit Listener');
        let tx = contract.createTransaction(functionName);
        const commitListener = await network.addCommitListener(
            (error, commitEvent) => {
                console.log();
                console.log('------------------Commit Listener--------------------');
                if(error){
                    console.error(error);
                    return;
                }

                console.log(`Transaction ${commitEvent.transactionId} status: ${commitEvent.status}`);
                console.log('--------------------------------------------------------');
                console.log();
            },
            network.getChannel().getEndorsers(),
            tx.getTransactionId()
        );

        console.log(`Submit ${functionName} transaction`);
        const response = await tx.submit(...chaincodeArgs);

        //Replace submitTransaction with CreateTransaction and Submit
        // console.log('Submitting a transaction');
        // const response = await contract.submitTransaction(functionName,...chaincodeArgs);
        
        setTimeout(()=>{
            if(`${response}` != ''){
                console.log(`Response from ${functionName} - ${response}` );
            }
        },20000);
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