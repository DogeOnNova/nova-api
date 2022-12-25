const app = require("express")();
const abi = require("./abi.json");
const ethers = require("ethers");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const pair_abi = require("./pair.json")
const cors = require("cors");

const { TransactionTypes } = require("ethers/lib/utils");
const toWei = (ether) => ethers.utils.parseEther(ether);
const toEther = (wei) => ethers.utils.formatEther(wei).toString();

// ENVS
const port = process.env.PORT || 4000;
const contract_address = "0xA7d4FF9350546Af6e871F5AE6eB96aDDfBA6541d";
const rpc =
  "https://dimensional-frosty-sheet.nova-mainnet.discover.quiknode.pro/e889d6edd2af0acda4416cc729674fc50a43e372/";
// Contract
try {
  var provider = new ethers.providers.JsonRpcProvider(rpc);

  var Contract = new ethers.Contract(contract_address, abi, provider);
} catch {
  console.log("contract Contacting Failed");
}

// MAIN
process.on("uncaughtException", function (err) {
  console.error(err);
  console.log("Api  Restarting...");
});
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
});

app.listen(port, () => console.log(`Listening on port ${port}..`));
app.use(cors());
app.use(limiter);
app.use(helmet());
// Main Routes
app.get("/", async (req, res) => {
  let arr = []
 
  const FUNC_lplocks = async (lp, index) => {
  
  const _index =   toWei(index).toString()
  

    for (var i = 0; i < _index; i++) {
     
      const lplocks = await Contract.lplocks(lp,i.toString());
      const _amount =  ethers.utils.formatEther(lplocks[1])
      if(_amount > 0){
        const _pait = new ethers.Contract(
          lp,
          pair_abi,
          provider
        );
     
    
        const token0 = await _pait.token0();
        const token1 = await _pait.token1();
        const _token0 = new ethers.Contract(token0, pair_abi, provider);
        const _token1 = new ethers.Contract(token1, pair_abi, provider);
        const _name0 = await _token0.name();
        const _name1 = await _token1.name();

        let _unlockdata = toWei(lplocks[3].toString());
        let UNIX_Timestamp = toEther(_unlockdata.toString());
       


        let _lockdata = toWei(lplocks[0].toString());
         let lockUNIX_Timestamp = toEther(_lockdata.toString());
      

         let index_ =  ethers.utils.formatEther(i)
         let   lock_id_  = ethers.utils.formatEther(lplocks[4]) 

         const supply  = await _pait.totalSupply()
         const _percentage =  percentage(ethers.utils.formatEther(lplocks[1]), toEther(supply))
        

        
        
        const _arr = {
          name: _name0 + "/" + _name1,
          unlockdata:Math.trunc(UNIX_Timestamp) ,
          lockdata: Math.trunc(lockUNIX_Timestamp),
          lp: lp ,
          _index: Math.trunc(index_) ,
          lock_id:Math.trunc(lock_id_) ,
          amount: ethers.utils.formatEther(lplocks[1]),
          owner : lplocks[5],
          percentage: _percentage.toFixed(2),
          
        }
        arr.push(_arr)
      }
     
    
      
    }
  };
  const FUNC_getNumLocksForToken = async (lp) => {
    const getNumLocksForToken = await Contract.getNumLocksForToken(lp);
    const _index = ethers.utils.formatEther(getNumLocksForToken.toString());

   await FUNC_lplocks(lp,_index)
  
  };

  const FUNC_getLockedTokenAtIndex = async (COUNT) => {
    const getLockedTokenAtIndex = await Contract.getLockedTokenAtIndex(COUNT);
    await FUNC_getNumLocksForToken(getLockedTokenAtIndex);
  };
  try {
    const GetallLock = await Contract.getNumlocklp();
    const _GetallLock = ethers.utils.formatEther(GetallLock.toString());
    for (var i = 0; i < toWei(_GetallLock.toString()); i++) {
      await FUNC_getLockedTokenAtIndex(i);
    }

    res.send(arr);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});
function percentage(partialValue, totalValue) {
  return (100 * partialValue) / totalValue;
}