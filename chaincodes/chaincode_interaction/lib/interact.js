'use strict'

const {Contract} = require('fabric-contract-api')

class InteractContract extends Contract{

    async interact(ctx, channel, chaincode, argsStr){
        const args = JSON.parse(argsStr);
        const ccresponse = ctx.stub.invokeChaincode(chaincode, args, channel);
        if(ccresponse.status >= 400){
            throw new Error(`Chaincode ${chaincode} from channel ${channel} returned ${ccresponse.status} status code: ${ccresponse.message}`);
        }
        return ccresponse.payload;
    }

}

module.exports = InteractContract;