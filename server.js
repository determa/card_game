import express from 'express';
import path from 'path';
import session from 'express-session';
import {
    getenv
} from './config.js';
import 'dotenv/config';
import {
    createServer
} from 'http';
import {
    Server
} from 'socket.io';
import {pass_send, login, signup} from './src/models/db_functions.js';
import socket_handler from './src/middleware/socket_handler.js';

const app = express();
const server = createServer(app);

const __dirname = path.resolve();

app.set('view engine', 'ejs');

app.use(session({
    secret: getenv('SESSION_SECRET'),
    resave: true,
    saveUninitialized: true
}));
app.use(express.json());
app.use(express.static(__dirname + '/public'));
// app.use(express.static(__dirname + '/views'));
app.use(express.urlencoded({
    extended: true
}));

const io = new Server(server);

let wait_player;

io.of('/test').on('connection', socket_handler.bind(io));

// let clients = 0;
// io.of('/test')
//     .on('connection', (socket) => {
//         clients += 1;
//         console.log('INFO', `Клиент подключен: ${clients}`);
        
//         socket.on("attack", (arg, callback) => {
//             console.log(arg); // "world"
//             callback("got it");
//         });

//         socket.on('disconnect', () => {
//             clients -= 1;
//             console.log('INFO', `Клиент Отключен. Подключено: ${clients}`);
//         });
//     });


//------------------------------------------------------------


app.get('/', (req, res) => {
    res.render(__dirname + '/views/authorization.ejs');
});

app.get('/game', (req, res) => {
    res.render(__dirname + '/views/index.ejs');
});

app.get('/game_test', (req, res) => {
    res.render(__dirname + '/views/test.ejs');
});

app.get('/remind', (req, res) => {
    res.render(__dirname + '/views/password_remind.ejs');
});

app.post('/send', async (req, res) => {
    let resul;
    if (req.body.method == 'login') {
        resul = await login(req.body.login, req.body.password);
    }
    else if (req.body.method == 'sigin') {
        resul = await signup(req.body.login, req.body.password, req.body.email);
    }
    else if (req.body.method == 'remind') {
        resul = await pass_send(req.body.email);
    }
    console.log(resul);
    res.json({
        data: resul
    });
});


//------------------------------------------------------------
// обработка ошибок
app.use((req, res) => {
    res.status(404).render(__dirname + '/views/error_page.ejs');
});

app.use((err, req, res) => {
    res.status(err.status || 500);
    res.send({
        error: err.message
    });
});

server.listen(getenv('SERVER_PORT'), getenv('SERVER_HOST'), async () => {
    console.log('INFO', `Express server is lisnening on port http://${getenv('SERVER_HOST')}:${getenv('SERVER_PORT')}`);
});