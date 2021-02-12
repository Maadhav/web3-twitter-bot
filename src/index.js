const Web3 = require('web3')
const BuildTransactionChecker = require('./main/transaction_listener')
const CreateClient = require('./services/ethClient')
const {web3}  = CreateClient(Web3)
const {checkLastBlock}  = BuildTransactionChecker(web3)
const exitSwitch = require('./services/exit_switch')

exitSwitch()
console.log("[+]Searching for the latest SWAPS...")
setInterval(() => {
    checkLastBlock()
}, 2000)    