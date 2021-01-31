const Web3 = require('web3')

const BuildTransactionChecker = require('./transaction_listener')
const BuildTransactionChecker2 = require('./transaction_subscription')
const CreateClient = require('./ethClient')

const { web3http, web3 } = CreateClient(Web3)
const { checkLastBlock, checkBlocks } = BuildTransactionChecker(web3)
const watchTransactions = BuildTransactionChecker2({ web3, web3http })


// watchTransactions()
console.log("[+]Searching for latest UNISWAP transactions...")
// setInterval(() => {
    checkLastBlock()
// }, 2000)    