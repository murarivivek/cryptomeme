var mysql=require('mysql');
/*var mysqlModel = require('mysql-model');
var MyAppModel = mysqlModel.createPool({
  host     : 'localhost',
  user     : 'root',
  password : 'pg02032016',
  database : 'cryptomeme',
});*/
var connection=mysql.createPool({ 
	host:'localhost',
	user:'root',
 	password:'',
	database:'cryptomeme'
});
/*exports.connection = connection;
exports.MyAppModel = MyAppModel;*/
 module.exports=connection;
/* module.exports =*/

 
