const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async function convertToUSD(tokenAddresses) {
  let dataToReturn = null;
  let response = await axios.get(
    `https://api.ethplorer.io/getAddressInfo/${tokenAddresses}?apiKey=freekey`
  );
  if (response.data.tokenInfo.price)
    dataToReturn = response.data.tokenInfo.price.rate;
  if (dataToReturn == null) {
    const body = await axios.get(
      `https://etherscan.io/token/${tokenAddresses}`
    );
    const $ = cheerio.load(body.data);
    dataToReturn = $(
      "#ContentPlaceHolder1_tr_valuepertoken > div > div:nth-child(1) > span"
    )
      .text()
      .split(" @ ")[0]
      .substring(2);
  }
  return dataToReturn;
};