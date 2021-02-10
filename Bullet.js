"use strict";

var Bullet = function(position, rotation, size, damage, ownerID) {
  if (!position) position = {x: 0, y: 0};
  var position = {
    x: position.x,
    y: position.y
  };
  var rotation = rotation || 0;
  var ownerID = ownerID || null;

  var speed = 1000;
  var size = size || 10;
  var damage = damage || 10;

  this.getX = function() {return position.x};
  this.setX = function(x) {position.x = x};
  this.getY = function() {return position.y};
  this.setY = function(y) {position.y = y};
  this.getPosition = function() {return position};
  this.setPosition = function(x, y) {position.x = x; position.y = y;};
  this.getRotation = function() {return rotation};
  this.setRotation = function(r) {rotation = r};
  this.getDamage = function() {return damage};
  this.setDamage = function(d) {damage = d};

  this.getOwnerID = function() {return ownerID};
  this.setOwnerID = function(oid) {ownerID = oid};
  
  this.getSize = function() {return size};

  this.update = function(delta) {
    let angle = rotation/180*Math.PI;
    var prevPosition = {x: position.x, y: position.y};
    this.setX(this.getX() + Math.cos(angle)*speed*delta);
    this.setY(this.getY() + Math.sin(angle)*speed*delta);

    if (this.getX() < 0 || this.getX() > canvas.width || this.getY() < 0 || this.getY() > canvas.height)
      return this.destroy();

    for (let wall of state.walls)
      if (
        util.getLinesIntersectionPoint(
          prevPosition,
          this.getPosition(),
          wall.getPoint1(),
          wall.getPoint2()
        ) ||
        util.getLineCircleIntersectionPoints(
          this.getPosition(),
          this.getSize(),
          wall.getPoint1(),
          wall.getPoint2()
        ).length > 0
      )
        return this.destroy();

    for (let player of state.players) {
      if (
        !player.isKilled() &&
        util.getLineCircleIntersectionPoints(
          player.getPosition(),
          player.getSize() + this.getSize(),
          prevPosition, position
        ).length > 0 &&
        player.getID() !== ownerID
      ) {
        let playerToGiveScore = null;
        if (ownerID) playerToGiveScore = state.getPlayerByID(ownerID);
        if (playerToGiveScore) {
          player.setEnergy(player.getEnergy() - damage);
          if (player.getEnergy() < 0)
            playerToGiveScore.giveFitness(getControlsData('fitness-per-kill'));
        }
        return this.destroy();
      }
    }
  }

  this.draw = function(canvas, ctx) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(this.getX(), this.getY(), this.getSize(), 0, 2*Math.PI);
    ctx.fill();
  }

  this.destroy = function() {
    state.removeBullet(this);
  }

  this.getState = function() {
    return {
      position: {x: position.x, y: position.y},
      rotation: rotation,
      speed: speed,
      size: size,
      ownerID: ownerID
    };
  }

  this.setState = function(state) {
    position = {x: state.position.x, y: state.position.y};
    rotation = state.rotation;
    speed = state.speed;
    size = state.size;
    ownerID = state.ownerID;
    return this;
  }
}