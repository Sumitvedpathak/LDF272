'use strict'

const { Contract } = require('fabric-contract-api');
const Helper = require('./helper');

const assetObjType = "asset";
const bidObjType = "bid";

const LotStatus = Object.freeze({ Sale:1, Sold:2, Withdraw:3 });
const participents = ['Org1MSP','Org2MSP','Org3MSP'];

class AuctionContract extends Contract {

    async listLotsForSale(ctx){
        // return await new Helper()._getAssetWithStatus(ctx,assetObjType,LotStatus.Sale);
        return this._getAssetWithStatus(ctx,assetObjType,LotStatus.Sale);
    }

    async listLotsForSold(ctx){
        // return await new Helper()._getAssetWithStatus(ctx,assetObjType,LotStatus.Sold);
        return this._getAssetWithStatus(ctx,assetObjType,LotStatus.Sold);
    }

    async listLotsForWithdraw(ctx){
        // return await new Helper()._getAssetWithStatus(ctx,assetObjType,LotStatus.Withdraw);
        return this._getAssetWithStatus(ctx,assetObjType,LotStatus.Withdraw);
    }

    async setOfferForAssetSale(ctx, assetId, assetDesc, minBidStr){
        const minBid = parseFloat(minBidStr);
        if(minBid < 0){
            throw new Error("Minimum bid cannot be less than 0.");
        }

        let asset = {
            id: assetId,
            description: assetDesc,
            seller: ctx.clientIdentity.getMSPID(),
            startingBid: minBid,
            status:LotStatus.Sale
        };

        if(await this._assetExists(ctx,assetId,assetObjType)){
            throw new Error(`Asset ${assetId} already exists. Please try another name.`);
        }

        await this._putAsset(ctx,asset,assetObjType);
    }

    async placeBid(ctx, assetId) {
        const asset = await this._getAsset(ctx, assetId,assetObjType);

        if(asset.status !== LotStatus.Sale) {
            throw new Error(`Asset ${assetId} is not for sale.`);
        }

        if(asset.seller === ctx.clientIdentity.getMSPID()) {
            throw new Error("Not Authorized! Seller cannot buy their own asset.");
        }

        const transient = await ctx.stub.getTransient();
        let price = parseFloat(transient.get('price').toString());
        if(price <= asset.minBid) {
            throw new Error(`Not Accepted! Asset bid price is less than the minimum bidding price.`);
        }

        const bid = {
            assetId : assetId,
            bidder : ctx.clientIdentity.getMSPID(),
            price : price 
        }

        const collection = this._composeCollectionName(asset.seller, bid.bidder);
        if(await this._assetExists(ctx,bid.assetId,bidObjType,collection)) {
            throw new Error(`Bid ${bid.assetId} already exists`);
        }

        await this._putAsset(ctx, bid,bidObjType,collection);
    }

    async closeBid(ctx, assetId){
        const asset = await this._getAsset(ctx,assetId,assetObjType);

        if(asset.status !== LotStatus.Sale) {
            throw new Error('This is not offered for Sale.')
        }

        if(asset.seller != ctx.clientIdentity.getMSPID()) {
            throw new Error('Not Authorized! Only asset owner can close the bids.')
        }
        
        let bids = [];
        for(const org of participents) {
            if(org === asset.seller) {
                continue;
            }
            const collection = this._composeCollectionName(asset.seller, org);
            if (await this._assetExists(ctx, assetId, bidObjType, collection)) {
                bids.push(await this._getAsset(ctx,assetId,bidObjType,collection));
            }
        }

        if (bids.length === 0){
            asset.status = LotStatus.Withdraw;
        } else {
            bids.sort((bid1,bid2) => bid2.price - bid1.price);

            const bestBid = bids[0];
            asset.status = LotStatus.Sold;
            asset.buyer = bestbid.bidder;
            asset.hammerPrice = bestBid.price;
        }

        await this._putAsset(ctx, asset, assetObjType);
    }

    async getBidsForLot(ctx, lot){
        if(ctx.clientIdentity.getMSPID() !== lot.seller) {
            throw new Error ('Not autorized.');
        }

        if (lot.status !== LotStatus.Sale) {
            throw new Error ('Lot is not for Sale');
        }

        let bids = [];

        for(const org of participents) {
            if(org === lot.seller) {
                continue;
            }
            const collection = this._composeCollectionName(lot.seller, org);
            if(await this._assetExists(ctx,lot.id,bidObjType,collection)) {
                bids.push(await this._getAsset(ctx,lot.id,bidObjType,collection));
            }
        }
        return bids;
    }

    async _composeCollectionName(org1, org2){
        return [org1, org2].sort().join('-');
    }

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

    async  _getAssetWithStatus(ctx, assetStatus) {
        const assetIterator = await ctx.stub.getStateByPartialCompositeKey(assetObjType,[]);

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