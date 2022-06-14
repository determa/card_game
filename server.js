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
import {
    pass_send,
    login,
    signup,
    get_img
} from './src/models/db_functions.js';
import socket_handler from './src/middleware/socket_handler.js';
import multer from 'multer';

const app = express();
const server = createServer(app);
const __dirname = path.resolve();
const oneDay = 1000 * 60 * 60 * 24;

app.set('view engine', 'ejs');

app.use(session({
    secret: getenv('SESSION_SECRET'),
    resave: true,
    cookie: {
        maxAge: oneDay
    },
    saveUninitialized: true
}));
app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.use(multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'public/img')
        },
        filename: (req, file, cb) => {
            cb(null, Math.floor(Math.random() * 100) + file.originalname)
        }
    })
}).single("avatar"));
app.use(express.urlencoded({
    extended: true
}));

const io = new Server(server);

let sess = {};

io.of('/test').on('connection', (socket) => {
    socket.img = sess.img;
    socket.name = sess.name;
    socket_handler(socket);
});


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
    sess = req.session;
    if (req.body.method == 'login') {
        resul = await login(req.body.login, req.body.password);
        if (resul) {
            sess.img = await get_img(req.body.login);
            sess.name = req.body.login;
        }
    } else if (req.body.method == 'sigin') {
        resul = await signup(req.body.login, req.body.password, req.body.email, req.file ? req.file.filename : 'wonder_woman.png');
    } else if (req.body.method == 'remind') {
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