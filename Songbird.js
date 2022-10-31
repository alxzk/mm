var ethers = require("ethers");
var mongoose = require("mongoose");
const Prices = require("./models/priceModel");
var Web3 = require("web3")
let web3 = new Web3(new Web3.providers.HttpProvider("https://songbird.towolabs.com/rpc"))

const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    console.log("Already connected.");
    return;
  }
  mongoose.connect(
    "mongodb+srv://zoubair:21923313@cluster0.vj9jh.mongodb.net/SavePrice?retryWrites=true&w=majority",
    (err) => {
      if (err) throw err;
      console.log("Connected to mongodb.");
    }
  );
};
const savePrice = async (
value
) => {
  try {
  
      const newPrice = new Prices({
        epochId:value.epochId,
        price:value.price,
        endTime:value.endTime,
        voterPrice:value.voterPrice,
        lowRewardPrice:value.lowRewardPrice,
        highRewardPrice:value.highRewardPrice,
        voterAddress:value.voterAddress,
        alias:value.alias,
        coefficient:value.coefficient,
        coefficientLow:value.coefficientLow,
        coefficientHigh:value.coefficientHigh,
        bestCoefficient:value.bestCoefficient
      });

      await newPrice.save();
      console.log("Register Success!");
    
  } catch (err) {
    console.log(err.message);
  }
};
const ftechData=async()=>{

}
let info = {};
let ftsoContract = null;
let supportedSymbols = [];
let supportedFtsos = [];

var provider = new ethers.providers.JsonRpcProvider(
  "https://songbird.towolabs.com/rpc"
);
const ftsoRegistry = {
  address: "0x6D222fb4544ba230d4b90BA1BfC0A01A94E6cB23",
  abi: [
    {
      type: "function",
      stateMutability: "view",
      outputs: [
        {
          type: "address[]",
          name: "_ftsos",
          internalType: "contract IIFtso[]",
        },
      ],
      name: "getSupportedFtsos",
      inputs: [],
    },
    {
      type: "function",
      stateMutability: "view",
      outputs: [
        {
          type: "string[]",
          name: "_supportedSymbols",
          internalType: "string[]",
        },
      ],
      name: "getSupportedSymbols",
      inputs: [],
    },
    {
      type: "function",
      stateMutability: "view",
      outputs: [
        { type: "uint256", name: "_price", internalType: "uint256" },
        { type: "uint256", name: "_timestamp", internalType: "uint256" },
      ],
      name: "getCurrentPrice",
      inputs: [{ type: "string", name: "_symbol", internalType: "string" }],
    },
    {
      type: "function",
      stateMutability: "view",
      outputs: [
        { type: "uint256", name: "_price", internalType: "uint256" },
        { type: "uint256", name: "_timestamp", internalType: "uint256" },
      ],
      name: "getCurrentPrice",
      inputs: [
        { type: "uint256", name: "_assetIndex", internalType: "uint256" },
      ],
    },
  ],
};
const ftsoRegistryContract = new ethers.Contract(
  ftsoRegistry.address,
  ftsoRegistry.abi,
  provider
);

