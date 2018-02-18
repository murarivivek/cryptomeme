App = {
  web3Provider: null,
  contracts: {},
  metamaskInstalled: true,

  init: function(finalCallBack) {
    return App.initWeb3(finalCallBack);
  },


  initWeb3: function(finalCallBack) {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      $('#noMetaMaskAlert').hide();
      App.web3Provider = web3.currentProvider;
    } else {
      App.metamaskInstalled = false;
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract(finalCallBack);
  },

  initContract: function(finalCallBack) {
    $.getJSON('/MemeToken.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var MemeTokenArtifact = data;
      App.contracts.Meme = TruffleContract(MemeTokenArtifact);

      // Set the provider for our contract
      App.contracts.Meme.setProvider(App.web3Provider);
      if(typeof finalCallBack !== 'undefined'){
        return finalCallBack();
      }
      
    });
  }
};


