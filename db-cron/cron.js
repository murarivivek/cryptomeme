// Library dependecies
var mysql = require('mysql');
var Web3 = require("web3");
var contract = require("truffle-contract");
var cron = require('node-cron');

// Configuration
var config = require("./db.json");
var memeTokenConfig = require("../build/contracts/MemeToken.json");
var web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
web3 = new Web3(web3Provider);

// DB Connection pool
var pool  = mysql.createPool(config);

// Solidity contract
var MemeContract = contract(memeTokenConfig);
MemeContract.setProvider(web3Provider);


var memeInstance;

populateInstance();

function populateInstance() {
  try {
      MemeContract.deployed().then(function(instance) {
        memeInstance = instance;
        // Schedule cron every minute.
        cron.schedule('* * * * *', populateDBData);
    });
  } catch(err){
      console.log("****** Error : " + new Date());
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
    getTransferEvents(memePrices, lastBlockNumber, getTransferEventsSuccess, getTransferEventsError);
}

function getLastBlockNumberError(err){
  console.log("****** getLastBlockNumberError : " + new Date());
  console.log(err);
}


// get Transfer events from last processed block till latest
function getTransferEvents(memePrices, lastBlockNumber, successCallBack, errorCallBack){
  try {
        var transferEvents = memeInstance.Transfer({event: "Transfer"},{fromBlock: lastBlockNumber, toBlock: 'latest'});
        transferEvents.get(function(error, results){
          try {
            var events = [];
            var latestTransactions = {};
            var newBlockNumber = lastBlockNumber;
            for (var i = 0; i < results.length; i++) {
              var event = [];
              event.push(results[i].transactionHash);
              var tokenId = results[i].args.tokenId;
              var memeId = web3.toDecimal(tokenId);
              event.push(memeId);
              event.push(results[i].args.from);
              event.push(results[i].args.to);
              event.push(results[i].blockNumber);
              var txn = {};
              txn.transactionHash = results[i].transactionHash;
              txn.owner = results[i].args.to;
              txn.price = memePrices[memeId];
              latestTransactions[memeId] = txn;
              newBlockNumber = results[i].blockNumber;
              events.push(event);
            }
            successCallBack(events, lastBlockNumber, newBlockNumber, latestTransactions);
          } catch(err){
              errorCallBack(err);
          }
        });
  } catch(err){
      errorCallBack(err);
  }
}

function getTransferEventsSuccess(events, lastBlockNumber, newBlockNumber, latestTransactions){
    if(events.length > 0) {
      getTokenSoldEvents(events, lastBlockNumber, newBlockNumber, latestTransactions, getTokenSoldEventsSuccess, getTokenSoldEventsError);
    } else {
      console.log("****** Job Done : " + new Date());
    }
}

function getTransferEventsError(err){
  console.log("****** getTransferEventsError : " + new Date());
  console.log(err);
}


// get TokenSold events from last processed block till latest
function getTokenSoldEvents(events, lastBlockNumber, newBlockNumber, latestTransactions, successCallBack, errorCallBack){
  try {
        var soldEvents = memeInstance.TokenSold({event: "TokenSold"},{fromBlock: lastBlockNumber, toBlock: newBlockNumber});
        soldEvents.get(function(error, results){
          try {
            for (var i = 0; i < results.length; i++) {
              var tokenId = results[i].args.tokenId;
              var memeId = web3.toDecimal(tokenId);
              var priceEth = results[i].args.newPrice;
              var price = web3.fromWei(priceEth, "ether").toNumber();;
              if (latestTransactions.hasOwnProperty(memeId)) {
                latestTransactions[memeId].price = price;
              }
            }
            successCallBack(events, newBlockNumber, latestTransactions);
          } catch(err){
              errorCallBack(err);
          }
        });
  } catch(err){
      errorCallBack(err);
  }
}

function getTokenSoldEventsSuccess(events, newBlockNumber, latestTransactions) {
    updateTransfers(events, newBlockNumber, latestTransactions, updateTransfersSuccess, updateTransfersError)
}

function getTokenSoldEventsError(err){
  console.log("****** getTokenSoldEventsError : " + new Date());
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
    updateBlockNumber(newBlockNumber, updateBlockNumberSuccess, updateBlockNumberError)
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



