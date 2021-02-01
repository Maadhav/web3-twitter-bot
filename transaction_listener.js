"use strict";
const axios = require("axios");
const BigNumber = require("bignumber.js");
const abiDecoder = require("abi-decoder");

async function getQuote(fromTokenAddress, toTokenAddress, amount) {
  var uri = `https://api.1inch.exchange/v2.0/quote?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}`;
  console.log();
  console.log(`1Inch Quote:  ${uri}`);
  console.log();
  var response = await axios.get(uri);
  return response.data;
}
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
          // for (let tx of block.transactions) {
          let tx =
            "0x59cec837bd0bf3e909be4e157270902d6508eed5caef9bdb0e4fa895e9492b04";
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
            var tokenAddresses = [];
            for (const element of decodedLogs) {
              var response = await axios.get(
                "https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=" +
                  element.address +
                  "&page=1&offset=1&apiKey=7M8EQ5E68Q25ZH9BSZH3JMVZ1JN5IM9JP3"
              );
              tokenAddresses.push(element.address);
              tokens.push(response.data.result[0]);
            }
            console.log(
              `Swap Detected: ${
                BigNumber(events[0][2].value) /
                BigNumber("1e" + tokens[0].tokenDecimal)
              } ${tokens[0].tokenSymbol} for ${
                BigNumber(events[tokens.length - 1][2].value) /
                BigNumber("1e" + tokens[tokens.length - 1].tokenDecimal)
              } ${tokens[tokens.length - 1].tokenSymbol}`
            );
            var _1inchData = await getQuote(
              tokenAddresses[0].toLowerCase(),
              tokenAddresses[tokens.length - 1].toLowerCase(),
              events[0][2].value
            );
            console.log(_1inchData);
            console.log(
              `With 1inch get ${
                BigNumber(_1inchData.toTokenAmount) /
                BigNumber(`1e${_1inchData.toToken.decimals}`)
              } ${_1inchData.toToken.symbol} for ${
                BigNumber(_1inchData.fromTokenAmount) /
                BigNumber(`1e${_1inchData.fromToken.decimals}`)
              } ${_1inchData.fromToken.symbol}`
            );

            // break;
            // }
          }
        }
      }
    },
  };
};
