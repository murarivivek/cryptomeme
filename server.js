const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const MemeModel = require('./models/Meme');
/*var memeModelExport = require('./models/Meme');
const Meme=memeModelExport.memeDBModel;
const MemeModel = memeModelExport.Meme;*/
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.set('view engine', 'ejs')
app.use(express.static('public'));

app.get('/market', function (req, res) {
  res.render('index');
})

app.get('/', function (req, res) {
  res.render('homepage');
})

app.get('/ranking', function(req,res){
	responseJson = {};
	MemeModel.getRanking(function(err,rows){
		if(err)
		{
	  		responseJson.networth = JSON.stringify(err);
	  	}
	  	else{
	  		responseJson.networth = JSON.stringify(rows);
	  	}
	  	MemeModel.getRankingActive(function(err, rows){
		  	if(err){
		  		responseJson.active = JSON.stringify(err);
		  	}else{
		  		responseJson.active = JSON.stringify(rows);
		  	}
		  	res.render('ranking',{
				networth : responseJson.networth,
				active : responseJson.active
			});
	  	});
	});
})

app.get('/user/:id', function (req, res) {
  MemeModel.getUserDetails(req.params.id, function(err, result){

  	if(result.length == 0){
  		result = [];
  		user = {};
  		user.wallet_address = req.params.id;
  		user.username = req.params.id;
  		user.memes_owned = 0;
  		user.transaction_count = 0;
  		user.worth = 0;
  		result[0] = user;
  	}
	res.render('user',{
		user : result
	});
  });
  
})

app.get('/meme/:id',function(req,res){
	MemeModel.getMemeById(req.params.id,function(err, result){
		if(result.length==0){
			res.redirect('/market');
		}else{
			res.render('meme',{
				meme : result
			});
		}
	});
})

app.listen(3000, function () {
  console.log('Crypto Meme app listening on port 3000!')
})

app.get('/api/meme/:id', function(req, res){
		 	responseJson = {}
		MemeModel.getMemeById(req.params.id,function(err, result){
		if(err){
			responseJson.meme =  JSON.parse(JSON.stringify(err));
		}else{
			responseJson =  JSON.parse(JSON.stringify(result));
			if(responseJson[0])
			responseJson[0].image_url = "https://cryptomemes.lol"+responseJson[0].image_url;

		}
			  			res.send(responseJson);
	});


})

app.get('/memes', function(req, res){
 	pageNum = req.query.page;
 	sortBy = req.query.sortBy;
 	sortOrder = req.query.sortOrder;
 	searchTerm = req.query.search;
 	if(sortBy == undefined){
 		sortBy = 'created';
 	}
 	
 	if(sortOrder == 'asc'){
 		sortOrder = 'asc';
 	}else{
 		sortOrder = 'desc';
 	}
 	perPageCount = 16;
 	rangeStart = 0;
 	if(pageNum != undefined){
 		rangeStart = perPageCount*(pageNum-1);
 	}

 	responseJson = {}
	MemeModel.getAllMemes(rangeStart, perPageCount, sortBy, sortOrder, searchTerm,function(err,rows){
	 	
		if(err)
		{
	  		responseJson.memes =  JSON.parse(JSON.stringify(err));
	  	}
	  	else{

	  		responseJson.memes =  JSON.parse(JSON.stringify(rows));
	  		MemeModel.getTotalMemeCount(searchTerm, function(err,rows){
	  			
	  			if(err){
	  				responseJson.total_page_count = 0;
	  			}else{
	  				responseJson.total_page_count = Math.ceil(rows[0].total_meme_count/perPageCount);
	  			}
	  			res.send(responseJson)
	  		});
	  	}

	});

})

app.get('/usermemes/:name', function(req,res){

	MemeModel.getAllMemesByOwner(req.params.name, function(err,rows){
	 
		if(err)
		{
	  		res.json(err);
	  	}
	  	else{
	  		if(rows.length == 0){
	  			MemeModel.getAllMemesByRandom(function(err,rows){
	  				if(err){
	  					res.json(err);
	  				}else{
	  					res.json(rows);
	  				}
	  			});
	  		}else{
	  			res.json(rows);
	  		}
	  	}
	});
})

app.get('/faq', function (req, res) {
  res.render('faq');
})

app.get('/privacy-policy', function (req, res) {
  res.render('privacy-policy');
})

app.get('/contact', function (req, res) {
  res.render('contact');
})

app.get('/suggestmeme', function (req, res) {
  res.render('suggestmeme');
})

app.get('/terms-of-service', function (req, res) {
  res.render('terms-of-service');
})

app.use(function(req, res) {
    res.redirect('/');
});