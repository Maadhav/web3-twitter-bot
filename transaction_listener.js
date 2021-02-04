const TwitterPost = require("./twitter_bot");
const axios = require("axios");
const BigNumber = require("bignumber.js");
const abiDecoder = require("abi-decoder");
const supabaseClient = require("./supabase_client");
const colors = require("colors");

var uri;
async function getQuote(fromTokenAddress, toTokenAddress, amount) {
  uri = `https://api.1inch.exchange/v2.0/quote?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}`;
  console.log();
  console.log(`1Inch Quote:  ${uri}`);
  console.log();
  try {
    var response = await axios.get(uri);
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
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
  const uniswap = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";
  var previousTx;
  return {
    async checkLastBlock() {
      while (true) {
        let block = await web3.eth.getBlock("latest");
        console.log("Block: " + block.number);
        if (block && block.transactions) {
          for (let tx of block.transactions) {
            if (tx == previousTx) continue;
            previousTx = tx;
            let transaction = await web3.eth.getTransaction(tx);
            if (
              transaction &&
              transaction.from &&
              transaction.to &&
              transaction.to.toLowerCase() == uniswap
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
              if (tokens.length < 2) continue;
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
              if (_1inchData == null) continue;
              console.log(
                `With 1inch get ${
                  BigNumber(_1inchData.fromTokenAmount) /
                  BigNumber(`1e${_1inchData.toToken.decimals}`)
                } ${_1inchData.fromToken.symbol} for ${
                  BigNumber(_1inchData.toTokenAmount) /
                  BigNumber(`1e${_1inchData.toToken.decimals}`)
                } ${_1inchData.toToken.symbol}`
              );
              const amountDifference =
                (BigNumber(_1inchData.toTokenAmount) -
                  BigNumber(events[tokens.length - 1][2].value)) /
                BigNumber(`1e${_1inchData.toToken.decimals}`);
              if (amountDifference > 0) {
                console.log(
                  `Amount Difference: ${amountDifference}`.black.bgGreen
                );
              } else {
                console.log(
                  `Amount Difference: ${amountDifference}`.black.bgRed
                );
              }
              if (amountDifference <= 0) continue;
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
                  supabaseClient({
                    tx_id: tx,
                    block: block.number,
                    fromAdress: transaction.from,
                    toAddress: transaction.to,
                    fromToken: tokenAddresses[0],
                    toToken: tokenAddresses[tokens.length - 1],
                    amountIn: `${
                      BigNumber(events[0][2].value) /
                      BigNumber("1e" + tokens[0].tokenDecimal)
                    } ${tokens[0].tokenSymbol}`,
                    amountOut: `${
                      BigNumber(events[tokens.length - 1][2].value) /
                      BigNumber("1e" + tokens[tokens.length - 1].tokenDecimal)
                    } ${tokens[tokens.length - 1].tokenSymbol}`,
                    with1inch: `${
                      BigNumber(_1inchData.toTokenAmount) /
                      BigNumber(`1e${_1inchData.toToken.decimals}`)
                    } ${_1inchData.toToken.symbol}`,
                    loss: `${amountDifference} ${_1inchData.toToken.symbol}`,
                    tweetUrl: tweetUrl,
                  });
                }
              );
              break;
            }
          }
        }
      }
    },
  };
};
