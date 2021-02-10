"use strict";

var Player = function(data) {
  if (!data) data = {};
  var size = data.size || 30;
  var fov = data.fov || 75;
  var rays = data.rays || 10;
  var visionDistance = data.visionDistance || 5;

  var position = data.position || {x: 0, y: 0};
  var prevPosition = data.prevPosition || {x: position.x, y: position.y};
  var rotation = data.rotation;

  var energy = data.energy || 100;
  var maxEnergy = data.energy || 100;
  var fitness = 0;

  var killed = false;

  var color = data.color || {red: Math.random()*255, green: Math.random()*255, blue: Math.random()*255};

  var neuralNetwork = data.neuralNetwork || new NeuralNetwork({
    inputs: 2*rays+2,
    maxInitialWeight: data.maxSynapseWeight,
    hiddenLayers: data.hiddenLayers,
    layerNeurons: data.layerNeurons,
    outputs: 4
  });

  var ID = Date.now()*Math.random();

  var enemyRayData = [];
  var wallRayData = [];
  for (var a = 0; a < rays; a++) {
    enemyRayData.push(0);
    wallRayData.push(0);
  }

  this.getSize = function() {return size};
  this.getFOV = function() {return fov};
  this.getRays = function() {return rays};

  this.getEnergy = function() {return energy};
  this.setEnergy = function(e) {energy = e};
  this.getX = function() {return position.x};
  this.setX = function(x) {if (x == x) position.x = x;};
  this.getY = function() {return position.y};
  this.setY = function(y) {if (y == y) position.y = y};
  this.getPosition = function() {return position};
  this.setPosition = function(x, y) {if (x == x) position.x = x; if (y == y) position.y = y};
  this.getRotation = function() {return rotation};
  this.setRotation = function(r) {if (r == r) rotation = r};
  this.getVisionDistance = function() {return visionDistance};
  this.setVisionDistance = function(value) {if (value == value) visionDistance = value};

  this.getLeftBound = function() {return position.x - this.getSize()};
  this.setLeftBound = function(lb) {if (lb == lb) position.x = lb + this.getSize()};
  this.getRightBound = function() {return position.x + this.getSize()};
  this.setRightBound = function(rb) {if (rb == rb) position.x = rb - this.getSize()};
  this.getTop = function() {return position.y - this.getSize()};
  this.setTop = function(t) {if (t == t) position.y = t + this.getSize()};
  this.getBottom = function() {return position.y + this.getSize()};
  this.setBottom = function(b) {if (b == b) position.y = b - this.getSize()};  

  this.getFitness = function() {return fitness};
  this.setFitness = function(f) {fitness = f};
  this.giveFitness = function(f) {fitness += f};
  
  this.isKilled = function() {return killed};
  this.kill = function() {
    killed = true;
    for (var i = 0; i < state.bullets.length; i++)
      if (!state.bullets[i].getOwnerID() || state.bullets[i].getOwnerID() == this.getID())
        state.bullets[i].destroy();
  };
  
  this.getID = function() {return ID};
  this.setID = function(id) {ID = id};
  
  this.getEnergy = function() {return energy};

  this.getColorString = function() {return `rgb(${color.red}, ${color.green}, ${color.blue})`};
  this.getTextColor = function() {return (color.red+color.green+color.blue)/3 > 128 ? 'black' : 'white'}

  this.getCopy = function() {
    return new Player({
      size: size,
      fov: fov,
      rays: rays,
      visionDistance: visionDistance,
      position: {x: position.x, y: position.y},
      prevPosition: {x: prevPosition.x, y: prevPosition.y},
      rotation: rotation,
      color: {red: color.red, green: color.green, blue: color.blue},
      neuralNetwork: neuralNetwork.getCopy()
    });
  }

  this.getState = function() {
    return {
      size: size,
      fov: fov,
      rays: rays,
      visionDistance: visionDistance,
      position: {x: position.x, y: position.y},
      prevPosition: {x: prevPosition.x, y: prevPosition.y},
      rotation: rotation,
      energy: energy,
      maxEnergy: maxEnergy,
      color: {red: color.red, green: color.green, blue: color.blue},
      neuralNetwork: neuralNetwork.getState(),
      enemyRayData: enemyRayData.slice(0),
      wallRayData: wallRayData.slice(0),
      killed: killed,
      ID: ID
    };
  }

  this.setState = function(state) {
    size = state.size;
    fov = state.fov;
    rays = state.rays;
    visionDistance = state.visionDistance;
    position = {x: state.position.x, y: state.position.y};
    rotation = state.rotation;
    energy = state.energy;
    maxEnergy = state.maxEnergy;
    color = {red: state.color.red, green: state.color.green, blue: state.color.blue};
    neuralNetwork.setState(state.neuralNetwork);
    enemyRayData = state.enemyRayData.slice(0);
    wallRayData = state.wallRayData.slice(0);
    killed = state.killed;
    ID = state.ID;
    return this;
  }

  this.getEnemyRayData = function() {
    return enemyRayData;
  }
  this.getWallRayData = function() {
    return wallRayData;
  }
  this.updateRayData = function() {
    for (let ray = 0; ray < enemyRayData.length; ray++) {
      enemyRayData[ray] = 0;
      
      for (var player = 0; player < state.players.length; player++) {
        if (state.players[player] === this || state.players[player].isKilled()) continue;

        let rayAngle = (this.getRotation() - this.getFOV()/2 + this.getFOV()/this.getRays()*(ray+0.5))*Math.PI/180;
        let x0 = this.getX() + Math.cos(rayAngle)*this.getSize();
        let y0 = this.getY() + Math.sin(rayAngle)*this.getSize();
        let x1 = this.getX() + Math.cos(rayAngle)*this.getSize()*(this.getVisionDistance()+1);
        let y1 = this.getY() + Math.sin(rayAngle)*this.getSize()*(this.getVisionDistance()+1);
        let intersectionPoints = util.getLineCircleIntersectionPoints(
          state.players[player].getPosition(),
          state.players[player].getSize(),
          {x: x0, y: y0},
          {x: x1, y: y1}
        );

        if (intersectionPoints.length === 1) {
          let collision = intersectionPoints[0];
          let distance = Math.sqrt(Math.pow(x0 - collision.x, 2) + Math.pow(y0 - collision.y, 2));
          let maxDistance = Math.sqrt(Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2));
          enemyRayData[ray] = Math.max(enemyRayData[ray], (1 - distance/maxDistance));
        }
        else if (intersectionPoints.length === 2) {
          let collision1 = intersectionPoints[0];
          let collision2 = intersectionPoints[1];
          let distance1 = Math.sqrt(Math.pow(x0 - collision1.x, 2) + Math.pow(y0 - collision1.y, 2));
          let distance2 = Math.sqrt(Math.pow(x0 - collision2.x, 2) + Math.pow(y0 - collision2.y, 2));
          let maxDistance = Math.sqrt(Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2));
          enemyRayData[ray] = Math.max(enemyRayData[ray], (1 - (distance1 < distance2 ? distance1 : distance2)/maxDistance));
        }
      }
    }

    for (let ray = 0; ray < wallRayData.length; ray++) {
      wallRayData[ray] = 0;
      for (let w = 0; w < state.walls.length; w++) {
        let wall = state.walls[w];

        let rayAngle = (this.getRotation() - this.getFOV()/2 + this.getFOV()/this.getRays()*(ray+0.5))*Math.PI/180;
        let x0 = this.getX() + Math.cos(rayAngle)*this.getSize();
        let y0 = this.getY() + Math.sin(rayAngle)*this.getSize();
        let x1 = this.getX() + Math.cos(rayAngle)*this.getSize()*(this.getVisionDistance()+1);
        let y1 = this.getY() + Math.sin(rayAngle)*this.getSize()*(this.getVisionDistance()+1);

        let intersection = util.getLinesIntersectionPoint(
          wall.getPoint1(),
          wall.getPoint2(),
          {x: x0, y: y0},
          {x: x1, y: y1}
        );

        if (!intersection) continue;

        let distance = Math.sqrt(Math.pow(x0 - intersection.x, 2) + Math.pow(y0 - intersection.y, 2));
        let maxDistance = Math.sqrt(Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2));
        wallRayData[ray] = Math.max(wallRayData[ray], 1 - distance/maxDistance);
      }
      if (wallRayData[ray] > enemyRayData[ray]) enemyRayData[ray] = 0;
    }
  };

  this.move = function(forward, right) {
    energy -= Math.sqrt(Math.pow(position.x - prevPosition.x, 2) + Math.pow(position.y - prevPosition.y, 2))*getControlsData('player-move-cost');

    prevPosition.x = position.x;
    prevPosition.y = position.y;
    
    let angle = rotation/180*Math.PI;
    position.x += Math.cos(angle)*forward + Math.cos(angle+Math.PI/2)*right;
    position.y += Math.sin(angle)*forward + Math.sin(angle+Math.PI/2)*right;
  };

  this.rotate = function(dr) {
    rotation = (rotation + dr)%360;
    energy -= Math.abs(dr)*getControlsData('player-rotate-cost');
  };

  this.mutate = function(maxStep) {
    size = util.mutateVariable(size, 1*maxStep, 5, 150);
    fov = util.mutateVariable(fov, 1*maxStep, 15, 180);
    color.red = util.mutateVariable(color.red, 15*maxStep, 0, 255);
    color.green = util.mutateVariable(color.green, 15*maxStep, 0, 255);
    color.blue = util.mutateVariable(color.blue, 15*maxStep, 0, 255);
    visionDistance = util.mutateVariable(visionDistance, 0.5*maxStep, 0.5, 100);
    neuralNetwork.mutate(maxStep);
  };

  this.shoot = function() {
    energy -= getControlsData('player-shot-cost');
    state.bullets.push(new Bullet({
      x: position.x + Math.cos(this.getRotation()/180*Math.PI)*(this.getSize()),
      y: position.y + Math.sin(this.getRotation()/180*Math.PI)*(this.getSize()),
    }, this.getRotation(), this.getSize()/10, this.getSize()/10, this.getID()));
  };

  this.update = function(delta) {
    if (killed) return;

    this.updateRayData();

    energy -= getControlsData('player-live-cost')*delta;

    let request = [1].concat(energy/maxEnergy).concat(enemyRayData).concat(wallRayData);
    let response = neuralNetwork.getResponse(request);

    this.move(response[0]*delta*100, response[1]*delta*100);
    this.rotate( response[2]*delta*10 );

    if (response[3] > 0.6) this.shoot();
    if (energy <= 0) this.kill();
  };

  this.draw = function(canvas, ctx) {
    if (killed) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.beginPath();
      ctx.arc(this.getX(), this.getY(), this.getSize(), 0, 2*Math.PI);
      ctx.fill();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.font = `${this.getSize()/2}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText('F' + Math.round(this.getFitness()*10)/10, this.getX(), this.getY());
      return;
    }

    // Circle
    ctx.fillStyle = this.getColorString();
    ctx.strokeStyle = 'grey';
    ctx.beginPath();
    ctx.arc(this.getX(), this.getY(), this.getSize(), 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();

    // Energy & fitness count
    ctx.fillStyle = this.getTextColor();
    ctx.font = `${this.getSize()/2}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText('E' + Math.round(this.getEnergy()), this.getX(), this.getY());
    ctx.textBaseline = "top";
    ctx.fillText('F' + Math.round(this.getFitness()*10)/10, this.getX(), this.getY());

    if (getControlsDataBoolean('show-rays')) {
      // Rays
      let rayGradient = ctx.createRadialGradient(
          this.getX(),
          this.getY(),
          this.getSize(),
          this.getX(),
          this.getY(),
          this.getSize() * (this.getVisionDistance() + 1)
      );
      rayGradient.addColorStop(0, "rgba(0, 0, 0, .08)");
      rayGradient.addColorStop(1, "rgba(0, 0, 0, .04)");

      for (var ray = 0; ray < this.getRays(); ray++) {
        ctx.beginPath();

        let isEnemyRay = this.getWallRayData()[ray] < this.getEnemyRayData()[ray];
        let rayLength = isEnemyRay ? this.getEnemyRayData()[ray] : this.getWallRayData()[ray];

        if (this.getWallRayData()[ray] === 0 && this.getEnemyRayData()[ray] === 0)
          ctx.strokeStyle = rayGradient;
        else
          ctx.strokeStyle = `rgba(${isEnemyRay ? 255 : 0}, 0, ${isEnemyRay ? 0 : 255}, ${.25 + 0.75 * rayLength})`;

        let rayAngle = (this.getRotation() - this.getFOV() / 2 + this.getFOV() / this.getRays() * (ray + 0.5)) * Math.PI / 180;
        ctx.moveTo(
            this.getX() + Math.cos(rayAngle) * this.getSize(),
            this.getY() + Math.sin(rayAngle) * this.getSize()
        );
        ctx.lineTo(
            this.getX() + Math.cos(rayAngle) * this.getSize() * ((this.getVisionDistance()) * (1 - rayLength) + 1),
            this.getY() + Math.sin(rayAngle) * this.getSize() * ((this.getVisionDistance()) * (1 - rayLength) + 1)
        );

        ctx.stroke();
      }
    }
  }
};