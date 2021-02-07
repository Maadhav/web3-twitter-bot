const TwitterPost = require("./twitter_bot");
const axios = require("axios");
const BigNumber = require("bignumber.js");
const abiDecoder = require("abi-decoder");
const supabaseClient = require("./supabase_client");
const oneInchApi = require("./1inch_api");
const colors = require("colors");
var blocks_read = [];
var txs_read = [];

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

abiDecoder.addABI(erc20TransferEvent);
module.exports = (web3) => {
  const uniswap = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";
  return {
    async checkLastBlock() {
      let block = await web3.eth.getBlock("latest");
      if (!blocks_read.includes(block.number)) {
        blocks_read.push(block.number);
        if (block && block.transactions) {
          for (let tx of block.transactions) {
            if (txs_read.includes(tx)) continue;
            txs_read.push(tx);
            let transaction = await web3.eth.getTransaction(tx);
            if (
              transaction &&
              transaction.from &&
              transaction.to &&
              transaction.to.toLowerCase() == uniswap
            ) {
              let rec = await web3.eth.getTransactionReceipt(tx);
              const decodedLogs = abiDecoder.decodeLogs(rec.logs);
              const events = decodedLogs.map((e) => e.events);
              let tokens = [];
              let tokenAddresses = [];
              for (const element of decodedLogs) {
                let response = await axios.get(
                  "https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=" +
                    element.address +
                    "&page=1&offset=1&apiKey=7M8EQ5E68Q25ZH9BSZH3JMVZ1JN5IM9JP3"
                );
                tokenAddresses.push(element.address);
                tokens.push(response.data.result[0]);
              }
              if (tokens.length < 2) continue;
              let _1inchData = await oneInchApi(
                tokenAddresses[0].toLowerCase(),
                tokenAddresses[tokens.length - 1].toLowerCase(),
                events[0][2].value
              );
              if (_1inchData == null) continue;
              let amountIn =
                BigNumber(events[tokens.length - 1][2].value) /
                BigNumber("1e" + _1inchData.toToken.decimals);
              let finalMessage;
              const amountDifference =
                (BigNumber(_1inchData.toTokenAmount) -
                  BigNumber(events[tokens.length - 1][2].value)) /
                BigNumber(`1e${_1inchData.toToken.decimals}`);
              if (amountDifference <= 0) {
                console.log("Block Number:      ".bgCyan.black + block.number);
                console.log("Transaction ID:    ".bgYellow.black + tx);
                console.log("Amount Difference: ".bgRed.black + amountDifference
                );
                console.log()
                continue;
              }
              TwitterPost(
                `https://etherscan.io/tx/${tx} just swapped ${
                  BigNumber(events[0][2].value) /
                  BigNumber("1e" + tokens[0].tokenDecimal)
                } ${tokens[0].tokenSymbol} for ${
                  BigNumber(events[tokens.length - 1][2].value) /
                  BigNumber("1e" + tokens[tokens.length - 1].tokenDecimal)
                } ${
                  tokens[tokens.length - 1].tokenSymbol
                } on Uniswap. That trade on #1INCH would be ${amountDifference} ${
                  _1inchData.toToken.symbol
                } cheaper.`,
                (tweetUrl) => {
                  finalMessage = {
                    tx_id: tx,
                    block: block.number,
                    fromAdress: transaction.from,
                    toAddress: transaction.to,
                    fromToken: tokenAddresses[0],
                    toToken: tokenAddresses[tokens.length - 1],
                    amountIn: `${
                      BigNumber(events[0][2].value) /
                      BigNumber("1e" + _1inchData.fromToken.decimals)
                    } ${_1inchData.fromToken.symbol}`,
                    amountOut: `${amountIn} ${_1inchData.toToken.symbol}`,
                    with1inch: `${
                      BigNumber(_1inchData.toTokenAmount) /
                      BigNumber(`1e${_1inchData.toToken.decimals}`)
                    } ${_1inchData.toToken.symbol}`,
                    loss: `${amountDifference} ${_1inchData.toToken.symbol}`,
                    tweetUrl: tweetUrl,
                  };
                  supabaseClient(finalMessage);
                  console.log(
                    "Block Number:      ".bgCyan.black + finalMessage.block
                  );
                  console.log(
                    "Tranaction ID:     ".bgYellow.black + finalMessage.tx_id
                  );
                  console.log(
                    "Amount Difference: ".bgGreen.black + finalMessage.loss
                  );
                  console.log("Tweet URL:         " + finalMessage.tweetUrl);
                  console.log()
                }
              );
              // break;
            }
          }
        }
      }
    },
  };
};
