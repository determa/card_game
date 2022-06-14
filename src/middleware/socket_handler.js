import { cards } from '../models/db_functions.js';
let wait_player;
function get_cards(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export default function (socket) {
    console.log('Connected ' + socket.id);
    // socket.img = img;

    if (wait_player) {
        console.log('work');
        socket.to(wait_player.id).emit('startGame', { id: socket.id, cards: get_cards(cards), enemy_img: socket.img, my_img: wait_player.img, enemy_name: socket.name, my_name: wait_player.name});
        wait_player.to(socket.id).emit('startGame', { id: wait_player.id, cards: get_cards(cards),  enemy_img: wait_player.img, my_img: socket.img, enemy_name: wait_player.name, my_name: socket.name});
        socket.emit('start_timer', 'not you');
        wait_player.emit('start_timer', 'you');
        wait_player = null;
    }
    else {
        wait_player = socket;
    }

    socket.on('disconnect', function () {
        if (wait_player == socket) {
            wait_player = null;
        }
        console.log('Disconnected ' + socket.id);
    });

    socket.on('card_to_field', (res) => {
        socket.to(res.id).emit('card_to_field', { data: res.data, id_card: res.id_card, cards: res.cards });
    });

    socket.on('card_attack', (res) => {
        socket.to(res.id).emit('card_attack', res);
    })

    socket.on('card_defence', (res) => {
        socket.to(res.id).emit('card_defence', res);
    });

    socket.on('start_timer', (res) => {
        socket.to(res).emit('start_timer', 'you');
        socket.emit('start_timer', 'not you');
    });

    socket.on('hand_render', (res) => {
        socket.to(res.id).emit('hand_render', res.cards);
    });

    socket.on('deck_render', (res) => {
        socket.to(res.id).emit('deck_render', res.length);
    });

    socket.on('avatar_attack', (res) => {
        socket.to(res.id).emit('avatar_attack', res.player_health);
    });

    socket.on('lose', (res) => {
        socket.to(res).emit('lose', 'uou died');
    });
}