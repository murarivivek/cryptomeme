var db =require('../dbconnection');
/*var db = conn.connection;
var MyAppModel = conn.MyAppModel;

var MemeDBModel = MyAppModel.extend({
    tableName: "meme",
});
 */

var Meme={
 
getAllMemes:function(rangeStart, count, sortBy, sortOrder, searchTerm,callback){
sortColumn = 'meme.created_time';
if(sortBy == 'price'){
	sortColumn = 'price';
}else if(sortBy == 'popular'){
	sortColumn = 'transactions_count';
}
if(searchTerm == '' || searchTerm == undefined){
	return db.query("Select id, name, image_url, price,username, transactions_count from meme inner join meme_ownership on meme_ownership.meme_id=meme.id inner join user on user.wallet_address=meme_ownership.wallet_address order by "+ db.escapeId(sortColumn) + " " + sortOrder + " limit " + rangeStart + "," + count, callback);
}else{
	searchTerm = '%'+searchTerm+'%';
	return db.query("Select id, name, image_url, price,username, transactions_count from meme inner join meme_ownership on meme_ownership.meme_id=meme.id inner join user on user.wallet_address=meme_ownership.wallet_address where name like ? order by "+ db.escapeId(sortColumn) + " " + sortOrder + " limit " + rangeStart + "," + count, [searchTerm],callback);
}
 
},
getTotalMemeCount:function(searchTerm, callback){
	if(searchTerm == '' || searchTerm == undefined){
		return db.query("Select count(id) as total_meme_count from meme",callback);
	}else{
		searchTerm = '%'+searchTerm+'%';
	return db.query("Select count(id) as total_meme_count where name like ?", [searchTerm],callback);
	}
},
getAllMemesByOwner:function(name, callback){
	return db.query("Select id, name, image_url, price,username from meme inner join meme_ownership on meme_ownership.meme_id=meme.id inner join user on user.wallet_address=meme_ownership.wallet_address and username=?",[name],callback);	
},

getMemeById:function(id,callback){
	return db.query("Select id, name, description, image_url, price,username, transactions_count from meme inner join meme_ownership on meme_ownership.meme_id=meme.id inner join user on user.wallet_address=meme_ownership.wallet_address and id=? limit 1",[id],callback);
},
getRanking:function(callback){
	return db.query("select username, sum(price) as worth, count(meme_id) as memecount from meme_ownership inner join user on meme_ownership.wallet_address = user.wallet_address group by meme_ownership.wallet_address order by worth desc limit 100;",callback);
},

/*,
 getTaskById:function(id,callback){
 
return db.query("select * from task where Id=?",[id],callback);
 },
 addTask:function(Task,callback){
 return db.query("Insert into task values(?,?,?)",[Task.Id,Task.Title,Task.Status],callback);
 },
 deleteTask:function(id,callback){
  return db.query("delete from task where Id=?",[id],callback);
 },
 updateTask:function(id,Task,callback){
  return db.query("update task set Title=?,Status=? where Id=?",[Task.Title,Task.Status,id],callback);
 }x
*/ 
};
/*var memeDBModel = new MemeDBModel();
exports.Meme=Meme;
exports.memeDBModel = memeDBModel;*/
module.exports = Meme;