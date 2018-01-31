var db=require('../dbconnection');

var Meme={
 
getAllMemes:function(callback){
 
return db.query("Select id, name, image_url, price,username from meme inner join meme_ownership on meme_ownership.meme_id=meme.id inner join user on user.wallet_address=meme_ownership.wallet_address",callback);
 
},
createUsername:function(callback){

},
getAllMemesByOwner:function(name, callback){
	return db.query("Select id, name, image_url, price,username from meme inner join meme_ownership on meme_ownership.meme_id=meme.id inner join user on user.wallet_address=meme_ownership.wallet_address and username=?",[name],callback);	
}

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
module.exports=Meme;