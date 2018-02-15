var User = {

  init: function() {
    
  User.getSortedMemes();
    
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
                  var ownerDisplay = memes[i].username.length>20?memes[i].username.substring(0,20)+'...':memes[i].username;
                }else{
                  ownerDisplay = "NoOwner";
                }
        memeTemplate.find('.meme-link').attr('href', '/meme/'+memes[i].id);
        memeTemplate.find('.owner').html('<a href="/user/'+memes[i].wallet_address+'">'+ownerDisplay+'</a>');
        memeTemplate.find('.price').attr('data-trueval', memes[i].price);
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
    $("#metamaskModal").modal();
  },

  handleAdopt: function(memeId, price) {

  
    var memeInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Meme.deployed().then(function(instance) {
        memeInstance = instance;
        return memeInstance.purchase(memeId, {value: web3.toWei(new web3.BigNumber(price), "ether")});
      }).catch(function(err) {
        console.log(err.message);
      });
    });
    
  }

};

$(function() {
  $(document).ready(function() {
        App.init(User.init);
  });
});
