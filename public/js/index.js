var Index = {

  init: function() {
    if(window.location.search == ''){
      Index.getSortedMemes(1, 'All Memes', true);
    }else{
      $("#dropdownMenuButton").text(Index.getUrlParam('sort'));
      Index.getSortedMemes(Index.getUrlParam('page'), Index.getUrlParam('sort'), true);
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
    $(document).on('click', '.btn-buy', Index.handleAdopt);
    $("#btn-modal").click(function(){
        $("#ShowModal").modal();
    });
    $(".dropdown-item").click(function(event){
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
                  var ownerDisplay = memes[i].username.length>20?memes[i].username.substring(0,20)+'...':memes[i].username;
                }else{
                  ownerDisplay = "NoOwner";
                }
        memeTemplate.find('.meme-link').attr('href', '/meme/'+memes[i].id);
        memeTemplate.find('.owner').html('<a href="/user/'+memes[i].username+'">'+ownerDisplay+'</a>');
        var price = (memes[i].price+ 0.00000049).toFixed(6);
        memeTemplate.find('.price').text(price);
        memeTemplate.find('.price').attr('data-trueval', price);
        memeTemplate.find('.pet-location').text(memes[i].location);
        memeTemplate.find('.btn-buy').attr('data-id', memes[i].id);
        petsRow.append(memeTemplate.html());
      }
      $(".loader").hide();
      if(buildPagination){
        return Index.pagination(data.total_page_count);
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
        App.init(Index.init);
  });
});
