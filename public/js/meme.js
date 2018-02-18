var Meme = {

  bindEvents: function() {
    $(document).on('click', '.btn-buy', Meme.showBuyModal);
    $("#buyMeme").click(function(event){
        Meme.handleAdopt($("#buyMeme").attr("data-id"),$("#memeBuyPrice").val());
    });
  },
 handleAdopt: function(memeId, price) {
    
    if(!App.metamaskInstalled){
      $('#noMetaMaskAlert').show();
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
        });
      }).catch(function(err) {
        $('#metaMaskLockedAlert').show();
      });
    });
    
  },

  showBuyModal: function(event){
    event.preventDefault();
    var memeId = parseInt($(event.target).attr('meme-id'));
    price = $(event.target).attr('meme-price');
    $("#metamaskModalVerticalLabel").text("Buy " + $(event.target).parent().parent().parent().find('.card-title').text() + " Meme");
    $("#memeBuyPrice").val(price);
    $("#buyMeme").attr("data-id", memeId);
    $('#noMetaMaskAlert').hide();
    $('#metaMaskLockedAlert').hide();
    $('#userDeniedTransaction').hide();
    $('#transactionSuccess').hide();
    $("#metamaskModal").modal();
  }

};
$(function() {
  $(document).ready(function() {
        App.init(Meme.bindEvents);

  });
});
