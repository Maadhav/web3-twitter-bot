const Web3 = require('web3')

const BuildTransactionChecker = require('./transaction_listener')
const CreateClient = require('./ethClient')

const { web3http, web3 } = CreateClient(Web3)
const { checkLastBlock, checkBlocks } = BuildTransactionChecker(web3)


console.log("[+]Searching for the latest SWAPS...")
setInterval(() => {
    checkLastBlock()
}, 2000)    