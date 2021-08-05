'use strict'

const { Contract } = require('fabric-contract-api');


class Helper {

    async _assetExists(ctx, assetId, assetType, collection = '') {
        const compKey = await ctx.stub.createCompositeKey(assetType,[assetId]);

        let assetBytes;
        if (collection === '') {
            assetBytes = await ctx.stub.getState(compKey);
        } else {
            assetBytes = await ctx.stub.getPrivateData(collection,compKey);
        }

        return assetBytes && assetBytes > 0;
    }

    async _getAsset(ctx, assetId, assetType, collection = '') {
        const compKey = await ctx.stub.createCompositeKey(assetType,[assetId]);

        let assetBytes;
        if (collection === '') {
            assetBytes = await ctx.stub.getState(compKey);
        } else {
            assetBytes = await ctx.stub.getPrivateData(collection,compKey);
        }

        if (!assetBytes || assetBytes.length === 0) {
            throw new Error(`Asset ${assetId} does not exists.`);
        }

        return JSON.parse(assetBytes);
    }

    async _putAsset(ctx, asset, assetType, collection='') {
        const compKey = await ctx.stub.createCompositeKey(assetType,[asset.Id]);

        if (collection === '') {
            await ctx.stub.putState(compKey,Buffer.from(JSON.stringify(asset)));
        } else {
            await ctx.stub.putPrivateData(collection,compKey,Buffer.from(JSON.stringify(asset)));
        }
    }

    async  _getAssetWithStatus(ctx, assetType, assetStatus) {
        const assetIterator = await ctx.stub.getStateByPartialCompositeKey(assetType,[]);

        let result = [];
        for await(const res of assetIterator){
            const jsonObj = JSON.parse(res.value.toString());
            if(assetStatus === jsonObj.status) {
                result.push(jsonObj);
            }
        }
        return result;
    }


}

module.exports = Helper;