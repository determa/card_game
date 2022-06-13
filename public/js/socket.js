import {
    io
} from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

const player_hand = document.getElementById("good_field").getElementsByClassName("container")[0];
const player_container = document.getElementById('board_deck');
const enemy_face = document.querySelectorAll('.enemy_hlebalo')[0];
const enemy_cards = document.getElementById('enemy_deck');

let time;
let send = '';
const deck_length = 20;
let health = 20;
let mana_cost = 1;
let cost_for_turn = mana_cost;

function timer(seconds) {
    time = setInterval(() => {
        if (seconds == 1) {
            stop_timer();
        }
        seconds--;
        if (seconds < 10) {
            document.getElementById('timer').innerHTML = `00:0${seconds}`;
        } else {
            document.getElementById('timer').innerHTML = `00:${seconds}`;
        }
    }, 1000);
}

function stop_timer() {
    console.log('next step')
    if (send == 'you') {
        socket.emit('start_timer', opponent);
        add_cards_to_hand('good');
        mana_cost++;
        document.getElementById('player_cost').innerHTML = `${mana_cost}/${mana_cost}$`;
        cost_for_turn = mana_cost;
    }
    clearInterval(time);
    enemy_hand_render();
    deck_render();
}

document.getElementById('stop_timer').addEventListener('click', e => {
    if (send == 'you') {
        stop_timer();
    }
});

player_hand.addEventListener('dragstart', e => {
    if (player_hand.contains(e.target)) {
        console.log('start')
        e.target.classList.add('dragging');
    }
});

player_hand.addEventListener('dragend', e => {
    if (player_hand.contains(e.target)) {
        console.log('end')
        e.target.classList.remove('dragging');
    }
});

player_container.addEventListener('dragover', e => {
    e.preventDefault()
})

player_container.addEventListener('drop', e => {
    const draggable = document.querySelector('.dragging');
    if (draggable.getAttribute('point') == 'field') {
        if (cost_for_turn != 0) {
            draggable.parentNode.removeChild(draggable);
            player_container.appendChild(draggable);
            draggable.setAttribute('point', 'enemy');
            draggable.classList.remove('dragging');
            draggable.setAttribute('draggable', 'false');
            enemy_hand_render();
            send_to_enemy(draggable.getAttribute('id'));
            cost_for_turn--;
            if (cost_for_turn == 0) {
                document.querySelectorAll(`div[point="field"]`).forEach(element => {
                    element.setAttribute('draggable', 'false');
                });
            }
            document.getElementById('player_cost').innerHTML = `${cost_for_turn}/${mana_cost}$`;
        }
    }
});

player_container.addEventListener('dragstart', e => {
    if (player_container.contains(e.target)) {
        console.log('start')
        e.target.classList.add('dragging');
    }
});

player_container.addEventListener('dragend', e => {
    if (player_container.contains(e.target)) {
        console.log('end')
        e.target.classList.remove('dragging');
    }
});

enemy_face.addEventListener('dragover', e => {
    e.preventDefault()
});

enemy_face.addEventListener('drop', e => {
    const draggable = document.querySelector('.dragging');
    if (draggable.getAttribute('point') == 'enemy' && enemy_face.contains(e.target)) {
        draggable.setAttribute('draggable', 'false');
        document.getElementById('evil_health').innerHTML = `${health -= cards[draggable.getAttribute('id')].attack_points}♥`;
        socket.emit('avatar_attack', {
            id: opponent,
            player_health: health
        });
        if (health <= 0) {
            socket.emit('lose', opponent);
            document.getElementsByTagName('body')[0].innerHTML = `
            <div class="game_over">
                <span>You win!</span>
                <div class="restart" onClick="window.location.href='/game';">restart!</div>
            </div>`;
            clearInterval(time);
        }
    }
});

enemy_cards.addEventListener('dragover', e => {
    e.preventDefault()
});

enemy_cards.addEventListener('drop', e => {
    const draggable = document.querySelector('.dragging');
    console.log(draggable)
    if (draggable.getAttribute('point') == 'enemy' && enemy_cards.contains(e.target) && enemy_cards != e.target) {
        console.log(e.target.closest('.enemy_dropable'))
        draggable.setAttribute('draggable', 'false');
        socket.emit('card_attack', {
            id: opponent,
            attack_id: draggable.getAttribute('id'),
            attack_card: cards[draggable.getAttribute('id')],
            defence_card: Number(e.target.closest('.enemy_dropable').getAttribute('index'))
        })
    }
});


//-----------------sockets-------------------------
let opponent;
let cards;
let index = 0;

const socket = io("/test", {
    reconnectionDelayMax: 10000,
    auth: {
        token: "123"
    }
});

socket.on('connect', () => {
    console.log('connected to server');
});


socket.on('startGame', (data) => {
    opponent = data.id;
    cards = data.cards;
    let elem = document.getElementById("waiting_screen");
    elem.parentNode.removeChild(elem);
    add_cards_to_hand('good', 5);
    add_cards_to_hand('evil', 5);
});

