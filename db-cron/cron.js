// Library dependecies
var mysql = require('mysql');
var Web3 = require("web3");
var contract = require("truffle-contract");
var cron = require('node-cron');
var request = require('ajax-request');
var SolidityCoder = require("web3/lib/solidity/coder.js");

// Configuration
var config = require("./db.json");
var web3Provider = new Web3.providers.HttpProvider('https://mainnet.infura.io');
web3 = new Web3(web3Provider);

// DB Connection pool
var pool  = mysql.createPool(config);


//Constants
var ETHERSCAN_URL = "https://api.etherscan.io/api";
var ETHERSCAN_API_KEY = "7T9F5K1KWAMRZ5CIEZP4VQ88EQTP6XJ2I8";
var CONTRACT_ADDRESS = "0x0d623823d2AA4540f335bb926447dc582DC5bD64";
var BIRTH_TOPIC = "0xb3b0cf861f168bcdb275c69da97b2543631552ba562628aa3c7317d4a6089ef2";
var TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
var TOKENSOLD_TOPIC = "0x008201e7bcbf010c2c07de59d6e97cb7e3cf67a46125c49cbc89b9d2cde1f48f";

scheduleCronJob();

function scheduleCronJob() {
  try {
        // Schedule cron every minute.
        //cron.schedule('* * * * *', populateDBData);
        setInterval(populateDBData,30*1000);
  } catch(err){
      console.log("****** scheduleCronJob Error : " + new Date());
      console.log(err);
  }
}


// Entry point function
function populateDBData() {
  console.log("****** Job started : " + new Date());
  getMemeBasePrices(getMemeBasePricesSuccess, getMemeBasePricesError);  
}

// Fetches meme base prices from DB
function getMemeBasePrices (successCallBack, errorCallBack) {
    pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err)
      } else {
          connection.query('SELECT id, base_price FROM meme', function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            var count = results.length;
            var memePrices = {};
            for (var i = 0; i < count; i++) {
              memePrices[results[i].id] = results[i].base_price;
            }
            successCallBack(memePrices);
          }
          
        });
      }
  });
}

function getMemeBasePricesSuccess(memePrices){
      getMemeOldPrices(memePrices, getMemeOldPricesSuccess, getMemeOldPricesError);
}

function getMemeBasePricesError(err){
  console.log("****** getMemeBasePricesError : " + new Date());
  console.log(err);
}


// Fetches meme old prices from DB
function getMemeOldPrices(memePrices, successCallBack, errorCallBack) {
    pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err)
      } else {
          connection.query('SELECT meme_id, price FROM meme_ownership', function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            var count = results.length;
            for (var i = 0; i < count; i++) {
              memePrices[results[i].meme_id] = results[i].price;
            }
            successCallBack(memePrices);
          }
          
        });
      }
  });
}

function getMemeOldPricesSuccess(memePrices){
    getLastBlockNumber(memePrices, getLastBlockNumberSuccess, getLastBlockNumberError);
}

function getMemeOldPricesError(err){
  console.log("****** getMemeOldPricesError : " + new Date());
  console.log(err);
}


// Gets last processed block number
function getLastBlockNumber(memePrices, successCallBack, errorCallBack){
    pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err);
      } else {
        connection.query('SELECT block_number FROM last_block_number', function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            var lastBlockNumber = results[0].block_number;
            successCallBack(memePrices, lastBlockNumber);
          }
        });
      }
  });

}


function getLastBlockNumberSuccess(memePrices, lastBlockNumber){
    getCurrentBlockNumber(memePrices, lastBlockNumber, getCurrentBlockNumberSuccess, getCurrentBlockNumberError);
}

function getLastBlockNumberError(err){
  console.log("****** getLastBlockNumberError : " + new Date());
  console.log(err);
}


// Gets current block number
function getCurrentBlockNumber(memePrices, lastBlockNumber, successCallBack, errorCallBack){
    request({
      url: ETHERSCAN_URL,
      method: 'GET',
      data: {
        module : 'proxy',
        action : 'eth_blockNumber',
        apikey : ETHERSCAN_API_KEY
      }
    }, function(err, res, body) {
      try {
        var response = JSON.parse(body);
        if(err){
          errorCallBack(err);
        } else {
          var newBlockNumber = web3.toDecimal(response.result);
          successCallBack(memePrices, lastBlockNumber, newBlockNumber);
        }
      } catch(error){
        errorCallBack(error);
      }
    });
}


function getCurrentBlockNumberSuccess(memePrices, lastBlockNumber, newBlockNumber){
    getEvents(memePrices, lastBlockNumber, newBlockNumber, getEventsSuccess, getEventsError);
}

function getCurrentBlockNumberError(err){
  console.log("****** getCurrentBlockNumberError : " + new Date());
  console.log(err);
}


