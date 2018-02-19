var Connection = {

  init: function() {
    Connection.userConnectedMessage();
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
  }

};

$(function() {
  $(document).ready(function() {
        App.init(Connection.init);
  });
});