socket.on('start_timer', (res) => {
    if (res == 'you') {
        document.getElementById('timer').style.color = 'rgb(0 255 0 / 70%)';
        document.querySelectorAll('.draggable').forEach(element => {
            element.setAttribute('draggable', 'true');
        });
    } else {
        document.getElementById('timer').style.color = 'rgb(255 0 0 / 70%)';
        document.querySelectorAll('.draggable').forEach(element => {
            element.setAttribute('draggable', 'false');
        });
    }
    send = res;
    clearInterval(time);
    timer(15);
});

socket.on('card_to_field', (res) => {
    card_to_enemy_field(res);
});

socket.on('card_attack', (res) => {
    console.log(res);
    socket.emit('card_defence', {
        id: opponent,
        attack_id: res.defence_card,
        attack_card: cards[res.defence_card],
        defence_card: res.attack_id
    })
    cards[res.defence_card].defense_points -= res.attack_card.attack_points;
    let health = res.attack_card.defense_points - cards[res.defence_card].attack_points;
    if (cards[res.defence_card].defense_points <= 0) {
        document.getElementById(res.defence_card).remove();
    } else {
        document.getElementById(res.defence_card).getElementsByClassName('health')[0].innerHTML = cards[res.defence_card].defense_points;
    }
    if (health <= 0) {
        document.querySelector(`div[index="${res.attack_id}"]`).remove();
    } else {
        document.querySelector(`div[index="${res.attack_id}"]`).getElementsByClassName('health')[0].innerHTML = health;
    }
});

socket.on('card_defence', (res) => {
    cards[res.defence_card].defense_points -= res.attack_card.attack_points;
    let health = res.attack_card.defense_points - cards[res.defence_card].attack_points;
    if (cards[res.defence_card].defense_points <= 0) {
        document.getElementById(res.defence_card).remove();
    } else {
        document.getElementById(res.defence_card).getElementsByClassName('health')[0].innerHTML = cards[res.defence_card].defense_points;
    }
    if (health <= 0) {
        document.querySelector(`div[index="${res.attack_id}"]`).remove();
    } else {
        document.querySelector(`div[index="${res.attack_id}"]`).getElementsByClassName('health')[0].innerHTML = health;
    }
});

socket.on('hand_render', (res) => {
    add_cards_to_hand('evil', res);
});

socket.on('deck_render', (res) => {
    document.getElementById('bad_deck_value').innerHTML = res;
});

socket.on('avatar_attack', (res) => {
    console.log(res);
    document.getElementById('player_health').innerHTML = `${res}♥`;
});

socket.on('lose', () => {
    clearInterval(time);
    document.getElementsByTagName('body')[0].innerHTML = `
        <div class="game_over">
            <span>You lose!</span>
            <div class="restart" onClick="window.location.href='/game';">restart!</div>
        </div>`;
});

function add_cards_to_hand(who, count = 1) {
    console.log('add card');
    let block = '';
    let data1;
    for (let i = 0; i < count; i++) {
        if (who == 'evil') {
            block += `
                <div class="card-front">
                <div class="layer">
                <div class="corner"></div>
                <div class="corner"></div>
                <div class="corner"></div>
                <div class="corner"></div>
                </div>
                </div>`;
        } else {
            if (index != deck_length) {
                data1 = cards[index];
                block += `
                <div class="draggable stone stone_info" draggable='false' point='field' id='${index}'>
                <div class="img" style="background-image: url(img/${data1.img});">
                <h1 class="mainhead">${data1.alias}</h1>
                </div>
                <div class="card-info">
                <span class='health'>${data1.defense_points}</span>
                <span class="cost">${data1.cost}</span>
                <span>${data1.attack_points}</span>
                </div>
                </div>`;
                index++;
            }
        }
    }
    let cont;
    if (who == 'evil') {
        cont = document.getElementById("evil_field").getElementsByClassName("container");
        cont[0].innerHTML = block;
    } else {
        cont = document.getElementById("good_field").getElementsByClassName("container");
        cont[0].innerHTML += block;
    }
    deck_render();
}

function card_to_enemy_field(res) {
    let block = `
    <div class="enemy_dropable stone stone_info" index="${res.id_card}">
    <div class="img" style="background-image: url(img/${res.data.img});">
    <h1 class="mainhead">${res.data.alias}</h1>
    </div>
    <div class="card-info">
    <span class='health'>${res.data.defense_points}</span>
    <span class="cost">${res.data.cost}</span>
    <span>${res.data.attack_points}</span>
    </div>
    </div>`;
    document.querySelectorAll('.enemy_deck')[0].innerHTML += block;
}

function send_to_enemy(id_card) {
    socket.emit('card_to_field', {
        id: opponent,
        id_card: id_card,
        data: cards[id_card],
        cards: document.getElementById("good_field").getElementsByClassName("container")[0].children.length
    });
}

function enemy_hand_render() {
    socket.emit('hand_render', {
        id: opponent,
        cards: document.querySelectorAll(`div[point='field']`).length
    });
}

function deck_render() {
    document.getElementById('good_deck_value').innerHTML = deck_length - index;
    socket.emit('deck_render', {
        id: opponent,
        length: deck_length - index
    });
}