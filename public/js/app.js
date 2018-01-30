App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    // Load memes.
    $.getJSON('../memes.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].image_url);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return App.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    web3 = new Web3(App.web3Provider);
    var account = web3.eth.accounts[0];
    $('#loggedin').text(web3.eth.accounts[0]);
    setInterval(function() {
            if ((web3.eth.accounts[0] || null) !== account) {
                account = web3.eth.accounts[0] || null;
                if (account) {
                    web3.eth.defaultAccount = account;
                    $('#loggedin').text(web3.eth.accounts[0]);
                }
                console.log("INFO_LOG|update_account_info|account=" + account);
            }
        }, 500);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('MemeToken.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var MemeTokenArtifact = data;
      App.contracts.Meme = TruffleContract(MemeTokenArtifact);

      // Set the provider for our contract
      App.contracts.Meme.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  markAdopted: function(adopters, account) {
    var memeInstance;

    App.contracts.Meme.deployed().then(function(instance) {
      memeInstance = instance;
      var tokenIds = [];
      $('.btn-adopt').each(function(index, ele){tokenIds[index] = parseInt(ele.getAttribute('data-id'))});
      memeInstance.getMemeSellingPrices(tokenIds).then(function(meme){
        for(i=0;i<tokenIds.length;i++){
          var doc = $('.panel-pet').eq(i);
          doc.find('.pet-age').text(web3.fromWei(meme[i], "ether").toNumber());
        }
      });
      memeInstance.getMemeOwners(tokenIds).then(function(meme){
        for(i=0;i<tokenIds.length;i++){
          var doc = $('.panel-pet').eq(i);
          doc.find('.pet-breed').text(meme[i]);
        }
      });

    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));
    var memeInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Meme.deployed().then(function(instance) {
        memeInstance = instance;
        var val = $('.panel-pet').eq(petId).find('.pet-age').text();
        // Execute adopt as a transaction by sending account
        val = (Number(val) + 0.0000005).toFixed(6);
        return memeInstance.purchase(petId, {value: web3.toWei(new web3.BigNumber(val), "ether")});
      }).then(function(result) {
        return App.markAdopted();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
    
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
