// http://127.0.0.1:9001
// http://localhost:9001

//jueves 16 de noiembre del 2017 sin cambios solo comentario
//domingo 26 de noiembre del 2017 sin cambios solo comentario
//lunes 4 de diciembre del 2017 sin cambios solo comentario
//martes 6 de febrero del 2018 sin cambios solo comentario
//jueves 22 de febrero del 2018 sin cambios solo comentario
//lunes 12 de marzo del 2018 sin cambios solo comentario
// miercoles 13 enero 2021 actualizacion de la libreria RTCmulticonection


var contenedorInbox40 = [];
var usuariosConectados = [];
var salasPrivadas = [];
var horaini;



const fs = require('fs');
const path = require('path');
const url = require('url');
var httpServer = require('http');

const ioServer = require('socket.io');
const RTCMultiConnectionServer = require('rtcmulticonnection-server');

var PORT = 9001;
var isUseHTTPs = false;

const jsonPath = {
    config: 'config.json',
    logs: 'logs.json'
};

const BASH_COLORS_HELPER = RTCMultiConnectionServer.BASH_COLORS_HELPER;
const getValuesFromConfigJson = RTCMultiConnectionServer.getValuesFromConfigJson;
const getBashParameters = RTCMultiConnectionServer.getBashParameters;
const resolveURL = RTCMultiConnectionServer.resolveURL;

var config = getValuesFromConfigJson(jsonPath);
config = getBashParameters(config, BASH_COLORS_HELPER);

// if user didn't modifed "PORT" object
// then read value from "config.json"
if (PORT === 9001) {
    PORT = config.port;
}
if (isUseHTTPs === false) {
    isUseHTTPs = config.isUseHTTPs;
}

