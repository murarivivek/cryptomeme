var Index = {

  init: function() {
    Index.userConnectedMessage();
    if(window.location.search == ''){
      Index.getSortedMemes(1, 'All Memes', true);
    }else{
      $("#dropdownMenuButton").text(Index.getUrlParam('sort'));
      Index.getSortedMemes(Index.getUrlParam('page'), Index.getUrlParam('sort'), true);
    }
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

  getUrlParam: function(sParam){
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
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

  pagination: function(pageCount) {
    $(".pagination").html('');
    $(".pagination").append('<li class="page-item"><a class="page-link" href="#">Previous</a></li>');
    for(i=1;i<=pageCount;i++){
      $(".pagination").append('<li class="page-item"><a class="page-link" href="#">'+i+'</a></li>');
    }
    $(".pagination").append('<li class="page-item"><a class="page-link" href="#">Next</a></li>');
    $(".page-item").removeClass("Active");
    $(".page-item").eq(Index.getUrlParam('page')).addClass("Active");
    return Index.bindEvents();
  },

  bindEvents: function() {
    $(".sort-dropdown").click(function(event){
        event.preventDefault();
        if($("#dropdownMenuButton").val() != $(this).text()){
          $("#dropdownMenuButton").text($(this).text());
          $("#dropdownMenuButton").val($(this).text());
          Index.getSortedMemes(1, $(this).text(), true);
        }
    });
    $(".page-link").click(function(event){
      event.preventDefault();
      if($(this).text() != 'Previous' && $(this).text() != 'Next'){
        $(".page-item").removeClass("Active");
        $(".page-item").eq($(this).text()).addClass("Active");
        Index.getSortedMemes($(this).text(), $("#dropdownMenuButton").text(), false);
      }else if($(this).text() == 'Previous'){
        currPage = parseInt(Index.getUrlParam('page'));
        if(currPage != 1){
          $(".page-item").removeClass("Active");
          $(".page-item").eq(currPage-1).addClass("Active");
          Index.getSortedMemes(currPage-1, $("#dropdownMenuButton").text(), false);
        }
      }else if($(this).text() == 'Next'){
        currPage = parseInt(Index.getUrlParam('page'));
        if(currPage < $('.page-link').length-2){
          $(".page-item").removeClass("Active");
        $(".page-item").eq(currPage+1).addClass("Active");
          Index.getSortedMemes(currPage+1, $("#dropdownMenuButton").text(), false);
        }
      }
    });
    $(document).on('click', '.btn-buy', Index.showBuyModal);
    $("#buyMeme").click(function(event){
        Index.handleAdopt($("#buyMeme").attr("data-id"),$("#memeBuyPrice").val());
    });
  },

  getMemeParamsUrl: function(page, sort){
    sortBy = 'created';
    sortOrder = 'desc';
    if(sort == 'Highest Priced'){
      sortBy = 'price';
      sortOrder = 'desc';
    }else if(sort == 'Lowest Priced'){
      sortBy = 'price';
      sortOrder = 'asc';
    }else if(sort == 'Newest'){
      sortBy = 'created';
      sortOrder = 'desc';
    }else if(sort == 'Popular'){
      sortBy = 'popular';
      sortOrder = 'desc';
    }
    return '?sortBy='+sortBy+'&sortOrder='+sortOrder+'&page='+page;
  },

  getSortedMemes: function(page, sort, buildPagination){
    // Load memes.
    var url = '/memes';
    searchParams = Index.getMemeParamsUrl(page, sort);
    if(sort == undefined){
      sort = 'All Memes';
    }
    
    var petsRow = $('#memeRow');
    var memeTemplate = $('#memeTemplate');
    petsRow.html("");
    $(".loader").show();
    window.history.replaceState(null, null, window.location.pathname+'?page='+page+'&sort='+sort);
    $.getJSON(url+searchParams, function(data) {
      memes = data.memes;
      for (i = 0; i < memes.length; i ++) {
        memeTemplate.find('.card-title').text(memes[i].name);
        memeTemplate.find('img').attr('src', memes[i].image_url);
        if(memes[i].username){
                  ownerDisplay = (memes[i].username==memes[i].wallet_address)?memes[i].username.substring(0,8):memes[i].username;
                  ownerDisplay = ownerDisplay.length>20?ownerDisplay.substring(0,20)+'...':ownerDisplay;
                }else{
                  ownerDisplay = "NoOwner";
                }
        memeTemplate.find('.meme-link').attr('href', '/meme/'+memes[i].id);
        memeTemplate.find('.owner').html('<a href="/user/'+memes[i].wallet_address+'">'+ownerDisplay+'</a>');
        memeTemplate.find('.price').attr('data-trueval', (memes[i].price+0.000001).toFixed(10));
        var price = (memes[i].price+ 0.00000049).toFixed(6);
        memeTemplate.find('.price').text(price);
        memeTemplate.find('.btn-buy').attr('data-id', memes[i].id);
        petsRow.append(memeTemplate.html());
      }
      $(".loader").hide();
      if(buildPagination){
        return Index.pagination(data.total_page_count);
      }
    });
    
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
        App.init(Index.init);
  });
});
