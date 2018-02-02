App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    // Load memes.
    var url = '/memes';

    if(window.location.pathname.startsWith('/user/')){
      url = '/usermemes/'+window.location.pathname.substring('/user/'.length);
    }else if(window.location.pathname!='/'){
      window.location = '/';
    }
    $.getJSON(url, function(data) {

      var petsRow = $('#memeRow');
      var memeTemplate = $('#memeTemplate');
      
      for (i = 0; i < data.length; i ++) {
        memeTemplate.find('.card-title').text(data[i].name);
        memeTemplate.find('.movie-header').css({
  "background": "url("+data[i].image_url+")",
  "background-size": "contain",
  "background-repeat":"no-repeat",
  "background-position": "center"
});
        memeTemplate.find('img').attr('src', data[i].image_url);
        var ownerDisplay = data[i].username.length>20?data[i].username.substring(0,20)+'...':data[i].username;
        memeTemplate.find('.owner').html('<a href="/user/'+data[i].username+'">'+ownerDisplay+'</a>');
        var price = (data[i].price+ 0.00000049).toFixed(6);
        memeTemplate.find('.price').text(price);
        memeTemplate.find('.pet-location').text(data[i].location);
        memeTemplate.find('.btn-buy').attr('data-id', data[i].id);

        petsRow.append(memeTemplate.html());
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
    $(document).on('click', '.btn-buy', App.handleAdopt);
  },

  markAdopted: function(adopters, account) {
    var memeInstance;

    App.contracts.Meme.deployed().then(function(instance) {
      memeInstance = instance;
      var tokenIds = [];
      $('.btn-buy').each(function(index, ele){tokenIds[index] = parseInt(ele.getAttribute('data-id'))});
      memeInstance.getMemeSellingPrices(tokenIds).then(function(meme){
        for(i=0;i<tokenIds.length;i++){
          var doc = $('.movie-card').eq(i);
          val = (Number(web3.fromWei(meme[i], "ether").toNumber()) + 0.00000049).toFixed(6);
          trueval = Number(web3.fromWei(meme[i], "ether").toNumber());
          doc.find('.price').text(val);
          doc.find('.price').attr('data-trueval',trueval);
        }
      });

    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).attr('data-id'));
    var memeInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Meme.deployed().then(function(instance) {
        memeInstance = instance;
        var val = $('.movie-card').eq(petId).find('.price').attr('data-trueval');
        // Execute adopt as a transaction by sending account
        val = (Number(val) + 0.00000049).toFixed(6);
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
