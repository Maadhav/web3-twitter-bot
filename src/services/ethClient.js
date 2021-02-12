'use strict';

module.exports = Web3 => ({
    web3: new Web3(new Web3.providers.HttpProvider('https://cloudflare-eth.com')),
})  