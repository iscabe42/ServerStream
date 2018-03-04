var puerto = (process.env.VCAP_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');

var express = require('express');  
var app = express();  
var server = require('http').Server(app);  
var io = require('socket.io')(server);

var messages = [{  
  id: 1,
  text: "Hola soy un mensaje",
  author: "xx xx xx"
}];

app.use(express.static('public'));

app.get('/hello', function(req, res) {  
  res.status(200).send("Hello World!");
});


var espacio="Inndot";
var nsp = io.of('/'+espacio);
 
nsp.on("connection", arranque); 
var usuarios_c=new Array(); 
function arranque(espacio_n){ 
	console.log("Nuevo usuario en espacio("+espacio+")"); 
	
	espacio_n.on("conectarse",coon); 
	espacio_n.on("desc_usr",desc_usr);
	
	function desc_usr(room,idsk,minombre){//desconectar de room
		
		console.log("desc---"+room);
	
		
	 var busca_usr=usuarios_c.indexOf(idsk);
		 usuarios_c.splice(busca_usr,1);

		 nsp.in(room).emit("user_des1",idsk,minombre);
		espacio_n.leave(room);
		console.log("desconectado--"+idsk);
		
	} 
	function coon(roomm,usr_nom,rol){//conectar a room
	var idsocket=espacio_n.id;	
	usuarios_c.push(idsocket);
	
	console.log("conectado a la sala:("+roomm+")");
	console.log("id:("+idsocket+")");
		espacio_n.join(roomm);
		espacio_n.emit("mediador_conectado",roomm,idsocket,usr_nom,rol); 
	}
	
	espacio_n.on("img_mediador", enviar); 
	function enviar(dato,room,id_sk,nom_usr,rol){ //recibe imagen y la envia a usuraios
		//console.log("sock--recid-con img-"+id_sk);
			var busca_usr=usuarios_c.indexOf(id_sk);
		if(busca_usr>=0){
			espacio_n.join(room);
			nsp.in(room).emit("mediador",dato,id_sk,nom_usr,rol);
		}else{
			console.log("no es encuentra en la sala");
		
		}
	 
	}
	
	espacio_n.on("swicth_stream", sw_stream);
	function sw_stream(room,sk_sw){//para todos
		espacio_n.join(room);
		nsp.in(room).emit("switch_stream_p",sk_sw);
		
		console.log("sala-"+room+"-id socket--"+sk_sw);
	}
	espacio_n.on("chat_mediacion",chat_conf);
	function chat_conf(room,mensaje,msjTipo,id_sk,u_nombre){
		espacio_n.join(room);
		nsp.in(room).emit("recibe_chat",mensaje,msjTipo,id_sk,u_nombre);		
	}
	//------- transmitir audio ---------------------------
	espacio_n.on("audio_emit",audio_emit);
	function audio_emit(room,numero){
		espacio_n.join(room);
		espacio_n.broadcast.to(room).emit("audio_activo",numero);		
		//nsp.in(room).emit("audio_activo",numero);		
	}
	espacio_n.on("audio_stop",audio_stop);
	function audio_stop(room,status){
		espacio_n.join(room);
		//espacio_n.broadcast.to(room).emit("audio_detenido",status);		
		nsp.in(room).emit("audio_detenido",status);		
	}
	//------fin- transmitir audio ------------------------
	
 }


server.listen(puerto, function() {  
  console.log("Servidor corriendo en:"+host+ "--puerto--"+puerto);
});