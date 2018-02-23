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
	return db.query("Select id, name, image_url, price,username, transactions_count, user.wallet_address from meme inner join meme_ownership on meme_ownership.meme_id=meme.id inner join user on user.wallet_address=meme_ownership.wallet_address where meme.status=1 order by "+ db.escapeId(sortColumn) + " " + sortOrder + ", id limit " + rangeStart + "," + count, callback);
}else{
	searchTerm = '%'+searchTerm+'%';
	return db.query("Select id, name, image_url, price,username, transactions_count from meme inner join meme_ownership on meme_ownership.meme_id=meme.id inner join user on user.wallet_address=meme_ownership.wallet_address where name like ? and meme.status=1 order by "+ db.escapeId(sortColumn) + " " + sortOrder + " limit " + rangeStart + "," + count, [searchTerm],callback);
}
 
},
getTotalMemeCount:function(searchTerm, callback){
	if(searchTerm == '' || searchTerm == undefined){
		return db.query("Select count(id) as total_meme_count from meme where meme.status=1",callback);
	}else{
		searchTerm = '%'+searchTerm+'%';
	return db.query("Select count(id) as total_meme_count where name like ? and meme.status=1", [searchTerm],callback);
	}
},
getAllMemesByOwner:function(wallet_address, callback){
	return db.query("Select id, name, image_url, price,username, user.wallet_address from meme inner join meme_ownership on meme_ownership.meme_id=meme.id inner join user on user.wallet_address=meme_ownership.wallet_address and user.wallet_address=? where meme.status=1",[wallet_address],callback);	
},

getMemeById:function(id,callback){
	return db.query("Select id, name, description, user.wallet_address, image_url, price,username, transactions_count from meme inner join meme_ownership on meme_ownership.meme_id=meme.id inner join user on user.wallet_address=meme_ownership.wallet_address and id=? and meme.status=1 limit 1",[id],callback);
},
getRanking:function(callback){
	return db.query("select username, user.wallet_address, sum(price) as worth, count(meme_id) as memecount from meme_ownership inner join user on meme_ownership.wallet_address = user.wallet_address inner join meme on meme.id=meme_ownership.meme_id and meme.status=1 group by meme_ownership.wallet_address order by worth desc limit 100;",callback);
},
getRankingActive:function(callback){
	return db.query("select username, user.wallet_address, count(ownership_transfer_log.to_address) as transaction_count from user inner join ownership_transfer_log on ownership_transfer_log.to_address = user.wallet_address inner join meme on meme.id=ownership_transfer_log.meme_id and meme.status=1 group by user.wallet_address order by transaction_count desc limit 100", callback);
},
getUserDetails:function(wallet_address, callback){
	return db.query("select username, user.wallet_address, memes_owned, worth, count(ownership_transfer_log.to_address) as transaction_count from (Select username, user.wallet_address, count(meme_ownership.meme_id) as memes_owned, sum(meme_ownership.price)  as worth from user left join meme_ownership on user.wallet_address=meme_ownership.wallet_address where user.wallet_address=? group by user.wallet_address) as user left join ownership_transfer_log on user.wallet_address=ownership_transfer_log.to_address group by user.wallet_address",[wallet_address],callback);
},
getAllMemesByRandom:function(callback){
	return db.query("Select id, name, image_url, price,username, transactions_count, user.wallet_address from meme inner join meme_ownership on meme_ownership.meme_id=meme.id inner join user on user.wallet_address=meme_ownership.wallet_address and meme.status=1 order by rand() limit 0,16", callback);
},

};

module.exports = Meme;