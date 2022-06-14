import mysql from 'mysql2';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

const __dirname = path.resolve();

import {
    getenv
} from '../../config.js';
import 'dotenv/config';

const cards = [
    { alias: "Thor", attack_points: 10, defense_points: 8, cost: 1, img: "thor.jpg" },
    { alias: "Iron Man", attack_points: 12, defense_points: 14, cost: 1, img: "ironman.jpg" },
    { alias: "Spider Man", attack_points: 14, defense_points: 12, cost: 1, img: "spiderman.png" },
    { alias: "Thanos", attack_points: 15, defense_points: 10, cost: 1, img: "thanos.jpg" },
    { alias: "Captain America", attack_points: 10, defense_points: 8, cost: 1, img: "cptn_america.jpg" },
    { alias: "Wonder Woman", attack_points: 11, defense_points: 14, cost: 1, img: "wonder_woman.png" },
    { alias: "Hulk", attack_points: 20, defense_points: 15, cost: 1, img: "hulk.jpg" },
    { alias: "Rocket", attack_points: 8, defense_points: 10, cost: 1, img: "rocket.jpg" },
    { alias: "Venom", attack_points: 14, defense_points: 13, cost: 1, img: "venom.png" },
    { alias: "Gamora", attack_points: 11, defense_points: 8, cost: 1, img: "gamora.jpg" },
    { alias: "Doctor Strange", attack_points: 10, defense_points: 8, cost: 1, img: "dr_strange.jpg" },
    { alias: "Deadpool", attack_points: 12, defense_points: 14, cost: 1, img: "deadpool.jpg" },
    { alias: "Wolverine", attack_points: 14, defense_points: 12, cost: 1, img: "wolverine.jpg" },
    { alias: "Professor X", attack_points: 15, defense_points: 10, cost: 1, img: "professor_x.jpg" },
    { alias: "Star-Lord", attack_points: 10, defense_points: 8, cost: 1, img: "star-lord.jpg" },
    { alias: "Groot", attack_points: 11, defense_points: 14, cost: 1, img: "groot.jpg" },
    { alias: "Black Panther", attack_points: 20, defense_points: 15, cost: 1, img: "black_panther.png" },
    { alias: "Ant-Man", attack_points: 8, defense_points: 10, cost: 1, img: "ant-man.jpg" },
    { alias: "Mystique", attack_points: 14, defense_points: 13, cost: 1, img: "mystique.jpg" },
    { alias: "Black Widow", attack_points: 11, defense_points: 8, cost: 1, img: "black_widow.jpg" },
];

const transporter = nodemailer.createTransport({
    host: getenv('SMTP_HOST'),
    port: getenv('SMTP_PORT'),
    auth: {
        user: getenv('SMTP_USER'),
        pass: getenv('SMTP_PASS')
    }
});

const connection = mysql.createConnection({
    host: getenv('MYSQL_HOST'),
    user: getenv('MYSQL_USERNAME'),
    password: getenv('MYSQL_PASSWORD')
}).promise();

async function init() {
    await connection.query('CREATE DATABASE IF NOT EXISTS card_game;').catch((err) => {
        if (err) console.log(err);
    });
    await connection.query('USE card_game;').catch((err) => {
        if (err) console.log(err);
    });
    await connection.query('CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY AUTO_INCREMENT, login VARCHAR(50) NOT NULL UNIQUE, password VARCHAR(50) NOT NULL, email VARCHAR(50) NOT NULL UNIQUE, img VARCHAR(50) NOT NULL);').catch((err) => {
        if (err) console.log(err);
    });
};
init();

async function signup(login, password, email, avatar) {
    let info = { login: login, password: password, email: email, img: avatar };
    return await connection.query('INSERT INTO users SET ?', info)
        .then(() => {
            return '<p style="color: green;">Registration successful.</p>';
        })
        .catch((err) => {
            fs.unlinkSync(__dirname + `/public/img/${avatar}`);
            if (err.code == 'ER_DUP_ENTRY') {
                return '<p style="color: red;">This login or email is already in use. Try again.</p>';
            }
            else {
                console.log(err)
                return '<p style="color: red;">Some error. Try again.</p>'
            }
        });
};

async function login(login, password) {
    return await connection.query('SELECT * FROM users WHERE login = ?;', login)
        .then(([rows]) => {
            if (!rows[0] || password != rows[0].password) {
                return '<p style="color: red;">Incorrect login or password.</p>';
            }
            return true;
        })
        .catch((err) => {
            console.log(err)
            if (err) return '<p style="color: red;">Something wrong. Try again.</p>';
        });
};

async function pass_send(email) {
    return await connection.query(`SELECT * FROM users WHERE email = ?;`, email)
        .then(async ([rows]) => {
            if (rows[0]) {
                await transporter.sendMail({
                    from: '"Node js" <nodejs@example.com>',
                    to: email,
                    subject: 'Message from Node js',
                    text: `Your password: ${rows[0].password}`
                });
            }
            return '<p style="color: green;">The letter has been sent if the given email is used.</p>'
        })
        .catch((err) => {
            console.log(err)
            if (err) return '<p style="color: red;">Some error. Try again.</p>';
        });
}

async function get_img(login) {
    return await connection.query(`SELECT img FROM users WHERE login = ?;`, login)
        .then(async ([rows]) => {
            return rows[0].img;
        })
}

export { pass_send, login, signup, cards, get_img };