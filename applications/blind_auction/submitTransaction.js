'use strict';

const fs = require('fs');
const path = require('path');
const {Wallets, Gateway} = require('fabric-ca-client');

const testNetworkRoot = path.resolve(require('os').homedir(),'go/src/github.com/hyperledger/fabric-samples/test-network');

async function main() {
    const gateway = new Gateway();

    const wallet = await Wallets.newFileSystemWallet('./wallets');
}