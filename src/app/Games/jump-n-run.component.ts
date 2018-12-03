import { Component } from '@angular/core';
import * as io from '../../../node_modules/socket.io-client';
import * as Phaser from 'phaser';

let platforms;
let player;
let otherplayers;
let cursors;
let stars;
let score = 0;
let scoreText;
let bombs;
let gameOver;

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'jumpNrun',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
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
  this.load.spritesheet('dude',
    'assets/dude.png',
    { frameWidth: 32, frameHeight: 48 }
  );
}

let game = null;

function create () {
  const self = this;
  console.log(self);

  this.socket = io('https://limitless-caverns-43589.herokuapp.com/');

  this.otherPlayers = this.physics.add.group();
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });
  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });
  this.socket.on('disconnect', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });

  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });

  this.add.image(400, 300, 'sky');

  platforms = this.physics.add.staticGroup();

  platforms.create(400, 568, 'ground').setScale(2).refreshBody();

  platforms.create(600, 400, 'ground');
  platforms.create(50, 250, 'ground');
  platforms.create(750, 220, 'ground');

  cursors = this.input.keyboard.createCursorKeys();

  // player = this.physics.add.sprite(100, 450, 'dude');

  bombs = this.physics.add.group();

  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: 'turn',
    frames: this.anims.generateFrameNumbers('dude', { start: 4, end: 4 }),
    frameRate: 20,
    repeat: true
  });

  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
  });

  stars = this.physics.add.group({
    key: 'star',
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 }
  });

  stars.children.iterate(function (child) {

    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

  });

  scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

  this.physics.add.collider(stars, platforms);
  this.physics.add.collider(bombs, platforms);
}

function update () {
  if (player) {
    if (cursors.left.isDown) {
      player.setVelocityX(-250);

      player.anims.play('left', true);
    } else if (cursors.right.isDown) {
      player.setVelocityX(250);

      player.anims.play('right', true);
    } else {
      player.setVelocityX(0);

      player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }

    const x = player.x;
    const y = player.y;
    if (player.oldPosition && (x !== player.oldPosition.x || y !== player.oldPosition.y)) {
      this.socket.emit('playerMovement', { x: player.x, y: player.y });
    }

    player.oldPosition = {
      x: player.x,
      y: player.y,
    };
  }
}

function collectStar (player, star) {
  star.disableBody(true, true);

  score += 10;
  scoreText.setText('Score: ' + score);

  if (stars.countActive(true) === 0) {
    stars.children.iterate(function (child) {

      child.enableBody(true, child.x, 0, true, true);

    });

    const x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

    const bomb = bombs.create(x, 16, 'bomb');
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    bomb.allowGravity = false;

  }
}

function addPlayer(self, playerInfo) {
  console.log(playerInfo);
  player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'dude');
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);
  self.physics.add.collider(player, bombs, hitBomb, null, this);
  self.physics.add.collider(player, platforms);
  self.physics.add.overlap(player, stars, collectStar, null, this);
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'dude');
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
  self.physics.add.collider(otherPlayer, bombs, hitBomb, null, this);
  self.physics.add.collider(otherPlayer, platforms);
  self.physics.add.overlap(otherPlayer, stars, collectStar, null, this);
}

function hitBomb (player, bomb) {
  this.physics.pause();

  player.setTint(0xff0000);

  player.anims.play('turn');

  gameOver = true;
}

@Component({
  selector: 'app-jump',
  templateUrl: './jump-n-run.component.html',
  styleUrls: []
})

export class JumpNRunComponent {
  public deleted = false;
  onClick() {
  game = new Phaser.Game(config);
  }
  onDelete() {
    game.destroy();
    // this.deleted = true;
  }
}
