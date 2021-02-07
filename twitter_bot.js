var Twitter = require("twitter");

module.exports = function TwitterPost(message,callback ) {
  var client = new Twitter({
    consumer_key: "PqxqzqmDPiLXlMdLtUvtkoIcZ",
    consumer_secret: "bqGRYZdw8fBgJeNumq5xi2x67BOcF0nEhdeFFbfrFremcNeQwi",
    access_token_key: "1356405368314863623-5OqSLkNZjxPlkzLAWqmhGpFau342oa",
    access_token_secret: "GkVvrx9lkuFcMa96rdsBYoUxpMDGAJRXG55sdlJM9nsDb",
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