// get events from last processed block till latest
function getEvents(memePrices, lastBlockNumber, newBlockNumber, successCallBack, errorCallBack){
        request({
          url: ETHERSCAN_URL,
          method: 'GET',
          data: {
            module : 'logs',
            action : 'getLogs',
            fromBlock : lastBlockNumber,
            toBlock : newBlockNumber,
            address : CONTRACT_ADDRESS,
            apikey : ETHERSCAN_API_KEY
          }
        }, function(err, res, body) {
          try {
            var response = JSON.parse(body);
            if(err){
              errorCallBack(err);
            } else {
              var lastProcessedBlock = lastBlockNumber;
              var latestTransactions = {};
              var events = [];
              var births = [];
              var result = response.result;
              for (var i = 0; i < result.length; i++) {
                var topic = result[i].topics[0];
                lastProcessedBlock = web3.toDecimal(result[i].blockNumber);
                //Birth events
                if(topic === BIRTH_TOPIC){
                  var event = processBirthEvent(result[i], memePrices);
                  births.push(event);
                }
                //Transfer events
                else if(topic === TRANSFER_TOPIC){
                  var event = processTransferEvent(result[i], latestTransactions, memePrices);
                  events.push(event);
                }
                //TokenSold events
                if(topic === TOKENSOLD_TOPIC){
                  processTokenSoldEvent(result[i], latestTransactions);
                }
              }
              if(result.length > 999){
                newBlockNumber = lastProcessedBlock;
              }
              successCallBack(births, events, newBlockNumber, latestTransactions);
            }
          } catch(error){
            errorCallBack(error);
          }
        });
}

function getEventsSuccess(births, events, newBlockNumber, latestTransactions){
    if(births.length > 0) {
      createMemes(births, events, newBlockNumber, latestTransactions, createMemesSuccess, createMemesError);
    } else if(events.length > 0) {
      updateTransfers(events, newBlockNumber, latestTransactions, updateTransfersSuccess, updateTransfersError)
    } else {
      updateBlockNumber(newBlockNumber, updateBlockNumberSuccess, updateBlockNumberError);
    }

}

function getEventsError(err){
  console.log("****** getEventsError : " + new Date());
  console.log(err);
}


// create memes based on birth events
function createMemes(births, events, newBlockNumber, latestTransactions, successCallBack, errorCallBack){
  pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err);
      } else {
        connection.query('INSERT INTO meme (id, name, created_user, last_modified_user, status) VALUES  ? ON DUPLICATE KEY UPDATE id = VALUES(id)', [births], function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            successCallBack(events, newBlockNumber, latestTransactions);
          }
        });
      }
  });
}

function createMemesSuccess(events, newBlockNumber, latestTransactions){
    if(events.length > 0) {
      updateTransfers(events, newBlockNumber, latestTransactions, updateTransfersSuccess, updateTransfersError)
    } else {
      updateBlockNumber(newBlockNumber, updateBlockNumberSuccess, updateBlockNumberError);
    }
}

function createMemesError(err){
  console.log("****** createMemesError : " + new Date());
  console.log(err);
}

// Updates ownership_transfer_log table
function updateTransfers(events, newBlockNumber, latestTransactions, successCallBack, errorCallBack){
  pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err);
      } else {
        connection.query('INSERT INTO ownership_transfer_log (transaction_hash, meme_id, from_address, to_address, block_number) VALUES  ? ON DUPLICATE KEY UPDATE transaction_hash = VALUES(transaction_hash)', [events], function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            successCallBack(newBlockNumber, latestTransactions)
          }
        });
      }
  });
}

function updateTransfersSuccess(newBlockNumber, latestTransactions){
    populateOwners(newBlockNumber, latestTransactions, populateOwnersSuccess, populateOwnersError);
}

function updateTransfersError(err){
  console.log("****** updateTransfersError : " + new Date());
  console.log(err);
}



// Updates user table, adds if entries are missings.
function populateOwners(newBlockNumber, latestTransactions, successCallBack, errorCallBack){
    pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err);
      } else {
        var values = [];
        for (var memeId in latestTransactions) {
            var value = [latestTransactions[memeId].owner, latestTransactions[memeId].owner, 'cron-job', 'cron-job'];
            values.push(value);
        }
        connection.query('INSERT INTO user (wallet_address, username, created_user, last_modified_user) VALUES ? ON DUPLICATE KEY UPDATE wallet_address = VALUES(wallet_address)', [values], function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            successCallBack(newBlockNumber, latestTransactions);
          }
        });
      }
  });
}

function populateOwnersSuccess(newBlockNumber, latestTransactions){
    getTransactionCounts(newBlockNumber, latestTransactions, getTransactionCountsSuccess, getTransactionCountsError)
}

function populateOwnersError(err){
  console.log("****** populateOwnersError : " + new Date());
  console.log(err);
}