main = async () => {
  await connectDB();
  supportedSymbols = await ftsoRegistryContract.getSupportedSymbols();
  supportedFtsos = await ftsoRegistryContract.getSupportedFtsos();
  await getSymbolPrices();
  await finalizationListener();
};
main();
async function getSymbolPrices() {

  let i = 0;
  for (var symbol of supportedSymbols) {
    let ftso = {
      address: supportedFtsos[i],
      abi: [
        {
          type: "constructor",
          stateMutability: "nonpayable",
          inputs: [
            { type: "string", name: "_symbol", internalType: "string" },
            {
              type: "address",
              name: "_priceSubmitter",
              internalType: "contract IPriceSubmitter",
            },
            {
              type: "address",
              name: "_wNat",
              internalType: "contract IIVPToken",
            },
            {
              type: "address",
              name: "_ftsoManager",
              internalType: "contract IIFtsoManager",
            },
            {
              type: "uint256",
              name: "_initialPriceUSD",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_priceDeviationThresholdBIPS",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_cyclicBufferSize",
              internalType: "uint256",
            },
          ],
        },
        {
          type: "event",
          name: "LowTurnout",
          inputs: [
            {
              type: "uint256",
              name: "epochId",
              internalType: "uint256",
              indexed: true,
            },
            {
              type: "uint256",
              name: "natTurnout",
              internalType: "uint256",
              indexed: false,
            },
            {
              type: "uint256",
              name: "lowNatTurnoutThresholdBIPS",
              internalType: "uint256",
              indexed: false,
            },
            {
              type: "uint256",
              name: "timestamp",
              internalType: "uint256",
              indexed: false,
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "PriceEpochInitializedOnFtso",
          inputs: [
            {
              type: "uint256",
              name: "epochId",
              internalType: "uint256",
              indexed: true,
            },
            {
              type: "uint256",
              name: "endTime",
              internalType: "uint256",
              indexed: false,
            },
            {
              type: "uint256",
              name: "timestamp",
              internalType: "uint256",
              indexed: false,
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "PriceFinalized",
          inputs: [
            {
              type: "uint256",
              name: "epochId",
              internalType: "uint256",
              indexed: true,
            },
            {
              type: "uint256",
              name: "price",
              internalType: "uint256",
              indexed: false,
            },
            {
              type: "bool",
              name: "rewardedFtso",
              internalType: "bool",
              indexed: false,
            },
            {
              type: "uint256",
              name: "lowRewardPrice",
              internalType: "uint256",
              indexed: false,
            },
            {
              type: "uint256",
              name: "highRewardPrice",
              internalType: "uint256",
              indexed: false,
            },
            {
              type: "uint8",
              name: "finalizationType",
              internalType: "enum IFtso.PriceFinalizationType",
              indexed: false,
            },
            {
              type: "uint256",
              name: "timestamp",
              internalType: "uint256",
              indexed: false,
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "PriceHashSubmitted",
          inputs: [
            {
              type: "address",
              name: "submitter",
              internalType: "address",
              indexed: true,
            },
            {
              type: "uint256",
              name: "epochId",
              internalType: "uint256",
              indexed: true,
            },
            {
              type: "bytes32",
              name: "hash",
              internalType: "bytes32",
              indexed: false,
            },
            {
              type: "uint256",
              name: "timestamp",
              internalType: "uint256",
              indexed: false,
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "PriceRevealed",
          inputs: [
            {
              type: "address",
              name: "voter",
              internalType: "address",
              indexed: true,
            },
            {
              type: "uint256",
              name: "epochId",
              internalType: "uint256",
              indexed: true,
            },
            {
              type: "uint256",
              name: "price",
              internalType: "uint256",
              indexed: false,
            },
            {
              type: "uint256",
              name: "random",
              internalType: "uint256",
              indexed: false,
            },
            {
              type: "uint256",
              name: "timestamp",
              internalType: "uint256",
              indexed: false,
            },
            {
              type: "uint256",
              name: "votePowerNat",
              internalType: "uint256",
              indexed: false,
            },
            {
              type: "uint256",
              name: "votePowerAsset",
              internalType: "uint256",
              indexed: false,
            },
          ],
          anonymous: false,
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [{ type: "uint256", name: "", internalType: "uint256" }],
          name: "ASSET_PRICE_USD_DECIMALS",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "nonpayable",
          outputs: [],
          name: "activateFtso",
          inputs: [
            {
              type: "uint256",
              name: "_firstEpochStartTime",
              internalType: "uint256",
            },
            { type: "uint256", name: "_submitPeriod", internalType: "uint256" },
            { type: "uint256", name: "_revealPeriod", internalType: "uint256" },
          ],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [{ type: "bool", name: "", internalType: "bool" }],
          name: "active",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [
            { type: "address", name: "", internalType: "contract IIFtso" },
          ],
          name: "assetFtsos",
          inputs: [{ type: "uint256", name: "", internalType: "uint256" }],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [
            { type: "address", name: "", internalType: "contract IIVPToken" },
          ],
          name: "assets",
          inputs: [{ type: "uint256", name: "", internalType: "uint256" }],
        },
        {
          type: "function",
          stateMutability: "nonpayable",
          outputs: [],
          name: "averageFinalizePriceEpoch",
          inputs: [
            { type: "uint256", name: "_epochId", internalType: "uint256" },
          ],
        },
        {
          type: "function",
          stateMutability: "nonpayable",
          outputs: [],
          name: "configureEpochs",
          inputs: [
            {
              type: "uint256",
              name: "_maxVotePowerNatThresholdFraction",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_maxVotePowerAssetThresholdFraction",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_lowAssetUSDThreshold",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_highAssetUSDThreshold",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_highAssetTurnoutThresholdBIPS",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_lowNatTurnoutThresholdBIPS",
              internalType: "uint256",
            },
            {
              type: "address[]",
              name: "_trustedAddresses",
              internalType: "address[]",
            },
          ],
        },
        {
          type: "function",
          stateMutability: "nonpayable",
          outputs: [],
          name: "deactivateFtso",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [
            {
              type: "uint256",
              name: "_maxVotePowerNatThresholdFraction",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_maxVotePowerAssetThresholdFraction",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_lowAssetUSDThreshold",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_highAssetUSDThreshold",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_highAssetTurnoutThresholdBIPS",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_lowNatTurnoutThresholdBIPS",
              internalType: "uint256",
            },
            {
              type: "address[]",
              name: "_trustedAddresses",
              internalType: "address[]",
            },
          ],
          name: "epochsConfiguration",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "nonpayable",
          outputs: [
            {
              type: "address[]",
              name: "_eligibleAddresses",
              internalType: "address[]",
            },
            {
              type: "uint256[]",
              name: "_natWeights",
              internalType: "uint256[]",
            },
            {
              type: "uint256",
              name: "_natWeightsSum",
              internalType: "uint256",
            },
          ],
          name: "finalizePriceEpoch",
          inputs: [
            { type: "uint256", name: "_epochId", internalType: "uint256" },
            { type: "bool", name: "_returnRewardData", internalType: "bool" },
          ],
        },
        {
          type: "function",
          stateMutability: "nonpayable",
          outputs: [],
          name: "forceFinalizePriceEpoch",
          inputs: [
            { type: "uint256", name: "_epochId", internalType: "uint256" },
          ],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [
            {
              type: "address",
              name: "",
              internalType: "contract IIFtsoManager",
            },
          ],
          name: "ftsoManager",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [
            { type: "address", name: "", internalType: "contract IIVPToken" },
          ],
          name: "getAsset",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [
            { type: "address[]", name: "", internalType: "contract IIFtso[]" },
          ],
          name: "getAssetFtsos",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [{ type: "uint256", name: "", internalType: "uint256" }],
          name: "getCurrentEpochId",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [
            { type: "uint256", name: "_price", internalType: "uint256" },
            { type: "uint256", name: "_timestamp", internalType: "uint256" },
          ],
          name: "getCurrentPrice",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [{ type: "uint256", name: "", internalType: "uint256" }],
          name: "getCurrentRandom",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [{ type: "uint256", name: "", internalType: "uint256" }],
          name: "getEpochId",
          inputs: [
            { type: "uint256", name: "_timestamp", internalType: "uint256" },
          ],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [{ type: "uint256", name: "", internalType: "uint256" }],
          name: "getEpochPrice",
          inputs: [
            { type: "uint256", name: "_epochId", internalType: "uint256" },
          ],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [{ type: "uint256", name: "", internalType: "uint256" }],
          name: "getEpochPriceForVoter",
          inputs: [
            { type: "uint256", name: "_epochId", internalType: "uint256" },
            { type: "address", name: "_voter", internalType: "address" },
          ],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [
            {
              type: "uint256",
              name: "_firstEpochStartTime",
              internalType: "uint256",
            },
            { type: "uint256", name: "_submitPeriod", internalType: "uint256" },
            { type: "uint256", name: "_revealPeriod", internalType: "uint256" },
          ],
          name: "getPriceEpochConfiguration",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [
            { type: "uint256", name: "_epochId", internalType: "uint256" },
            {
              type: "uint256",
              name: "_epochSubmitEndTime",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_epochRevealEndTime",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_votePowerBlock",
              internalType: "uint256",
            },
            { type: "bool", name: "_fallbackMode", internalType: "bool" },
          ],
          name: "getPriceEpochData",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [{ type: "uint256", name: "", internalType: "uint256" }],
          name: "getRandom",
          inputs: [
            { type: "uint256", name: "_epochId", internalType: "uint256" },
          ],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [
            {
              type: "address[]",
              name: "_assets",
              internalType: "contract IIVPToken[]",
            },
            {
              type: "uint256[]",
              name: "_assetMultipliers",
              internalType: "uint256[]",
            },
            {
              type: "uint256",
              name: "_totalVotePowerNat",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_totalVotePowerAsset",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_assetWeightRatio",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_votePowerBlock",
              internalType: "uint256",
            },
          ],
          name: "getVoteWeightingParameters",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "nonpayable",
          outputs: [],
          name: "initializeCurrentEpochStateForReveal",
          inputs: [
            {
              type: "uint256",
              name: "_circulatingSupplyNat",
              internalType: "uint256",
            },
            { type: "bool", name: "_fallbackMode", internalType: "bool" },
          ],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [{ type: "uint256", name: "", internalType: "uint256" }],
          name: "priceDeviationThresholdBIPS",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [{ type: "uint256", name: "", internalType: "uint256" }],
          name: "priceEpochCyclicBufferSize",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [
            {
              type: "address",
              name: "",
              internalType: "contract IPriceSubmitter",
            },
          ],
          name: "priceSubmitter",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "nonpayable",
          outputs: [],
          name: "revealPriceSubmitter",
          inputs: [
            { type: "address", name: "_voter", internalType: "address" },
            { type: "uint256", name: "_epochId", internalType: "uint256" },
            { type: "uint256", name: "_price", internalType: "uint256" },
            { type: "uint256", name: "_random", internalType: "uint256" },
            { type: "uint256", name: "_voterWNatVP", internalType: "uint256" },
          ],
        },
        {
          type: "function",
          stateMutability: "nonpayable",
          outputs: [],
          name: "setAsset",
          inputs: [
            {
              type: "address",
              name: "_asset",
              internalType: "contract IIVPToken",
            },
          ],
        },
        {
          type: "function",
          stateMutability: "nonpayable",
          outputs: [],
          name: "setAssetFtsos",
          inputs: [
            {
              type: "address[]",
              name: "_assetFtsos",
              internalType: "contract IIFtso[]",
            },
          ],
        },
        {
          type: "function",
          stateMutability: "nonpayable",
          outputs: [],
          name: "setVotePowerBlock",
          inputs: [
            {
              type: "uint256",
              name: "_votePowerBlock",
              internalType: "uint256",
            },
          ],
        },
        {
          type: "function",
          stateMutability: "nonpayable",
          outputs: [],
          name: "submitPriceHashSubmitter",
          inputs: [
            { type: "address", name: "_sender", internalType: "address" },
            { type: "uint256", name: "_epochId", internalType: "uint256" },
            { type: "bytes32", name: "_hash", internalType: "bytes32" },
          ],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [{ type: "string", name: "", internalType: "string" }],
          name: "symbol",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "nonpayable",
          outputs: [],
          name: "updateInitialPrice",
          inputs: [
            {
              type: "uint256",
              name: "_initialPriceUSD",
              internalType: "uint256",
            },
            {
              type: "uint256",
              name: "_initialPriceTimestamp",
              internalType: "uint256",
            },
          ],
        },
        {
          type: "function",
          stateMutability: "view",
          outputs: [
            { type: "address", name: "", internalType: "contract IIVPToken" },
          ],
          name: "wNat",
          inputs: [],
        },
        {
          type: "function",
          stateMutability: "nonpayable",
          outputs: [{ type: "uint256", name: "", internalType: "uint256" }],
          name: "wNatVotePowerCached",
          inputs: [
            { type: "address", name: "_owner", internalType: "address" },
            { type: "uint256", name: "_epochId", internalType: "uint256" },
          ],
        },
      ],
    };
    let block =await web3.eth.getBlock('latest')
    let value=block.number
   let Contract= new web3.eth.Contract(ftso.abi, ftso.address)
   let  result = await Contract.getPastEvents('PriceFinalized',{ fromBlock:value-12, toBlock:value})
    ftsoContract = new ethers.Contract(ftso.address, ftso.abi, provider);
    
   if(result.length!==0){
    const res = await ftsoContract.getEpochPriceForVoter(
      result[0].returnValues.epochId,
      "0xC84d776Ddf92dA03C37d77BC65519AF696cDfe8b"
    );
    const voterPrice = Number(res._hex) / 10 ** 5;
    const bestCoefficient=(((Number(result[0].returnValues.price)/10**5)/voterPrice)+
    (Number(result[0].returnValues.highRewardPrice)/10**5)/voterPrice)/2
    info = {
      epochId: result[0].returnValues.epochId,
      price: Number(result[0].returnValues.price)/10**5,
      endTime: result[0].returnValues.timestamp,
      lowRewardPrice:Number(result[0].returnValues.lowRewardPrice)/10**5,
      highRewardPrice:Number(result[0].returnValues.highRewardPrice)/10**5,
      voterPrice: voterPrice,
      coefficient:(Number(result[0].returnValues.price)/10**5)/voterPrice,
      coefficientLow:(Number(result[0].returnValues.lowRewardPrice)/10**5)/voterPrice,
      coefficientHigh:(Number(result[0].returnValues.highRewardPrice)/10**5)/voterPrice,
      bestCoefficient:bestCoefficient,
      voterAddress: "0xC84d776Ddf92dA03C37d77BC65519AF696cDfe8b",
      alias: symbol,
    };
    console.log(info)
    await savePrice(info)

   }
    i++;   
  }
}

async function finalizationListener() {
  ftsoContract.on("PriceFinalized", async () => {
    await getSymbolPrices();
  });
}

module.exports ={
  connectDB:connectDB,

}