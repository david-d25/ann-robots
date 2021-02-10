"use strict";

window.onload = onWindowLoad;

const KEY_C = 67;
const KEY_P = 80;

const VERSION = "0.1.9";

var canvas, ctx, updateInterval, drawInterval, lastMillis;

var state = {
  players: [],
  bullets: [],
  walls: [],
  generation: 0,
  gameSpeedMultiplier: getControlsData().gameSpeedMultiplier,
  saveState: function() {
    var result = {};
    result.players = state.players.map((current) => current.getState());
    result.bullets = state.bullets.map((current) => current.getState());
    result.walls = state.walls.map((current) => current.getState());
    result.generation = state.generation;
    result.gameSpeedMultiplier = state.gameSpeedMultiplier;
    util.download(JSON.stringify(result), `save-${Date.now()}`, 'application/json');
  },
  loadState: function() {
    let input = document.createElement('input');
    input.type = 'file';
    input.click();
    input.onchange = () => {
      let reader = new FileReader();
      reader.onload = (e) => {
        let result = JSON.parse(e.target.result);
        state.reset();
        state.players = result.players.map((current) => {return new Player().setState(current)}) || [];
        state.bullets = result.bullets.map((current) => {return new Bullet().setState(current)}) || [];
        state.walls = result.walls.map((current) => {return new Wall().setState(current)}) || [];
        state.generation = result.generation || 0;
        state.gameSpeedMultiplier = result.gameSpeedMultiplier || 0;
      };
      startTicking();
      reader.readAsText(input.files[0]);
    }
  },
  getPlayerByID: function(id) {
    for (var a = 0; a < state.players.length; a++)
      if (state.players[a].getID() === id)
        return state.players[a];
    return null;
  },
  reset: function() {
    this.walls = [];
    this.players = [];
    this.bullets = [];
    this.generation = 0;
    this.gameSpeedMultiplier = getControlsData('game-speed-multiplier');
  },
  removeBullet: function(bullet) {
    for (var i = 0; i < state.bullets.length; i++)
      if (state.bullets[i] === bullet) state.bullets.splice(i, 1);
  }
};

function onWindowLoad() {
  $('#version').text('v' + VERSION);
  
  initListeners();

  canvas = document.getElementById("canvas");
  ctx = canvas.getContext('2d');
}

function initListeners() {
  $("#controls-btn").click(() => $('#controls').toggleClass('active'));
  document.addEventListener("keydown", (event) => {
    if (!(event.altKey || event.shiftKey || event.ctrlKey)) {
      if (event.keyCode == KEY_C)
        $('#controls').toggleClass('active')

      if (event.keyCode == KEY_P)
        if (updateInterval)
          stopTicking();
        else
          startTicking();
    }
  });
  $("#start-btn").click(startGame);
  $("#save-state-btn").click(state.saveState);
  $("#load-state-btn").click(state.loadState)

  $("#play-btn").click(startTicking);
  $("#pause-btn").click(stopTicking);
}

function startGame() {
  state.reset();
  for (var a = 0; a < getControlsData().playersNumber; a++)
    state.players.push(new Player({
      size: getControlsData().playerSize,
      fov: getControlsData().playerFOV,
      rays: getControlsData().playerRays,
      position: {x: Math.random()*canvas.width, y: Math.random()*canvas.height},
      rotation: Math.random()*360,
      energy: getControlsData('player-energy'),
      hiddenLayers: getControlsData().hiddenLayers,
      layerNeurons: getControlsData().layerNeurons,
      maxSynapseWeight: getControlsData('nn-max-synapse-weight'),
      visionDistance: getControlsData().playerVisionDistance,
    }));

  state.walls.push(new Wall(
    {x: 0, y: 0},
    {x: 0, y: 1000}
  ));
  state.walls.push(new Wall(
    {x: 0, y: 1000},
    {x: 1000, y: 1000}
  ));
  state.walls.push(new Wall(
    {x: 1000, y: 1000},
    {x: 1000, y: 0}
  ));
  state.walls.push(new Wall(
    {x: 1000, y: 0},
    {x: 0, y: 0}
  ));

  state.walls.push(new Wall(
    {x: 150, y: 150},
    {x: 850, y: 150}
  ));
  state.walls.push(new Wall(
    {x: 150, y: 850},
    {x: 850, y: 850}
  ));
  state.walls.push(new Wall({x: 150, y: 150}, {x: 150, y: 160}));
  state.walls.push(new Wall({x: 150, y: 160}, {x: 850, y: 160}));
  state.walls.push(new Wall({x: 850, y: 160}, {x: 850, y: 150}));
  state.walls.push(new Wall({x: 150, y: 850}, {x: 150, y: 840}));
  state.walls.push(new Wall({x: 150, y: 840}, {x: 850, y: 840}));
  state.walls.push(new Wall({x: 850, y: 840}, {x: 850, y: 850}));

  startTicking();
}