// gets number of transactions for each meme
function getTransactionCounts(newBlockNumber, latestTransactions, successCallBack, errorCallBack){
    pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err);
      } else {
        connection.query('SELECT meme_id, COUNT(transaction_hash) as count FROM ownership_transfer_log GROUP BY meme_id', function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            for (var i = 0; i < results.length; i++) {
              var id = results[i].meme_id;
              if (latestTransactions.hasOwnProperty(id)) {
                latestTransactions[id].txnCount = results[i].count - 1; // To excluse creation event
              }
            }
            successCallBack(newBlockNumber, latestTransactions);
          }
        });
      }
  });

}


function getTransactionCountsSuccess(newBlockNumber, latestTransactions){
    updateMemeOwnerships(newBlockNumber, latestTransactions, updateMemeOwnershipsSuccess, updateMemeOwnershipsError);
}

function getTransactionCountsError(err){
  console.log("****** getTransactionCountsError : " + new Date());
  console.log(err);
}



// Updates meme_ownership table
function updateMemeOwnerships(newBlockNumber, latestTransactions, successCallBack, errorCallBack){
    pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err);
      } else {
        var values = [];
        var time_stamp = (new Date ((new Date((new Date(new Date())).toISOString() )).getTime() - ((new Date()).getTimezoneOffset()*60000))).toISOString().slice(0, 19).replace('T', ' ');
        for (var memeId in latestTransactions) {
          if (latestTransactions.hasOwnProperty(memeId)) {
            var value = [];
            value.push(memeId);
            value.push(latestTransactions[memeId].owner);
            value.push(latestTransactions[memeId].price);
            value.push(latestTransactions[memeId].transactionHash);
            value.push(latestTransactions[memeId].txnCount);
            value.push("cron-job");
            value.push("cron-job");
            value.push(time_stamp);
            values.push(value);
          }
        }
        connection.query('INSERT INTO meme_ownership (meme_id, wallet_address, price, last_transaction_hash, transactions_count, created_user, last_modified_user, last_modified_time) VALUES ? ON DUPLICATE KEY UPDATE wallet_address = VALUES(wallet_address), last_transaction_hash = VALUES(last_transaction_hash), transactions_count = VALUES(transactions_count), price = VALUES(price), last_modified_user = VALUES(last_modified_user), last_modified_time = VALUES(last_modified_time)', [values], function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            successCallBack(newBlockNumber);
          }
        });
      }
  });

}


function updateMemeOwnershipsSuccess(newBlockNumber){
    updateBlockNumber(newBlockNumber, updateBlockNumberSuccess, updateBlockNumberError);
}

function updateMemeOwnershipsError(err){
  console.log("****** updateMemeOwnershipsError : " + new Date());
  console.log(err);
}



// Updates last processed block number
function updateBlockNumber(newBlockNumber, successCallBack, errorCallBack){
    pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err);
      } else {
        connection.query('UPDATE last_block_number SET block_number = ?', [newBlockNumber], function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            successCallBack();
          }
        });
      }
  });

}


function updateBlockNumberSuccess(){
    console.log("****** Job Done : " + new Date());
}

function updateBlockNumberError(err){
  console.log("****** updateBlockNumberError : " + new Date());
  console.log(err);
}



function processBirthEvent(row, memePrices){
    var data = SolidityCoder.decodeParams(["uint256", "string", "address"], row.data.slice(2));
    var event = [];
    var tokenId = data[0];
    var memeId = web3.toDecimal(tokenId);
    event.push(memeId);
    event.push(data[1]);
    event.push('cron-job');
    event.push('cron-job');
    event.push(0);
    if (!memePrices.hasOwnProperty(memeId)) {
      memePrices[memeId] = 0.001;
    }
    return event;
}



function processTransferEvent(row, latestTransactions, memePrices){
    var data = SolidityCoder.decodeParams(["address", "address", "uint256"], row.data.slice(2));
    var event = [];
    event.push(row.transactionHash);
    var tokenId = data[2];
    var memeId = web3.toDecimal(tokenId);
    event.push(memeId);
    event.push(data[0]);
    event.push(data[1]);
    var blockNum = web3.toDecimal(row.blockNumber);
    event.push(blockNum);
    var txn = {};
    txn.price = memePrices[memeId];
    if (latestTransactions.hasOwnProperty(memeId)) {
      txn = latestTransactions[memeId];
    }
    txn.transactionHash = row.transactionHash;
    txn.owner = data[1];
    latestTransactions[memeId] = txn;
    return event;
}


function processTokenSoldEvent(row, latestTransactions){
    var data = SolidityCoder.decodeParams(["uint256", "uint256", "uint256", "address", "address", "string"], row.data.slice(2));
    var tokenId = data[0];
    var memeId = web3.toDecimal(tokenId);
    var priceEth = data[2];
    var price = web3.fromWei(priceEth, "ether").toNumber();;
    if (latestTransactions.hasOwnProperty(memeId)) {
      latestTransactions[memeId].price = price;
    }
}

