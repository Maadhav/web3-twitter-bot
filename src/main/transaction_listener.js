const TwitterPost = require("../util/twitter_bot");
const axios = require("axios");
const BigNumber = require("bignumber.js");
const abiDecoder = require("abi-decoder");
const supabaseClient = require("../services/supabase_client");
const oneInchApi = require("../services/1inch_api");
const colors = require("colors");
const convertToUSD = require("../util/token_to_usd");
var blocks_read = [];
var txs_read = [];
var canTweet = true;
var time = 0;
  setInterval(() => {
    time ++
    if(time == 40){
      canTweet = true;
      time = 0
    }
  }, 1000);

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
const dexData = [
  {
    name: "Uniswap",
    address: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
  },
  {
    name: "Uniswap",
    address: "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a",
  },
  {
    name: "Sushiswap",
    address: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
  },
  {
    name: "Balancer",
    address: "0x6317C5e82A06E1d8bf200d21F4510Ac2c038AC81",
  },
  {
    name: "Balancer",
    address: "0x3e66b66fd1d0b02fda6c811da9e0547970db2f21",
  },
];
abiDecoder.addABI(erc20TransferEvent);
module.exports = (web3) => {
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
              dexData
                .map((dex) => dex.address.toLowerCase())
                .includes(transaction.to.toLowerCase())
            ) {
              let rec = await web3.eth.getTransactionReceipt(tx);
              if(rec==null || rec.logs==null) continue
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
              let dexName = dexData.find(
                (dex) =>
                  dex.address.toLowerCase() == transaction.to.toLowerCase()
              ).name;
              let amountDifference =
                (BigNumber(_1inchData.toTokenAmount) -
                  BigNumber(events[tokens.length - 1][2].value)) /
                BigNumber(`1e${_1inchData.toToken.decimals}`);
              if (amountDifference <= 0) {
                console.log("Block Number:      ".bgCyan.black + block.number);
                console.log("Transaction ID:    ".bgYellow.black + tx);
                console.log("DEX Name:          " + dexName);
                console.log(
                  "Amount Difference: ".bgRed.black + amountDifference
                );
                console.log("\n");
                continue;
              }
              let differenceInUSD =
                BigNumber(await convertToUSD(
                  tokenAddresses[tokens.length - 1].toLowerCase()
                )) * amountDifference;
              BigNumber(`1e${_1inchData.toToken.decimals}`);
              amountDifference =
                "$" + BigNumber(differenceInUSD);
                if(amountDifference == '$0' || amountDifference =='$NaN') continue;
                if(canTweet){
                  TwitterPost(
                    `https://etherscan.io/tx/${tx} just swapped ${
                      BigNumber(events[0][2].value) /
                      BigNumber("1e" + tokens[0].tokenDecimal)
                    } ${tokens[0].tokenSymbol} for ${
                      BigNumber(events[tokens.length - 1][2].value) /
                      BigNumber("1e" + tokens[tokens.length - 1].tokenDecimal)
                    } ${
                      tokens[tokens.length - 1].tokenSymbol
                    } on ${dexName}. That trade on #1INCH would be ${amountDifference} better.`,
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
                        loss: `${amountDifference}`,
                        tweetUrl: tweetUrl,
                        dexName: dexName,
                      };
                      supabaseClient(finalMessage);
                      console.log(
                        "Block Number:      ".bgCyan.black + finalMessage.block
                        );
                        console.log(
                          "Tranaction ID:     ".bgYellow.black + finalMessage.tx_id
                          );
                          console.log("DEX Name:          " + dexName);
                          console.log(
                            "Amount Difference: ".bgGreen.black + finalMessage.loss
                            );
                            console.log("Tweet URL:         " + finalMessage.tweetUrl);
                            console.log("\n");
                            canTweet=false
                            time = 0
                          }
                          );
                        }
                        else{
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
                            loss: `${amountDifference}`,
                            tweetUrl: 'https://twitter.com/1inchSwapBot',
                            dexName: dexName,
                          };
                          supabaseClient(finalMessage);
                          console.log(
                            "Block Number:      ".bgCyan.black + finalMessage.block
                            );
                            console.log(
                              "Tranaction ID:     ".bgYellow.black + finalMessage.tx_id
                              );
                              console.log("DEX Name:          " + dexName);
                              console.log(
                                "Amount Difference: ".bgGreen.black + finalMessage.loss
                                );
                                console.log("Tweet Seconds Left:"+`${40 - time}`.cyan);
                                console.log("");
                        }
            }
          }
        }
      }
    },
  };
};
