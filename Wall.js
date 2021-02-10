"use strict";

var Wall = function(point1, point2) {
  if (!point1) point1 = {};
  if (!point2) point2 = {};
  var p1 = {
    x: point1.x || 0,
    y: point1.y || 0
  };
  var p2 = {
    x: point2.x || 0,
    y: point2.y || 0
  };

  this.setPoint1 = function(point) {
    p1 = {x: point.x, y: point.y};
  }
  this.setPoint2 = function(point) {
    p2 = {x: point.x, y: point.y};
  }

  this.getPoint1 = function() {
    return p1;
  }
  this.getPoint2 = function() {
    return p2;
  }

  this.getState = function() {
    return {
      point1: {
        x: p1.x,
        y: p1.y
      },
      point2: {
        x: p2.x,
        y: p2.y
      }
    }
  }
  this.setState = function(state) {
    p1 = {
      x: state.point1.x,
      y: state.point1.y
    };
    p2 = {
      x: state.point2.x,
      y: state.point2.y
    }; 
    return this;
  }

  this.draw = function(canvas, ctx) {
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.moveTo(this.getPoint1().x, this.getPoint1().y);
    ctx.lineTo(this.getPoint2().x, this.getPoint2().y);
    ctx.stroke();
  }
}