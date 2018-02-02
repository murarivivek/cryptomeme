const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const MemeModel=require('./models/Meme');

app.set('view engine', 'ejs')
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.render('index')
})

app.get('/user/*', function (req, res) {
  res.render('index')
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


	MemeModel.getAllMemes(pageNum, 20, sortBy, sortOrder, searchTerm,function(err,rows){
	 	
		if(err)
		{
	  		res.json(err);
	  	}
	  	else{
	  		res.json(rows);
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