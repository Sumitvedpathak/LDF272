'use strict'

const blindAuction = require('./lib/blind_auction');

module.exports.AuctionContract = blindAuction;
module.exports.contracts = [blindAuction];