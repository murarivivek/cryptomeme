var User = {

  init: function() {
    User.userConnectedMessage();
    User.getSortedMemes();
    
  },

  userConnectedMessage: function(){
    if(App.metamaskInstalled){
      web3.eth.getAccounts(function(error, accounts) {
        var account = accounts[0];
        $('#address').text(account.substring(0,8));
        $('#addressMemes').text('My Memes');
        $('#addressMemes').attr('href', '/user/'+account);
      });
    }else{
      $('#address').text('Not Connected');
      $('#addressMemes').text('How to Connect');
      $('#addressMemes').attr('href', '/faq/#installMetamask');
    }
  },

  bindEvents: function() {
    $(document).on('click', '.btn-buy', User.showBuyModal);
    $("#buyMeme").click(function(event){
        User.handleAdopt($("#buyMeme").attr("data-id"),$("#memeBuyPrice").val());
    });
  },

  getSortedMemes: function(){
    // Load memes.
    
    if(window.location.pathname.startsWith('/user/')){
      url = '/usermemes/'+window.location.pathname.substring('/user/'.length);
    }
    $.getJSON(url, function(data) {
      memes = data;
      var petsRow = $('#memeRow');
      var memeTemplate = $('#memeTemplate');
      petsRow.html("");
      for (i = 0; i < memes.length; i ++) {
        memeTemplate.find('.card-title').text(memes[i].name);
        memeTemplate.find('img').attr('src', memes[i].image_url);
        if(memes[i].username){
                  ownerDisplay = (memes[i].username==memes[i].wallet_address)?memes[i].username.substring(0,8):memes[i].username;
                  ownerDisplay = ownerDisplay.length>20?ownerDisplay.substring(0,20)+'...':ownerDisplay
                }else{
                  ownerDisplay = "NoOwner";
                }
        memeTemplate.find('.meme-link').attr('href', '/meme/'+memes[i].id);
        memeTemplate.find('.owner').html('<a href="/user/'+memes[i].wallet_address+'">'+ownerDisplay+'</a>');
        memeTemplate.find('.price').attr('data-trueval', (memes[i].price+0.000001).toFixed(10));
        var price = (memes[i].price+ 0.00000049).toFixed(6);
        memeTemplate.find('.price').text(price);
        memeTemplate.find('.pet-location').text(memes[i].location);
        memeTemplate.find('.btn-buy').attr('data-id', memes[i].id);
        petsRow.append(memeTemplate.html());
      }
      User.bindEvents();
      
    });
    
  },

  showBuyModal: function(event){
    event.preventDefault();
    var memeId = parseInt($(event.target).attr('data-id'));
    price = $(event.target).parent().parent().parent().find('.price').attr('data-trueval');
    $("#metamaskModalVerticalLabel").text("Buy " + $(event.target).parent().parent().parent().find('.card-title').text() + " Meme");
    $("#memeBuyPrice").val(price);
    $("#buyMeme").attr("data-id", memeId);
    $('#noMetaMaskAlert').hide();
    $('#metaMaskLockedAlert').hide();
    $('#userDeniedTransaction').hide();
    $('#transactionSuccess').hide();
    $("#metamaskModal").modal();
  },

  handleAdopt: function(memeId, price) {

    if(!App.metamaskInstalled){
      $('#noMetaMaskAlert').show();
      return;
    }else{
      $('#noMetaMaskAlert').hide();
    }
    $('#metaMaskLockedAlert').hide();
    $('#userDeniedTransaction').hide();
    $('#transactionSuccess').hide();
    var memeInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Meme.deployed().then(function(instance) {
        memeInstance = instance;
        return memeInstance.purchase(memeId, {value: web3.toWei(new web3.BigNumber(price), "ether")}).then(function(result){
          $('#transactionSuccess').html("Your transaction has been submitted. <a target='_blank' href='https://etherscan.io/tx/"+result.tx+"' style='text-decoration:underline;'>View on etherscan</a> for progress.");
          $('#transactionSuccess').show();
        }).catch(function(err){
          $('#userDeniedTransaction').show();
          return;
        });
      }).catch(function(err) {
        $('#metaMaskLockedAlert').show();
        return;
      });
    });
    
  }

};

$(function() {
  $(document).ready(function() {
        App.init(User.init);
  });
});
