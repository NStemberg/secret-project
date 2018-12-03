import { Component } from '@angular/core';
import * as io from '../../../node_modules/socket.io-client';
import * as Phaser from 'phaser';

let obstacles;
let me;
let player;
let otherplayers;
let cursors;
let stars;
let score = 0;
let scoreText;
let bombs;
let gameOver;
let speed;
let scores = [];
let collide = false;

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450 ,
  parent: 'scroll',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

function preload () {
  this.load.image('sky', 'assets/sky.png');
  this.load.image('ground', 'assets/platform.png');
  this.load.image('star', 'assets/star.png');
  this.load.image('bomb', 'assets/bomb.png');
  this.load.image('user', 'assets/User.png');
  this.load.image('space', 'assets/Space.jpg');
}

let game = null;
let myImage;

function create () {
  const self = this;

  this.socket = io('https://limitless-caverns-43589.herokuapp.com/');

  myImage = this.add.image(400, 300, 'space');

  obstacles = this.physics.add.group();
  otherplayers = this.physics.add.group();

  cursors = this.input.keyboard.createCursorKeys();

  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
        console.log(otherplayers);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });
  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });
  this.socket.on('disconnect', function (playerId) {
    otherplayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });

  this.socket.on('playerMoved', function (playerInfo) {
    console.log('Moved!');
    console.log(otherplayers);
    otherplayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });

  this.socket.on('createObst', function (coord) {
    const obstacle = obstacles.create(800, coord.y, 'bomb');
    obstacle.setCollideWorldBounds(false);
    obstacle.setVelocityX(-150);
  });

  this.socket.on(('collision'), function(players) {
    scores.forEach((user) => {
      user.score = players[user.player].score;
    });
  });

}

function update () {
  if (player) {
    if (cursors.up.isDown) {
      player.setVelocityY(-250);
    } else if (cursors.down.isDown) {
      player.setVelocityY(250);
    } else {
      player.setVelocityY(0);
    }

    const x = player.x;
    const y = player.y;
    if (player.oldPosition && (x !== player.oldPosition.x || y !== player.oldPosition.y)) {
      console.log({ x: player.x, y: player.y });
      this.socket.emit('playerMovement', { x: player.x, y: player.y });
    }

    if (collide) {
      this.socket.emit('collision');
      collide = false;
    }

    player.oldPosition = {
      x: player.x,
      y: player.y,
    };
  }
}


function addPlayer(self, playerInfo) {
  player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'User');
  player.setTint('#961f2d');
  player.setCollideWorldBounds(true);
  self.physics.add.overlap(player, obstacles, hitObstacle);
  self.physics.add.overlap(player, stars, obstacles, null, this);
  scores.push({player: playerInfo.playerId, score: 0});
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = otherplayers.create(playerInfo.x, playerInfo.y, 'User');
  otherPlayer.setTint('#296396');
  otherPlayer.playerId = playerInfo.playerId;
  // self.otherplayers.add(otherPlayer);
  self.physics.add.overlap(otherPlayer, obstacles);
  self.physics.add.overlap(otherPlayer, stars, obstacles, null, this);
  scores.push({player: playerInfo.playerId, score: 0});
}

function hitObstacle (player, obstacles) {
  console.log('Hit');
  collide = true;
}

@Component({
  selector: 'app-scroll',
  templateUrl: './scroll.component.html',
  styleUrls: []
})

export class ScrollComponent {
  public deleted = false;
  public scores = scores || [{player: 'Test', score: 0}];
  newInterval = setInterval(this.scores = scores, 100);
  onClick() {
    game = new Phaser.Game(config);
  }
  onDelete() {
    game.destroy();
    clearInterval(this.newInterval);
    this.deleted = true;
  }
}
