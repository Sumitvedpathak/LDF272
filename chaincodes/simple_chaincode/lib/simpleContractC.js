'use strict';

const { Contract } = require('fabric-contract-api');

class SimpleContractC extends Contract {

    _createCompositeKey(ctx, objType, key){
        if(!key || key === ""){
            throw new Error("Should be non-empty key");
        }
        if(objType === ""){
            return key;
        }
        return ctx.stub.createCompositeKey(objType,[key]);
    }

    async put(ctx, objType, key, value) {
        const compKey = this._createCompositeKey(ctx,objType,key);
        await ctx.stub.putState(compKey, Buffer.from(value));
    }

    async getByType(ctx, objType){
        const iteratorPromise = ctx.stub.getStateByPartialCompositeKey(objType,[]);

        let results = [];

        for await(const res of iteratorPromise){
            const splitKey = ctx.stub.splitCompositeKey(res.key);
            results.push({
                objType:splitKey.objType,
                key:splitKey.attributes[0],
                value:res.value.toString()
            })
        }
        return JSON.stringify(results);
    }

    async get(ctx,objType, key) {
        const compKey = this._createCompositeKey(ctx,objType,key);
        const value = await ctx.stub.getState(compKey);
        if (!value || value.length === 0) {
            throw new Error(`The asset ${key} does not exists`);
        }
        return value.toString();
    }

    async getHistory(ctx, objType, key){
        const compKey = this._createCompositeKey(ctx,objType,key);
        const historyItertr = ctx.stub.getHistoryForKey(compKey);
        let history = [];
        for await (const res of historyItertr){
            history.push({
                txId: res.txId,
                value: res.value.toString(),
                isDelete:res.isDelete
            });
        }
        return JSON.stringify({
            objType: objType,
            key:key,
            values:history
        });
    }

    async del(ctx, objType, key) {
        const compKey = this._createCompositeKey(ctx,objType,key);
        await ctx.stub.deleteState(compKey);
    }

    async getByRange(ctx, frm, to){
        const iteratorPromise = ctx.stub.getStateByRange(key,to);

        let results=[];
        for await (const res of iteratorPromise){
            results.push({
                key:res.key,
                value:res.value.toString()
            });
        }
        return JSON.stringify(results);
    }

    async emitEvent(ctx,name, payload) {
        ctx.stub.setEvent(name, Buffer.from(payload));
    }

    // One way of getting range.  
/*     async getByRange(ctx, frm, to) {
        const iterator = await ctx.stub.getStateByRange(frm, to);
        let results = [];
        let result = await iterator.next();
        while (!result.done) {
            results.push({
                key: result.value.key,
                value: result.value.value.toString()
            });
            result = await iterator.next();
        }
        await iterator.close()

        return JSON.stringify(results);
    }
*/


}

module.exports = SimpleContractC;