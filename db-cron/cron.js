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

// Schedule cron every minute.
cron.schedule('* * * * *', populateDBData);


// Entry point function
function populateDBData() {
  console.log("****** Job started : " + new Date());
  getMemes(getMemesSuccess, getMemesError);  
}


// Fetches meme ids from DB
function getMemes (successCallBack, errorCallBack) {
    pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err)
      } else {
          connection.query('SELECT id, base_price FROM meme where status = 1', function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            var count = results.length;
            var memeIds = [];
            var memes = [];
            for (var i = 0; i < count; i++) {
              var meme = {};
              meme.id = results[i].id;
              meme.basePrice = results[i].base_price;
              memeIds.push(results[i].id);
              memes.push(meme);
            }
            successCallBack(memeIds, memes)
          }
          
        });
      }
  });
}

function getMemesSuccess(memeIds, memes){
  if(memeIds.length > 0) {
      fetchPricesAndOwners(memeIds, memes, fetchPricesAndOwnersSuccess, fetchPricesAndOwnersError);
  } else {
      console.log("****** Job Done : " + new Date()); 
  }
}

function getMemesError(err){
  console.log("****** Error : " + new Date());
  console.log(err);
}

// Fetches prices & owners for given meme ids from contract
function fetchPricesAndOwners(memeIds, memes, successCallBack, errorCallBack){
  var memeInstance;
  try {
      MemeContract.deployed().then(function(instance) {
        memeInstance = instance;
        memeInstance.getMemeSellingPrices(memeIds).then(function(prices){
          try {
            for(i=0;i<memeIds.length;i++) {
                memes[i].price = web3.fromWei(prices[i], "ether").toNumber();
            }
            instance.getMemeOwners(memeIds).then(function(owners){
              try {
                for(i=0;i<memeIds.length;i++) {
                  memes[i].owner = owners[i];
                }
                successCallBack(memes);
              } catch(err){
                  errorCallBack(err);
              }
            });

          } catch(err){
              errorCallBack(err);
          }
        });
    });
  } catch(err){
      errorCallBack(err);
  }
  
}

function fetchPricesAndOwnersSuccess(memes){
    populateOwners(memes, populateOwnersSuccess, populateOwnersError)
}

function fetchPricesAndOwnersError(err){
  console.log("****** Error : " + new Date());
  console.log(err);
}


// Updates user table, adds if entries are missings.
function populateOwners(memes, successCallBack, errorCallBack){
    pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err);
      } else {
        var values = [];
        for(i=0;i<memes.length;i++) {
            var value = [memes[i].owner, memes[i].owner, 'cron-job', 'cron-job'];
            values.push(value);
        }
        connection.query('INSERT INTO user (wallet_address, username, created_user, last_modified_user) VALUES ? ON DUPLICATE KEY UPDATE wallet_address = VALUES(wallet_address)', [values], function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            successCallBack(memes)
          }
        });
      }
  });
}

function populateOwnersSuccess(memes){
    updateMemeOwnerships(memes, updateMemeOwnershipsSuccess, updateMemeOwnershipsError)
}

function populateOwnersError(err){
  console.log("****** Error : " + new Date());
  console.log(err);
}


// Updates meme_ownership table
function updateMemeOwnerships(memes, successCallBack, errorCallBack){
    pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err);
      } else {
        var values = [];
        var time_stamp = (new Date ((new Date((new Date(new Date())).toISOString() )).getTime() - ((new Date()).getTimezoneOffset()*60000))).toISOString().slice(0, 19).replace('T', ' ');
        
        for(i=0;i<memes.length;i++) {
            var value = [memes[i].id, memes[i].owner, memes[i].price, 'cron-job', 'cron-job', time_stamp];
            values.push(value);
        }
        connection.query('INSERT INTO meme_ownership (meme_id, wallet_address, price, created_user, last_modified_user, last_modified_time) VALUES  ? ON DUPLICATE KEY UPDATE wallet_address = VALUES(wallet_address), price = VALUES(price), last_modified_user = VALUES(last_modified_user), last_modified_time = VALUES(last_modified_time)', [values], function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            successCallBack()
          }
        });
      }
  });

}


function updateMemeOwnershipsSuccess(){
    getLastBlockNumber(getLastBlockNumberSuccess, getLastBlockNumberError)
}

