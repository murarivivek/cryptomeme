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
  getMemeIds(getMemeIdsSuccess, getMemeIdsError);  
}


// Fetches meme ids from DB
function getMemeIds (successCallBack, errorCallBack) {
    pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err)
      } else {
          connection.query('SELECT id FROM meme where status = 1', function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            var count = results.length;
            var memeIds = [];
            for (var i = 0; i < count; i++) {
              memeIds.push(results[i].id);
            }
            successCallBack(memeIds)
          }
          
        });
      }
  });
}

function getMemeIdsSuccess(memeIds){
  if(memeIds.length > 0) {
      fetchPricesAndOwners(memeIds, fetchPricesAndOwnersSuccess, fetchPricesAndOwnersError);
  }
}

function getMemeIdsError(err){
  console.log("****** Error : " + new Date());
  console.log(err);
}

// Fetches prices & owners for given meme ids from contract
function fetchPricesAndOwners(memeIds, successCallBack, errorCallBack){
  var memeInstance;
  try {
      MemeContract.deployed().then(function(instance) {
        memeInstance = instance;
        memeInstance.getMemeSellingPrices(memeIds).then(function(prices){
          try {
            var memePrices = {};
            var memeOwners = {};
            for(i=0;i<memeIds.length;i++) {
                memePrices[memeIds[i]] = web3.fromWei(prices[i], "ether").toNumber();
            }
            instance.getMemeOwners(memeIds).then(function(owners){
              try {
                for(i=0;i<memeIds.length;i++) {
                  memeOwners[memeIds[i]] = owners[i];
                }
                successCallBack(memeIds, memePrices, memeOwners);
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

function fetchPricesAndOwnersSuccess(memeIds, memePrices, memeOwners){
    populateOwners(memeIds, memePrices, memeOwners, populateOwnersSuccess, populateOwnersError)
}

function fetchPricesAndOwnersError(err){
  console.log("****** Error : " + new Date());
  console.log(err);
}


// Updates user table, adds if entries are missings.
function populateOwners(memeIds, memePrices, memeOwners, successCallBack, errorCallBack){
    pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err);
      } else {
        var values = [];
        for(i=0;i<memeIds.length;i++) {
            var value = [memeOwners[i], memeOwners[i], 'cron-job', 'cron-job'];
            values.push(value);
        }
        connection.query('INSERT INTO user (wallet_address, username, created_user, last_modified_user) VALUES ? ON DUPLICATE KEY UPDATE wallet_address = VALUES(wallet_address)', [values], function (error, results, fields) {
          connection.release();
          if (error) {
            errorCallBack(error);
          } else {
            successCallBack(memeIds, memePrices, memeOwners)
          }
        });
      }
  });
}

function populateOwnersSuccess(memeIds, memePrices, memeOwners){
    updateMemeOwnerships(memeIds, memePrices, memeOwners, updateMemeOwnershipsSuccess, updateMemeOwnershipsError)
}

function populateOwnersError(err){
  console.log("****** Error : " + new Date());
  console.log(err);
}


// Updates meme_ownership table
function updateMemeOwnerships(memeIds, memePrices, memeOwners, successCallBack, errorCallBack){
    pool.getConnection(function(err, connection) {
      if(err) {
        errorCallBack(err);
      } else {
        var values = [];
        var time_stamp = (new Date ((new Date((new Date(new Date())).toISOString() )).getTime() - ((new Date()).getTimezoneOffset()*60000))).toISOString().slice(0, 19).replace('T', ' ');
        for(i=0;i<memeIds.length;i++) {
            var value = [memeIds[i], memeOwners[i], memePrices[i], 'cron-job', 'cron-job', time_stamp];
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
    console.log("****** Job Done : " + new Date());
}

function updateMemeOwnershipsError(err){
  console.log("****** Error : " + new Date());
  console.log(err);
}






