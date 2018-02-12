var User = {

  init: function() {
    
  User.getSortedMemes();
    
  },

  bindEvents: function() {
    $(document).on('click', '.btn-buy', User.handleAdopt);
    $("#btn-modal").click(function(){
        $("#ShowModal").modal();
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
        memeTemplate.find('.owner').html('<a href="/user/'+memes[i].username+'">'+ownerDisplay+'</a>');
        var price = (memes[i].price+ 0.00000049).toFixed(6);
        memeTemplate.find('.price').text(price);
        memeTemplate.find('.price').attr('data-trueval', price);
        memeTemplate.find('.pet-location').text(memes[i].location);
        memeTemplate.find('.btn-buy').attr('data-id', memes[i].id);
        petsRow.append(memeTemplate.html());
      }
      
    });
    
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
