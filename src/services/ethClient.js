'use strict';

module.exports = Web3 => ({
    web3: new Web3(new Web3.providers.WebsocketProvider('wss://main-light.eth.linkpool.io/ws'))
})  