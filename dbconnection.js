var mysql=require('mysql');
var connection=mysql.createPool({ 
	host:'localhost',
	user:'root',
 	password:'pg02032016',
	database:'cryptomeme'
});
 module.exports=connection;