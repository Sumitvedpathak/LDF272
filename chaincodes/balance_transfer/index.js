'use strict'

const balanceContract = require('./lib/balance_transfer');

module.exports.BalanceContract = balanceContract;
module.exports.contracts = [balanceContract];