const axios = require("axios")

module.exports = async function getQuote(fromTokenAddress, toTokenAddress, amount) {
        uri = `https://api.1inch.exchange/v2.0/quote?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}`;
        try {
          let response = await axios.get(uri);
          return response.data;
        } catch (error) {
          console.log(error);
          return null;
        }
}