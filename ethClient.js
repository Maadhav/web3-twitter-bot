'use strict';

module.exports = Web3 => ({
    web3http: new Web3(new Web3.providers.HttpProvider('https://cloudflare-eth.com')),
    web3: new Web3(new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/ws/v3/e3d0b1f3c3de42e2b58356cd04efd44c'))
})  