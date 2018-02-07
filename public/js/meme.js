var Meme = {

  bindEvents: function() {
    $(document).on('click', '.btn-buy', Meme.handleAdopt);
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
        return Index.markAdopted();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
    
  }

};
$(function() {
  $(window).load(function() {
        App.init(Meme.bindEvents);

  });
});
