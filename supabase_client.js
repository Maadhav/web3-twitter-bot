const supabaseClient = require("@supabase/supabase-js");

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMjIzMDc5MiwiZXhwIjoxOTI3ODA2NzkyfQ.N9aWI_jim3_ND9veSLcy4xDpyUCNk6En3Qh6OqbvlRU";
const supabase = supabaseClient.createClient(
  "https://zdzpscendscphisyveuv.supabase.co",
  SUPABASE_KEY
);

module.exports = async function addSwapElement(props) {
  const { data, error } = await supabase.from("latest_swaps").insert([props]);
  data !=null && console.log('Added to Supabase')
  error!=null && console.log(error)
};
