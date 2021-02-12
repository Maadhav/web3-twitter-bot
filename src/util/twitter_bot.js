var Twitter = require("twitter");

module.exports = function TwitterPost(message,callback ) {
  var client = new Twitter({
    consumer_key: "Yc3O8vphf2t2P05yTzTvnLxtl",
    consumer_secret: "DnTDk2n25q7i6x6PbZsPrOCJjP7hqIxRZKGdrr4uDna96uOQ1V",
    access_token_key: "1356405368314863623-zfZCs9af6BSzM0PFbSFRLMqBjh07ni",
    access_token_secret: "DhqHkxHJq7iwNvIqtvxT26bK3weqEEwjr0sAWdD2uJtzo",
  });
  client.post(
    "statuses/update",
    { status: message },
    function (error, tweet, response) {
      if (error) throw error
      else
      callback(`https://twitter.com/1inchSwapBot/status/${tweet.id_str}`)
    }
  );
}