function serverHandler(request, response) {
    // to make sure we always get valid info from json file
    // even if external codes are overriding it
    // Set CORS headers

    //  response.header("Access-Control-Allow-Origin", "*");
    // response.header("Access-Control-Allow-Headers", "X-Requested-With");
    // next();


    config = getValuesFromConfigJson(jsonPath);
    config = getBashParameters(config, BASH_COLORS_HELPER);

    // HTTP_GET handling code goes below
    try {
        var uri, filename;

        try {
            if (!config.dirPath || !config.dirPath.length) {
                config.dirPath = null;
            }

            uri = url.parse(request.url).pathname;
            filename = path.join(config.dirPath ? resolveURL(config.dirPath) : process.cwd(), uri);
        } catch (e) {
            pushLogs(config, 'url.parse', e);
        }

        filename = (filename || '').toString();

        if (request.method !== 'GET' || uri.indexOf('..') !== -1) {
            try {
                response.writeHead(401, {
                    'Content-Type': 'text/plain'
                });
                response.write('401 Unauthorized: ' + path.join('/', uri) + '\n');
                response.end();
                return;
            } catch (e) {
                pushLogs(config, '!GET or ..', e);
            }
        }

        if (filename.indexOf(resolveURL('/admin/')) !== -1 && config.enableAdmin !== true) {
            try {
                response.writeHead(401, {
                    'Content-Type': 'text/plain'
                });
                response.write('401 Unauthorized: ' + path.join('/', uri) + '\n');
                response.end();
                return;
            } catch (e) {
                pushLogs(config, '!GET or ..', e);
            }
            return;
        }

        var matched = false;
        ['/demos/', '/dev/', '/dist/', '/socket.io/', '/node_modules/canvas-designer/', '/admin/'].forEach(function(item) {
            if (filename.indexOf(resolveURL(item)) !== -1) {
                matched = true;
            }
        });

        // files from node_modules
        ['RecordRTC.js', 'FileBufferReader.js', 'getStats.js', 'getScreenId.js', 'adapter.js', 'MultiStreamsMixer.js'].forEach(function(item) {
            if (filename.indexOf(resolveURL('/node_modules/')) !== -1 && filename.indexOf(resolveURL(item)) !== -1) {
                matched = true;
            }
        });

        if (filename.search(/.js|.json/g) !== -1 && !matched) {
            try {
                response.writeHead(404, {
                    'Content-Type': 'text/plain'
                });
                response.write('404 Not Found: ' + path.join('/', uri) + '\n');
                response.end();
                return;
            } catch (e) {
                pushLogs(config, '404 Not Found', e);
            }
        }

        ['Video-Broadcasting', 'Screen-Sharing', 'Switch-Cameras'].forEach(function(fname) {
            try {
                if (filename.indexOf(fname + '.html') !== -1) {
                    filename = filename.replace(fname + '.html', fname.toLowerCase() + '.html');
                }
            } catch (e) {
                pushLogs(config, 'forEach', e);
            }
        });

        var stats;

        try {
            stats = fs.lstatSync(filename);

            if (filename.search(/demos/g) === -1 && filename.search(/admin/g) === -1 && stats.isDirectory() && config.homePage === '/demos/index.html') {
                if (response.redirect) {
                    response.redirect('/demos/');
                } else {
                    response.writeHead(301, {
                        'Location': '/demos/'
                    });
                }
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

        try {
            if (fs.statSync(filename).isDirectory()) {
                response.writeHead(404, {
                    'Content-Type': 'text/html'
                });

                if (filename.indexOf(resolveURL('/demos/MultiRTC/')) !== -1) {
                    filename = filename.replace(resolveURL('/demos/MultiRTC/'), '');
                    filename += resolveURL('/demos/MultiRTC/index.html');
                } else if (filename.indexOf(resolveURL('/admin/')) !== -1) {
                    filename = filename.replace(resolveURL('/admin/'), '');
                    filename += resolveURL('/admin/index.html');
                } else if (filename.indexOf(resolveURL('/demos/dashboard/')) !== -1) {
                    filename = filename.replace(resolveURL('/demos/dashboard/'), '');
                    filename += resolveURL('/demos/dashboard/index.html');
                } else if (filename.indexOf(resolveURL('/demos/video-conference/')) !== -1) {
                    filename = filename.replace(resolveURL('/demos/video-conference/'), '');
                    filename += resolveURL('/demos/video-conference/index.html');
                } else if (filename.indexOf(resolveURL('/demos')) !== -1) {
                    filename = filename.replace(resolveURL('/demos/'), '');
                    filename = filename.replace(resolveURL('/demos'), '');
                    filename += resolveURL('/demos/index.html');
                } else {
                    filename += resolveURL(config.homePage);
                }
            }
        } catch (e) {
            pushLogs(config, 'statSync.isDirectory', e);
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
                file = file.replace('connection.socketURL = \'/\';', 'connection.socketURL = \'' + config.socketURL + '\';');
            } catch (e) { }

            response.writeHead(200, {
                'Content-Type': contentType
            });
            response.write(file, 'binary');
            response.end();
        });
    } catch (e) {
        pushLogs(config, 'Unexpected', e);

        response.writeHead(404, {
            'Content-Type': 'text/plain'
        });


        response.write('404 Not Found: Unexpected error.\n' + e.message + '\n\n' + e.stack);
        response.end();
    }
}

var httpApp;

if (isUseHTTPs) {
    httpServer = require('https');

    // See how to use a valid certificate:
    // https://github.com/muaz-khan/WebRTC-Experiment/issues/62
    var options = {
        key: null,
        cert: null,
        ca: null
    };

    var pfx = false;

    if (!fs.existsSync(config.sslKey)) {
        console.log(BASH_COLORS_HELPER.getRedFG(), 'sslKey:\t ' + config.sslKey + ' does not exist.');
    } else {
        pfx = config.sslKey.indexOf('.pfx') !== -1;
        options.key = fs.readFileSync(config.sslKey);
    }

    if (!fs.existsSync(config.sslCert)) {
        console.log(BASH_COLORS_HELPER.getRedFG(), 'sslCert:\t ' + config.sslCert + ' does not exist.');
    } else {
        options.cert = fs.readFileSync(config.sslCert);
    }

    if (config.sslCabundle) {
        if (!fs.existsSync(config.sslCabundle)) {
            console.log(BASH_COLORS_HELPER.getRedFG(), 'sslCabundle:\t ' + config.sslCabundle + ' does not exist.');
        }

        options.ca = fs.readFileSync(config.sslCabundle);
    }

    if (pfx === true) {
        options = {
            pfx: sslKey
        };
    }

    httpApp = httpServer.createServer(options, serverHandler);
} else {
    httpApp = httpServer.createServer(serverHandler);
}

