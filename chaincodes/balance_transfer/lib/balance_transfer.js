'use strict'

const {Contract} = require('fabric-contract-api')

const accountObjType = "Account";

class BalanceContract extends Contract{

    async _getCompositeKey(ctx, id){
        const compKey = ctx.stub.createCompositeKey(accountObjType,[id]);
        const accountBytes = await ctx.stub.getState(compKey);
        return accountBytes;
    }

    async _accountExists(ctx, id){
        const accountBytes = await this._getCompositeKey(ctx,id);
        return accountBytes && accountBytes.length > 0;
    }

    async _getAccount(ctx, id){
        const accountBytes = await this._getCompositeKey(ctx,id);
        if(!accountBytes || accountBytes.length === 0){
            throw new Error(`Account ${id} does not exists.`);
        }
        return JSON.parse(accountBytes.toString());
    }

    async _putAccount(ctx, account){
        const compKey = ctx.stub.createCompositeKey(accountObjType,[account.id]);
        console.log(compKey);
        const buf = Buffer.from(JSON.stringify(account));
        console.log(buf);
        await ctx.stub.putState(compKey, buf);
    }

    async _getTxCreatorUID(ctx){
        console.log("Inside _getTxCreatorUID");
        const obj = JSON.stringify({
            mspid: ctx.clientIdentity.getMSPID(),
            id: ctx.clientIdentity.getID()
        });
        return obj;
    }

    async initAccount(ctx, id, balance){
        const actBal = parseFloat(balance);
        if(actBal < 0){
            throw new Error(`Account shall not have -ve balance`);
        }
        if(await this._accountExists(ctx,id)){
            throw new Error(`Account ${id} already exists.`);
        }
        console.log(ctx.clientIdentity)
        if (!ctx.clientIdentity.assertAttributeValue('init','true')){
            throw new Error(`Account initiate is not enabled for this user.`);
        }
        const account = {
            id:id,
            // owner:"test",
            owner: await this._getTxCreatorUID(ctx),
            balance:balance
        };
        await this._putAccount(ctx, account);
        return JSON.stringify(account);
    }

    async setBalance(ctx, id, newBalance){
        const newBal = parseFloat(newBalance);
        if(newBal < 0){
            throw new Error(`Account shall not have -ve balance`);
        }
        const account = await this._getAccount(ctx, id);
        if(await this._getTxCreatorUID(ctx) !== account.owner){
            throw new Error(`Unauthorized access to ${id} account.`)
        }
        account.balance = newBal;
        await this._putAccount(ctx, account);
    }

    async transfer(ctx, fromId, toId, balance){
        const bal = parseFloat(balance);
        if(bal < 0){
            throw new Error(`Account shall not have -ve balance`);
        }
        const fromAct = await this._getAccount(ctx, fromId);
        if(await this._getTxCreatorUID(ctx) !== fromAct.owner){
            throw new Error(`Unauthorized access to ${id} account.`)
        }
        if(fromAct.balance < bal){
            throw new Error(`Insufficiant funds in account.`);
        }

        fromAct.balance -= bal; 
        const toAct = await this._getAccount(ctx, toId);
        toAct.balance += bal;
        await this._putAccount(ctx, fromAct);
        await this._putAccount(ctx, toAct);
        console.log('Transaction completed Successfully!');
    }

    async listAccounts(ctx){
        const owner = await this._getTxCreatorUID(ctx);

        const acctsIterator = ctx.stub.getStateByPartialCompositeKey(accountObjType,[]);

        let results = [];
        for await (const res of acctsIterator){
            const act = JSON.parse(res.value.toString());
            if(act.owner === owner){
                results.push(act);
            }
        }
        return JSON.stringify(results);
    }
}

module.exports = BalanceContract;