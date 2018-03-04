// Muaz Khan      - www.MuazKhan.com
// MIT License    - www.WebRTC-Experiment.com/licence
// Documentation  - github.com/muaz-khan/RTCMultiConnection
//jueves 16 de noiembre del 2017 sin cambios solo comentario
//domingo 26 de noiembre del 2017 sin cambios solo comentario
//lunes 4 de diciembre del 2017 sin cambios solo comentario
//martes 6 de febrero del 2018 sin cambios solo comentario
//jueves 22 de febrero del 2018 sin cambios solo comentario
var port = process.env.PORT || 9001;
var contenedorInbox40=[];
var usuariosConectados=[];
var salasPrivadas=[];
var horaini;
//---------------------------------------------------
var http=require('http'); 
var io=require('socket.io');
//---------------------------------------------------


function resolveURL(url) {
    var isWin = !!process.platform.match(/^win/);
    if (!isWin) return url;
    return url.replace(/\//g, '\\');
}

// Please use HTTPs on non-localhost domains.
var isUseHTTPs = false;

// var port = 443;


var fs = require('fs');
var path = require('path');

// see how to use a valid certificate:
// https://github.com/muaz-khan/WebRTC-Experiment/issues/62
var options = {
    key: fs.readFileSync(path.join(__dirname, resolveURL('fake-keys/privatekey.pem'))),
    cert: fs.readFileSync(path.join(__dirname, resolveURL('fake-keys/certificate.pem')))
};

// force auto reboot on failures
var autoRebootServerOnFailure = false;


// skip/remove this try-catch block if you're NOT using "config.json"
try {
    var config = require(resolveURL('./config.json'));

    if ((config.port || '').toString() !== '9001') {
        port = parseInt(config.port);
    }

    if ((config.autoRebootServerOnFailure || '').toString() !== true) {
        autoRebootServerOnFailure = true;
    }
} catch (e) {}

// You don't need to change anything below

var server = require(isUseHTTPs ? 'https' : 'http');
var url = require('url');

function serverHandler(request, response) {
    try {
        var uri = url.parse(request.url).pathname,
            filename = path.join(process.cwd(), uri);

        if (filename && filename.search(/server.js|Scalable-Broadcast.js|Signaling-Server.js/g) !== -1) {
            response.writeHead(404, {
                'Content-Type': 'text/plain'
            });
            response.write('404 Not Found: ' + path.join('/', uri) + '\n');
            response.end();
            return;
        }

        var stats;

        try {
            stats = fs.lstatSync(filename);

            if (filename && filename.search(/demos/g) === -1 && stats.isDirectory()) {
                response.writeHead(200, {
                    'Content-Type': 'text/html'
                });
                response.write('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/demos/"></head><body></body></html>');
                response.end();
                return;
            }
        } catch (e) {
            response.writeHead(404, {
                'Content-Type': 'text/plain'
            });
            response.write('404 Not Found: ' + path.join('/', uri) + '\n');
            response.end();
            return;
        }

        if (fs.statSync(filename).isDirectory()) {
            response.writeHead(404, {
                'Content-Type': 'text/html'
            });

            if (filename.indexOf(resolveURL('/demos/MultiRTC/')) !== -1) {
                filename = filename.replace(resolveURL('/demos/MultiRTC/'), '');
                filename += resolveURL('/demos/MultiRTC/index.html');
            } else if (filename.indexOf(resolveURL('/demos/')) !== -1) {
                filename = filename.replace(resolveURL('/demos/'), '');
                filename += resolveURL('/demos/index.html');
            } else {
                filename += resolveURL('/demos/index.html');
            }
        }

        var contentType = 'text/plain';
        if (filename.toLowerCase().indexOf('.html') !== -1) {
            contentType = 'text/html';
        }
        if (filename.toLowerCase().indexOf('.css') !== -1) {
            contentType = 'text/css';
        }
        if (filename.toLowerCase().indexOf('.png') !== -1) {
            contentType = 'image/png';
        }

        fs.readFile(filename, 'binary', function(err, file) {
            if (err) {
                response.writeHead(500, {
                    'Content-Type': 'text/plain'
                });
                response.write('404 Not Found: ' + path.join('/', uri) + '\n');
                response.end();
                return;
            }

            try {
                var demos = (fs.readdirSync('demos') || []);

                if (demos.length) {
                    var h2 = '<h2 style="text-align:center;display:block;"><a href="https://www.npmjs.com/package/rtcmulticonnection-v3"><img src="https://img.shields.io/npm/v/rtcmulticonnection-v3.svg"></a><a href="https://www.npmjs.com/package/rtcmulticonnection-v3"><img src="https://img.shields.io/npm/dm/rtcmulticonnection-v3.svg"></a><a href="https://travis-ci.org/muaz-khan/RTCMultiConnection"><img src="https://travis-ci.org/muaz-khan/RTCMultiConnection.png?branch=master"></a></h2>';
                    var otherDemos = '<section class="experiment" id="demos"><details><summary style="text-align:center;">Check ' + (demos.length - 1) + ' other RTCMultiConnection-v3 demos</summary>' + h2 + '<ol>';
                    demos.forEach(function(f) {
                        if (f && f !== 'index.html' && f.indexOf('.html') !== -1) {
                            otherDemos += '<li><a href="/demos/' + f + '">' + f + '</a> (<a href="https://github.com/muaz-khan/RTCMultiConnection/tree/master/demos/' + f + '">Source</a>)</li>';
                        }
                    });
                    otherDemos += '<ol></details></section><section class="experiment own-widgets latest-commits">';

                    file = file.replace('<section class="experiment own-widgets latest-commits">', otherDemos);
                }
            } catch (e) {}

            try {
                var docs = (fs.readdirSync('docs') || []);

                if (docs.length) {
                    var html = '<section class="experiment" id="docs">';
                    html += '<details><summary style="text-align:center;">RTCMultiConnection Docs</summary>';
                    html += '<h2 style="text-align:center;display:block;"><a href="http://www.rtcmulticonnection.org/docs/">http://www.rtcmulticonnection.org/docs/</a></h2>';
                    html += '<ol>';

                    docs.forEach(function(f) {
                        if (f.indexOf('DS_Store') == -1) {
                            html += '<li><a href="https://github.com/muaz-khan/RTCMultiConnection/tree/master/docs/' + f + '">' + f + '</a></li>';
                        }
                    });

                    html += '</ol></details></section><section class="experiment own-widgets latest-commits">';

                    file = file.replace('<section class="experiment own-widgets latest-commits">', html);
                }
            } catch (e) {}

            response.writeHead(200, {
                'Content-Type': contentType
            });
            response.write(file, 'binary');
            response.end();
        });
    } catch (e) {
        response.writeHead(404, {
            'Content-Type': 'text/plain'
        });
        response.write('<h1>Unexpected error:</h1><br><br>' + e.stack || e.message || JSON.stringify(e));
        response.end();
    }
}

var app;

if (isUseHTTPs) {
    app = server.createServer(options, serverHandler);
} else {
    app = server.createServer(serverHandler);
}

function cmd_exec(cmd, args, cb_stdout, cb_end) {
    var spawn = require('child_process').spawn,
        child = spawn(cmd, args),
        me = this;
    me.exit = 0;
    me.stdout = "";
    child.stdout.on('data', function(data) {
        cb_stdout(me, data)
    });
    child.stdout.on('end', function() {
        cb_end(me)
    });
}

function log_console() {
    console.log(foo.stdout);

    try {
        var pidToBeKilled = foo.stdout.split('\nnode    ')[1].split(' ')[0];
        console.log('------------------------------');
        console.log('Please execute below command:');
        console.log('\x1b[31m%s\x1b[0m ', 'kill ' + pidToBeKilled);
        console.log('Then try to run "server.js" again.');
        console.log('------------------------------');

    } catch (e) {}
}

function runServer() {
    app.on('error', function(e) {
        if (e.code == 'EADDRINUSE') {
            if (e.address === '0.0.0.0') {
                e.address = 'localhost';
            }

            var socketURL = (isUseHTTPs ? 'https' : 'http') + '://' + e.address + ':' + e.port + '/';

            console.log('------------------------------');
            console.log('\x1b[31m%s\x1b[0m ', 'Unable to listen on port: ' + e.port);
            console.log('\x1b[31m%s\x1b[0m ', socketURL + ' is already in use. Please kill below processes using "kill PID".');
            console.log('------------------------------');

            foo = new cmd_exec('lsof', ['-n', '-i4TCP:9001'],
                function(me, data) {
                    me.stdout += data.toString();
                },
                function(me) {
                    me.exit = 1;
                }
            );

            setTimeout(log_console, 250);
        }
    });

    app = app.listen(port, process.env.IP || '0.0.0.0', function(error) {
        var addr = app.address();

        if (addr.address === '0.0.0.0') {
            addr.address = 'localhost';
        }

        var domainURL = (isUseHTTPs ? 'https' : 'http') + '://' + addr.address + ':' + addr.port + '/';

        console.log('------------------------------');

        console.log('socket.io is listening at:');
        console.log('\x1b[31m%s\x1b[0m ', '\t' + domainURL);

        console.log('\n');

        console.log('Your web-browser (HTML file) MUST set this line:');
        console.log('\x1b[31m%s\x1b[0m ', 'connection.socketURL = "' + domainURL + '";');

        if (addr.address != 'localhost' && !isUseHTTPs) {
            console.log('Warning:');
            console.log('\x1b[31m%s\x1b[0m ', 'Please set isUseHTTPs=true to make sure audio,video and screen demos can work on Google Chrome as well.');
        }

        console.log('------------------------------');
        console.log('Need help? http://bit.ly/2ff7QGk');
		
	
    });

    require('./Signaling-Server.js')(app, function(socket) {
        try {
            var params = socket.handshake.query;

            // "socket" object is totally in your own hands!
            // do whatever you want!

            // in your HTML page, you can access socket as following:
            // connection.socketCustomEvent = 'custom-message';
            // var socket = connection.getSocket();
            // socket.emit(connection.socketCustomEvent, { test: true });

            if (!params.socketCustomEvent) {
                params.socketCustomEvent = 'custom-message';
            }
			//------------------switch videos a todos--------------------------
            socket.on("chat_e",function(sala,quien,nombre_us,mensaje,color,colorusr){
				socket.join(sala);
				socket.broadcast.to(sala).emit('chat_r',quien,nombre_us,mensaje,color,colorusr);
				socket.emit('chat_r',quien,nombre_us,mensaje,color,colorusr);
				
				}
			); 
			socket.on("imagen-modelo",function(sala,imagen){
				socket.join(sala);
				socket.broadcast.to(sala).emit('img_mod',imagen);
				socket.emit('img_mod',imagen);
				
				}
			);
			socket.on("des_conectarme",function(sala,nombre,rol){
				console.log("ddeeeeeeee");
				socket.join(sala);
				socket.broadcast.to(sala).emit('usuario_des_conectado',nombre,rol);
				socket.emit('usuario_des_conectado',nombre,rol);
				
				}
			); 
			socket.on("conectar_usuario",function(sala){
				socket.join(sala);
				}
			);
			socket.on("chat_mediacion",chat_conf);
			function chat_conf(room,mensaje,msjTipo,id_sk,u_nombre){
			
				socket.join(room);
				socket.broadcast.to(room).emit('recibe_chat',mensaje,msjTipo,id_sk,u_nombre);
				socket.emit('recibe_chat',mensaje,msjTipo,id_sk,u_nombre);
			}
			
			
			//--------------------- Chat publico --------------
			socket.on("verifica_disponibilidad",verificausuario);
			function verificausuario(sala){
				socket.emit('verificacion_chat_rp',usuariosConectados);
			}
			socket.on("conectar_chat_publico",conectar_chat_public);
			function conectar_chat_public(room,nickname,misexo){
				
				function existeuser(){
					for(var esc=0;esc<usuariosConectados.length;esc++){
							if((usuariosConectados[esc][1])===nickname){
								return true;
							}
						}
						return false;
					}
				    if(usuariosConectados.length>0){
						if(existeuser()){
							socketemit();	
						}else{
							usuariosConectados.push([room,nickname,misexo,new Date()]);
							socketemit();
						}
					}
					else{
						usuariosConectados.push([room,nickname,misexo,new Date()]);
						socketemit();
					}
				
				function socketemit(){
					socket.join(room);
					
					socket.broadcast.to(room).emit('actualizaLocal_chat_rp',contenedorInbox40);
					socket.emit('actualizaLocal_chat_rp',contenedorInbox40);
					
					
					socket.broadcast.to(room).emit('usuarios_chat_rp',usuariosConectados);
					socket.emit('usuarios_chat_rp',usuariosConectados);					
				}

				
			}
			var dejarEscribir;
			
			socket.on("escribiendo",function(room,nickname,estatus){
					if(dejarEscribir){
						clearTimeout(dejarEscribir);
					}
					dejarEscribir=	setTimeout(function(){
									desjaEscribir(room,nickname);
									},2000);
									
							socket.join(room);
							socket.broadcast.to(room).emit('usrescribiendo',room,nickname,estatus);
							socket.emit('usrescribiendo',room,nickname,estatus);
			});
			
			function desjaEscribir(room,nickname){
						socket.join(room);
							socket.broadcast.to(room).emit('dejaescribir',nickname);
							socket.emit('dejaescribir',nickname);
			}
			
			socket.on("chat_publico",chat_public);
			function chat_public(room,mensaje,nickname,misexo,horamensaje){
				horaini=new Date();
				if((mensaje!=="")&&(mensaje!==null)&&(mensaje!==0)){
					contenedorInbox40.push([misexo,nickname,mensaje,horamensaje]);
					if(contenedorInbox40.length===20){
						contenedorInbox40.splice(0,1);
					}
				socket.join(room);
				socket.broadcast.to(room).emit('chat_rp',misexo,nickname,mensaje,horamensaje);
				socket.emit('chat_rp',misexo,nickname,mensaje,horamensaje);
				}
					
				
			}
			var room;
			socket.on("chat_Privado",function(room,mensaje,nickname,destinatario,misexo,horamensaje){
				socket.join(room);
				socket.broadcast.to(room).emit('msj_puente_privados',mensaje,nickname,destinatario,misexo,horamensaje);
				socket.emit('msj_puente_privados',mensaje,nickname,destinatario,misexo,horamensaje);
			});
			
			socket.on("chat_pPrivados",function(sala,remitente,destinatario,mensaje,sexo,horaMensaje){
				  function existeSala(){
						for(var a=0;a<salasPrivadas.length; a++){
							if(((remitente+destinatario)===salasPrivadas[a][0])||((destinatario+remitente)===salasPrivadas[a][0])){
							return true;
							}
						}
						return false;
					}
				if(salasPrivadas.length>0){
					if(existeSala()){
						for(var a=0;a<salasPrivadas.length; a++){
							if(((remitente+destinatario)===salasPrivadas[a][0])||((destinatario+remitente)===salasPrivadas[a][0])){
						
							room=salasPrivadas[a][0];
							emitPrivado();						
							return true;
							}
						}
						
					}else{
						salasPrivadas.push([remitente+destinatario,mensaje,sexo,horaMensaje]);
						room=remitente+destinatario;
						emitPrivado();						
					}
					
				}else{
					salasPrivadas.push([remitente+destinatario,mensaje,sexo,horaMensaje]);
					room=remitente+destinatario;
					emitPrivado();
				}
				function emitPrivado(){
					socket.join(sala);
					socket.broadcast.to(sala).emit('chat_rpPrivado',remitente,destinatario,mensaje,sexo,horaMensaje);
					socket.emit('chat_rpPrivado',remitente,destinatario,mensaje,sexo,horaMensaje);
				}
			});
			
			//--------------------- Chat publico --------------
			
			
			
			//-------------fin-----switch videos a todos-----------------------
            socket.on(params.socketCustomEvent, function(message) {
                try {
                    socket.broadcast.emit(params.socketCustomEvent, message);
                } catch (e) {}
            });
        } catch (e) {}
    });
}

if (autoRebootServerOnFailure) {
    // auto restart app on failure
    var cluster = require('cluster');
    if (cluster.isMaster) {
        cluster.fork();

        cluster.on('exit', function(worker, code, signal) {
            cluster.fork();
        });
    }

    if (cluster.isWorker) {
        runServer();
    }
} else {
    runServer();
}
horaini=new Date();
setInterval(verificaTiempo,3605000);
			var f;
			function verificaTiempo(){
				f=new Date();
				if((f-horaini)>=3601000){
					contenedorInbox40.length=0;
					usuariosConectados.length=0;
				}
			}
			