function update() {
  let delta = (Date.now() - lastMillis)/1000;

  if (delta > .25) {
    lastMillis = Date.now();
    return;
  }

  for (let i = 0; i < +getControlsData('game-speed-multiplier'); i++) {
    let playerPrevPositions = {};

    for (let player of state.players) {
      playerPrevPositions[player.getID()] = {x: player.getX(), y: player.getY()};
      player.update(delta);
    }

    state.bullets.forEach(b => b.update(delta));

    // Player-player collision
    for (let p1 = 0; p1 < state.players.length; p1++) {
      let player1 = state.players[p1];
      if (player1.isKilled()) continue;

      for (let p2 = p1 + 1; p2 < state.players.length; p2++) {
        let player2 = state.players[p2];
        if (player2.isKilled()) continue;

        let distance = Math.sqrt(Math.pow(player1.getX() - player2.getX(), 2) + Math.pow(player1.getY() - player2.getY(), 2));
        let sin = (player2.getY() - player1.getY()) / distance;
        let cos = (player2.getX() - player1.getX()) / distance;

        if (sin === sin && cos === cos && distance < player1.getSize() + player2.getSize()) {
          let offset = (player1.getSize() + player2.getSize() - distance);
          player1.setX(player1.getX() - offset * cos);
          player1.setY(player1.getY() - offset * sin);
          player2.setX(player2.getX() + offset * cos);
          player2.setY(player2.getY() + offset * sin);
        }
      }
    }

    // Player-wall collision
    for (let p = 0; p < state.players.length; p++) {
      let player = state.players[p];
      if (player.isKilled()) continue;
      for (let w = 0; w < state.walls.length; w++) {
        let wall = state.walls[w];

        var point1Distance = Math.sqrt(Math.pow(player.getX() - wall.getPoint1().x, 2) + Math.pow(player.getY() - wall.getPoint1().y, 2));
        var point2Distance = Math.sqrt(Math.pow(player.getX() - wall.getPoint2().x, 2) + Math.pow(player.getY() - wall.getPoint2().y, 2));
        var nearestEdgeDistance = point1Distance > point2Distance ? point2Distance : point1Distance;

        var intersection = util.getLinePerpendicularIntersectionPoint(wall.getPoint1(), wall.getPoint2(), player.getPosition());

        var perpendicularLength = null;
        if (intersection)
          perpendicularLength = Math.sqrt(Math.pow(player.getX() - intersection.x, 2) + Math.pow(player.getY() - intersection.y, 2));

        if (!(
            nearestEdgeDistance < player.getSize() ||
            (perpendicularLength && perpendicularLength < player.getSize())
        )) continue;

        if (perpendicularLength && perpendicularLength < nearestEdgeDistance) {
          var offset = {
            x: (player.getX() - intersection.x),
            y: (player.getY() - intersection.y)
          };

          var sin = offset.y / Math.sqrt(Math.pow(offset.x, 2) + Math.pow(offset.y, 2));
          var cos = Math.sqrt(1 - sin * sin);
          offset.x = player.getSize() * Math.sign(offset.x) * cos - offset.x;
          offset.y = player.getSize() * sin - offset.y;

          player.setPosition(
              player.getX() + offset.x,
              player.getY() + offset.y
          );
        } else {
          let nearestPoint = point1Distance > point2Distance ? wall.getPoint2() : wall.getPoint1();
          var offset = {
            x: (player.getX() - nearestPoint.x),
            y: (player.getY() - nearestPoint.y)
          };

          var sin = offset.y / Math.sqrt(Math.pow(offset.x, 2) + Math.pow(offset.y, 2));
          var cos = Math.sqrt(1 - sin * sin);
          offset.x = player.getSize() * Math.sign(offset.x) * cos - offset.x;
          offset.y = player.getSize() * sin - offset.y;

          player.setPosition(
              player.getX() + offset.x,
              player.getY() + offset.y
          );
        }
      }
    }

    state.players.forEach(p => {
      let distance = Math.sqrt(Math.pow(p.getX() - playerPrevPositions[p.getID()].x, 2) + Math.pow(p.getY() - playerPrevPositions[p.getID()].y, 2));
      p.giveFitness(distance * getControlsData('fitness-per-move'));
    });

    let alive = 0;

    state.players.forEach(p => {
      if (!p.isKilled()) {
        alive++;
      } else if (p.getLeftBound() < 0)
        p.setLeftBound(0);
      else if (p.getRightBound() > canvas.width)
        p.setRightBound(canvas.width);
      else if (p.getTop() < 0)
        p.setTop(0);
      else if (p.getBottom() > canvas.height)
        p.setBottom(canvas.height);
    });

    if (alive === 0 && state.players.length > 0) {
      let selectedPlayers = [];

      for (var a = 0; a < getControlsData('players-to-select'); a++) {
        let maxIndex = 0;
        for (let i = 0; i < state.players.length; i++)
          if (state.players[maxIndex].getFitness() < state.players[i].getFitness())
            maxIndex = i;
        selectedPlayers.push(state.players[maxIndex]);
        state.players.splice(maxIndex, 1);
      }

      state.players = [];
      state.bullets = [];

      for (let a = 0; a < getControlsData('players-number'); a++) {
        let playerToAdd = selectedPlayers[a % getControlsData('players-to-select')].getCopy();
        playerToAdd.mutate(getControlsData('mutation-step'));
        playerToAdd.setPosition(Math.random() * canvas.width, Math.random() * canvas.height);
        playerToAdd.setRotation(Math.random() * 360);
        state.players.push(playerToAdd);
      }
      state.generation++;
      break;
    }
  }

  lastMillis = Date.now();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  state.players.forEach(it => it.draw(canvas, ctx));
  state.bullets.forEach(it => it.draw(canvas, ctx));
  state.walls.forEach(it => it.draw(canvas, ctx));

  ctx.fillStyle = 'black';
  ctx.font = `24px sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`Generation ${state.generation}`, 2, 2);
}

function getControlsDataBoolean(id) {
  return (document.getElementById(id) || { checked:false }).checked;
}

function getControlsData(id) {
  let getValue = function(id) {
    let elSafe = (document.getElementById(id) || {value:null});
    let result = elSafe.value;
    if (!isNaN(result)) return +result;
    return result;
  };
  if (id) return getValue(id);
  return {
    playersNumber: +getValue('players-number'),

    playerFOV: +getValue('player-fov'),
    playerRays: +getValue('player-rays'),
    playerSize: +getValue('player-size'),
    playerVisionDistance: +getValue('player-vision-distance'),

    playerShotCost: +getValue('player-shot-cost'),
    playerMoveCost: +getValue('player-move-cost'),
    playerRotateCost: +getValue('player-rotate-cost'),
    playerLiveCost: +getValue('player-live-cost'),

    fitnessPerKill: +getValue('fitness-per-kill'),
    fitnessPerMove: +getValue('fitness-per-move'),

    hiddenLayers: +getValue('nn-hidden-layers'),
    layerNeurons: +getValue('nn-layer-neurons'),
    maxSynapseWeight: +getValue('nn-max-synapse-weight'),
    mutationStep: +getValue('mutation-step'),

    playersToSelect: +getValue('players-to-select'),

    gameSpeedMultiplier: +getValue('game-speed-multiplier')
  }
}

function setControlsData(data) {
  for (let setting in data) {
    // TODO: set controls data
  }
}

function startTicking() {
  lastMillis = Date.now();

  clearInterval(updateInterval);
  clearInterval(drawInterval);

  updateInterval = setInterval(update, 1000/getControlsData('simulation-accuracy'));
  drawInterval = setInterval(draw, 1000/getControlsData('target-fps'));
}
function stopTicking() {
  clearInterval(updateInterval);
  clearInterval(drawInterval);

  updateInterval = null;
  drawInterval = null;
}
