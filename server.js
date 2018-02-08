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

app.get('/', function (req, res) {
  res.render('index');
})

app.get('/ranking', function(req,res){
	responseJson = {};
	MemeModel.getRanking(function(err,rows){
		if(err)
		{
	  		responseJson = JSON.stringify(err);
	  	}
	  	else{
	  		responseJson = JSON.stringify(rows);
	  	}
	  	res.render('ranking',{
			rankings : responseJson
		});
	});
})

app.get('/user/*', function (req, res) {
  res.render('index')
})

app.get('/meme/:id',function(req,res){
	responseJson = {};
	
	MemeModel.getMemeById(req.params.id,function(err, result){
		if(err)
		{
	  		response = err;
	  	}
	  	else{
	  		response = result;
	  	}
		res.render('meme',{
			meme : result
		});
	});
})

app.listen(3000, function () {
  console.log('Crypto Meme app listening on port 3000!')
})

app.get('/memes', function(req, res){

 	pageNum = req.body.page;
 	sortBy = req.body.sort;
 	sortOrder = req.body.sortOrder;
 	searchTerm = req.body.search;
 	if(sortBy == undefined){
 		sortBy = 'created';
 	}
 	
 	if(sortOrder == 'asc'){
 		sortOrder = 'asc';
 	}else{
 		sortOrder = 'desc';
 	}
 	if(pageNum == undefined){
 		pageNum = 0;
 	}
 	
 	perPageCount = 200

 	responseJson = {}
	MemeModel.getAllMemes(pageNum, perPageCount, sortBy, sortOrder, searchTerm,function(err,rows){
	 	
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
	  		res.json(rows);
	  	}
	});
})


app.use(function(req, res) {
    res.redirect('/');
});