RTCMultiConnectionServer.beforeHttpListen(httpApp, config);
httpApp = httpApp.listen(process.env.PORT || PORT, process.env.IP || "0.0.0.0", function() {
    RTCMultiConnectionServer.afterHttpListen(httpApp, config);
});

// --------------------------
// socket.io codes goes below

ioServer(httpApp).on('connection', function(socket) {

    RTCMultiConnectionServer.addSocket(socket, config);

    chatPerspnalizado(socket);
    // ----------------------
    // below code is optional

    const params = socket.handshake.query;

    if (!params.socketCustomEvent) {
        params.socketCustomEvent = 'custom-message';
    }

    socket.on(params.socketCustomEvent, function(message) {
        socket.broadcast.emit(params.socketCustomEvent, message);
    });
});

//-----inicio---- listener chat -------------------------------------------
function chatPerspnalizado(socket) {
    console.log("--socket conectado..al chat personalizado.");

    socket.on("conexion_2", function(dato) {
        console.log('Dato entrante:', dato);
    });

    //------------------switch videos a todos--------------------------
    socket.on("chat_e", function(sala, quien, nombre_us, mensaje, color, colorusr) {
        socket.join(sala);
        socket.broadcast.to(sala).emit('chat_r', quien, nombre_us, mensaje, color, colorusr);
        socket.emit('chat_r', quien, nombre_us, mensaje, color, colorusr);

    }
    );
    socket.on("imagen-modelo", function(sala, imagen) {
        console.log("Imagen de la modelo...");
        socket.join(sala);
        socket.broadcast.to(sala).emit('img_mod', imagen);
        socket.emit('img_mod', imagen);

    }
    );
    socket.on("conexion_2", function(data) {
        console.log("conexion_2...");

    }
    );
    socket.on("des_conectarme", function(sala, nombre, rol) {
        console.log("ddeeeeeeee");
        socket.join(sala);
        socket.broadcast.to(sala).emit('usuario_des_conectado', nombre, rol);
        socket.emit('usuario_des_conectado', nombre, rol);

    }
    );
    socket.on("conectar_usuario", function(room, nickname, misexo) {

        socketemit();

        function existeuser() {
            for (var esc = 0; esc < usuariosConectados.length; esc++) {
                if ((usuariosConectados[esc][1]) === nickname && (usuariosConectados[esc][0]) === room) {
                    return true;
                }
            }
            return false;
        }
        if (usuariosConectados.length > 0) {
            if (existeuser()) {
                socketemit();
            } else {
                usuariosConectados.push([room, nickname, misexo, new Date()]);
                socketemit();
            }
        }
        else {
            usuariosConectados.push([room, nickname, misexo, new Date()]);
            socketemit();
        }

        function socketemit() {
            var usuariosConectadosEstaSala = [];
            var contenedorInbox40EstaSala = [];

            usuariosConectadosEstaSala.length = 0;
            contenedorInbox40EstaSala.length = 0;

            for (var esc = 0; esc < usuariosConectados.length; esc++) {
                if ((usuariosConectados[esc][0]) === room) {
                    usuariosConectadosEstaSala.push([usuariosConectados[esc][0], usuariosConectados[esc][1], usuariosConectados[esc][2], usuariosConectados[esc][3]]);
                }
            }

            if (contenedorInbox40.length > 0) {
                for (var index = 0; index < contenedorInbox40.length; index++) {
                    if ((contenedorInbox40[index][4]) === room) {
                        contenedorInbox40EstaSala.push([contenedorInbox40[index][0], contenedorInbox40[index][1], contenedorInbox40[index][2], contenedorInbox40[index][3], contenedorInbox40[index][4]]);
                    }
                }
            }


            socket.join(room);

            socket.broadcast.to(room).emit('actualizaLocal_chat_rp', contenedorInbox40EstaSala);
            socket.emit('actualizaLocal_chat_rp', contenedorInbox40EstaSala);


            socket.broadcast.to(room).emit('usuarios_chat_rp', usuariosConectadosEstaSala);
            socket.emit('usuarios_chat_rp', usuariosConectadosEstaSala);

            // socket.broadcast.to(room).emit('actualizaLocal_chat_rp',contenedorInbox40);
            // socket.emit('actualizaLocal_chat_rp',contenedorInbox40);


            // socket.broadcast.to(room).emit('usuarios_chat_rp',usuariosConectados);
            // socket.emit('usuarios_chat_rp',usuariosConectados);					
        }


    }
    );
    
    socket.on("prueba", function(room, mensaje) {
		console.log("recibiendo... ",mensaje);
        socket.join(room);
        socket.broadcast.to(room).emit('prueba', mensaje+"ServerS");
        socket.emit('prueba', mensaje+"ServerS");
    });
    
    socket.on("chat_mediacion", chat_conf);
    function chat_conf(room, mensaje, msjTipo, id_sk, u_nombre) {

        socket.join(room);
        socket.broadcast.to(room).emit('recibe_chat', mensaje, msjTipo, id_sk, u_nombre);
        socket.emit('recibe_chat', mensaje, msjTipo, id_sk, u_nombre);
    }


    //--------------------- Chat publico --------------
    socket.on("verifica_disponibilidad", verificausuario);
    function verificausuario(sala) {
        socket.emit('verificacion_chat_rp', usuariosConectados);
    }
    socket.on("conectar_chat_publico", conectar_chat_public);
    function conectar_chat_public(room, nickname, misexo) {

        function existeuser() {
            for (var esc = 0; esc < usuariosConectados.length; esc++) {
                if ((usuariosConectados[esc][1]) === nickname && (usuariosConectados[esc][0]) === room) {
                    return true;
                }
            }
            return false;
        }
        if (usuariosConectados.length > 0) {
            if (existeuser()) {
                socketemit();
            } else {
                usuariosConectados.push([room, nickname, misexo, new Date()]);
                socketemit();
            }
        }
        else {
            usuariosConectados.push([room, nickname, misexo, new Date()]);
            socketemit();
        }

        function socketemit() {
            var usuariosConectadosEstaSala = [];
            var contenedorInbox40EstaSala = [];

            usuariosConectadosEstaSala.length = 0;
            contenedorInbox40EstaSala.length = 0;

            for (var esc = 0; esc < usuariosConectados.length; esc++) {
                if ((usuariosConectados[esc][0]) === room) {
                    usuariosConectadosEstaSala.push([usuariosConectados[esc][0], usuariosConectados[esc][1], usuariosConectados[esc][2], usuariosConectados[esc][3]]);
                }
            }


            for (var index = 0; index < contenedorInbox40.length; index++) {
                if ((contenedorInbox40[index][4]) === room) {
                    contenedorInbox40EstaSala.push([contenedorInbox40[index][0], contenedorInbox40[index][1], contenedorInbox40[index][2], contenedorInbox40[index][3], contenedorInbox40[index][4]]);
                }
            }

            socket.join(room);

            socket.broadcast.to(room).emit('actualizaLocal_chat_rp', contenedorInbox40EstaSala);
            socket.emit('actualizaLocal_chat_rp', contenedorInbox40EstaSala);


            socket.broadcast.to(room).emit('usuarios_chat_rp', usuariosConectadosEstaSala);
            socket.emit('usuarios_chat_rp', usuariosConectadosEstaSala);

            // socket.broadcast.to(room).emit('actualizaLocal_chat_rp',contenedorInbox40);
            // socket.emit('actualizaLocal_chat_rp',contenedorInbox40);


            // socket.broadcast.to(room).emit('usuarios_chat_rp',usuariosConectados);
            // socket.emit('usuarios_chat_rp',usuariosConectados);				
        }


    }
    var dejarEscribir;

    socket.on("escribiendo", function(room, nickname, estatus) {
        console.log("Escribiendo...");
        if (dejarEscribir) {
            clearTimeout(dejarEscribir);
        }
        dejarEscribir = setTimeout(function() {
            desjaEscribir(room, nickname);
        }, 2000);

        socket.join(room);
        socket.broadcast.to(room).emit('usrescribiendo', room, nickname, estatus);
        socket.emit('usrescribiendo', room, nickname, estatus);
    });

    function desjaEscribir(room, nickname) {
        socket.join(room);
        socket.broadcast.to(room).emit('dejaescribir', nickname);
        socket.emit('dejaescribir', nickname);
    }

    socket.on("chat_publico", chat_public);
    function chat_public(room, mensaje, nickname, misexo, horamensaje) {
        horaini = new Date();
        if ((mensaje !== "") && (mensaje !== null) && (mensaje !== 0)) {
            contenedorInbox40.push([misexo, nickname, mensaje, horamensaje, room]);
            if (contenedorInbox40.length === 20) {
                contenedorInbox40.splice(0, 1);
            }
            socket.join(room);
            socket.broadcast.to(room).emit('chat_rp', misexo, nickname, mensaje, horamensaje);
            socket.emit('chat_rp', misexo, nickname, mensaje, horamensaje);
        }


    }
    var room;
    socket.on("chat_Privado", function(room, mensaje, nickname, destinatario, misexo, horamensaje) {
        socket.join(room);
        socket.broadcast.to(room).emit('msj_puente_privados', mensaje, nickname, destinatario, misexo, horamensaje);
        socket.emit('msj_puente_privados', mensaje, nickname, destinatario, misexo, horamensaje);
    });

    socket.on("chat_pPrivados", function(sala, remitente, destinatario, mensaje, sexo, horaMensaje) {
        function existeSala() {
            for (var a = 0; a < salasPrivadas.length; a++) {
                if (((remitente + destinatario) === salasPrivadas[a][0]) || ((destinatario + remitente) === salasPrivadas[a][0])) {
                    return true;
                }
            }
            return false;
        }
        if (salasPrivadas.length > 0) {
            if (existeSala()) {
                for (var a = 0; a < salasPrivadas.length; a++) {
                    if (((remitente + destinatario) === salasPrivadas[a][0]) || ((destinatario + remitente) === salasPrivadas[a][0])) {

                        room = salasPrivadas[a][0];
                        emitPrivado();
                        return true;
                    }
                }

            } else {
                salasPrivadas.push([remitente + destinatario, mensaje, sexo, horaMensaje]);
                room = remitente + destinatario;
                emitPrivado();
            }

        } else {
            salasPrivadas.push([remitente + destinatario, mensaje, sexo, horaMensaje]);
            room = remitente + destinatario;
            emitPrivado();
        }
        function emitPrivado() {
            socket.join(sala);
            socket.broadcast.to(sala).emit('chat_rpPrivado', remitente, destinatario, mensaje, sexo, horaMensaje);
            socket.emit('chat_rpPrivado', remitente, destinatario, mensaje, sexo, horaMensaje);
        }
    });

    //--------------------- Chat publico --------------



    //-------------fin-----switch videos a todos-----------------------
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

//-----fin------- listener chat -------------------------------------------
