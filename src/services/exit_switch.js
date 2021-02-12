const supabaseClient = require("@supabase/supabase-js");

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMjIzMDc5MiwiZXhwIjoxOTI3ODA2NzkyfQ.N9aWI_jim3_ND9veSLcy4xDpyUCNk6En3Qh6OqbvlRU";
const supabase = supabaseClient.createClient(
  "https://zdzpscendscphisyveuv.supabase.co",
  SUPABASE_KEY
);

module.exports = function ExitSwitch() {
    supabase.from('exit_switch').on('UPDATE' , (v)=>{
        console.log(v.new)
        if(v.new.exit) process.exit(1);
    }).subscribe()
}