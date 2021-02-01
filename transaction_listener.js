"use strict";
const axios = require("axios");
const BigNumber = require("bignumber.js");
const abiDecoder = require("abi-decoder");

const erc20TransferEvent = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
];

module.exports = (web3) => {
  abiDecoder.addABI(erc20TransferEvent);
  var previousBlock;
  return {
    async checkLastBlock() {
      let block = await web3.eth.getBlock("latest");
      if (block.number !== previousBlock) {
        previousBlock = block.number;
        console.log("Block: " + block.number);
        if (block && block.transactions) {
          for (let tx of block.transactions) {
          // let tx =
          //   "0xc9535afed7b0d8803558adcee623f5cf18371378d6cb6542570f25f87a809094";
          let transaction = await web3.eth.getTransaction(tx);
          if (
            transaction.to.toLowerCase() ==
            "0x7a250d5630b4cf539739df2c5dacb4c659f2488d"
          ) {
            let rec = await web3.eth.getTransactionReceipt(tx);
            const decodedLogs = abiDecoder.decodeLogs(rec.logs);
            console.log(tx);
            const events = decodedLogs.map((e) => e.events);
            var tokens = [];
            for (const element of decodedLogs) {
              var response = await axios.get(
                "https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=" +
                  element.address +
                  "&page=1&offset=1&apiKey=7M8EQ5E68Q25ZH9BSZH3JMVZ1JN5IM9JP3"
              );
              tokens.push(response.data.result[0]);
              console.log(tokens.map((e)=>e.tokenSymbol))
            }
            for (let i = 0; i < events.length - 1; i++) {
              console.log(
                `Swap ${i + 1}: ${
                  BigNumber(events[i][2].value) /
                  BigNumber("1e" + tokens[i].tokenDecimal)
                } ${tokens[i].tokenSymbol} for ${
                  BigNumber(events[i + 1][2].value) /
                  BigNumber("1e" + tokens[i + 1].tokenDecimal)
                } ${tokens[i + 1].tokenSymbol}`
              );
            }
            // break;
            }
          }
        }
      }
    },
  };
};