function updateMemeOwnershipsError(err){
  console.log("****** Error : " + new Date());
  console.log(err);
}


// Gets last processed block number
function getLastBlockNumber(successCallBack, errorCallBack){
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
            successCallBack(lastBlockNumber);
          }
        });
      }
  });

}


function getLastBlockNumberSuccess(lastBlockNumber){
    getEvents(lastBlockNumber, getEventsSuccess, getEventsError);
}

function getLastBlockNumberError(err){
  console.log("****** Error : " + new Date());
  console.log(err);
}



// get transfer events from last processed block till latest
function getEvents(lastBlockNumber, successCallBack, errorCallBack){
  var memeInstance;
  try {
      MemeContract.deployed().then(function(instance) {
        memeInstance = instance;
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
              latestTransactions[memeId] = results[i].transactionHash;

              newBlockNumber = results[i].blockNumber;
              events.push(event);
            }
            successCallBack(events, newBlockNumber, latestTransactions);
          } catch(err){
              errorCallBack(err);
          }
        });
    });
  } catch(err){
      errorCallBack(err);
  }
}

function getEventsSuccess(events, newBlockNumber, latestTransactions){
    if(events.length > 0) {
      updateTransfers(events, newBlockNumber, latestTransactions, updateTransfersSuccess, updateTransfersError);
    } else {
      console.log("****** Job Done : " + new Date());
    }
}

function getEventsError(err){
  console.log("****** Error : " + new Date());
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
    updateBlockNumber(newBlockNumber, latestTransactions, updateBlockNumberSuccess, updateBlockNumberError);
}

function updateTransfersError(err){
  console.log("****** Error : " + new Date());
  console.log(err);
}


// Updates last processed block number
function updateBlockNumber(newBlockNumber, latestTransactions, successCallBack, errorCallBack){
    pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err);
      } else {
        connection.query('UPDATE last_block_number SET block_number = ?', [newBlockNumber], function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            successCallBack(latestTransactions);
          }
        });
      }
  });

}


function updateBlockNumberSuccess(latestTransactions){
    getTransactionCounts(latestTransactions, getTransactionCountsSuccess, getTransactionCountsError);
}

function updateBlockNumberError(err){
  console.log("****** Error : " + new Date());
  console.log(err);
}


// gets number of transactions for each meme
function getTransactionCounts(latestTransactions, successCallBack, errorCallBack){
    pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err);
      } else {
        connection.query('SELECT meme_id, COUNT(transaction_hash) as count FROM ownership_transfer_log GROUP BY meme_id', function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            var transactionCounts = {};
            for (var i = 0; i < results.length; i++) {
              var id = results[i].meme_id;
              transactionCounts[id] = results[i].count - 1; // To excluse creation event
            }
            successCallBack(latestTransactions, transactionCounts);
          }
        });
      }
  });

}


function getTransactionCountsSuccess(latestTransactions, transactionCounts){
    updateTransactions(latestTransactions, transactionCounts, updateTransactionsSuccess, updateTransactionsError);
}

function getTransactionCountsError(err){
  console.log("****** Error : " + new Date());
  console.log(err);
}

// Updates last transaction to meme_ownership
function updateTransactions(latestTransactions, transactionCounts, successCallBack, errorCallBack){
    pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err);
      } else {
        var values = [];
        for (var memeId in latestTransactions) {
          if (latestTransactions.hasOwnProperty(memeId)) {
            var value = [];
            value.push(memeId);
            value.push(latestTransactions[memeId]);
            if(transactionCounts.hasOwnProperty(memeId)){
              value.push(transactionCounts[memeId]);
            } else {
              value.push(0);
            }
            value.push("");
            value.push(0);
            value.push("");
            value.push("");
            values.push(value);
          }
        }
        connection.query('INSERT INTO meme_ownership (meme_id, last_transaction_hash, transactions_count, wallet_address, price, created_user, last_modified_user) VALUES ? ON DUPLICATE KEY UPDATE last_transaction_hash = VALUES(last_transaction_hash), transactions_count = VALUES(transactions_count)', [values], function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            successCallBack(latestTransactions);
          }
        });
      }
  });

}


function updateTransactionsSuccess(latestTransactions){
    console.log("****** Job Done : " + new Date());
}

function updateTransactionsError(err){
  console.log("****** Error : " + new Date());
  console.log(err);
}

