"use strict";

var util = {
  /* IMPORTED */
  getLineCircleIntersectionPoints: function(circlePosition, circleRadius, linePoint1, linePoint2) {
    let circle = {
      radius: circleRadius,
      center: {
        x: circlePosition.x,
        y: circlePosition.y
      }
    };
    let line = {
      p1: {
        x: linePoint1.x,
        y: linePoint1.y
      },
      p2: {
        x: linePoint2.x,
        y: linePoint2.y
      }
    };
    var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
    v1 = {};
    v2 = {};
    v1.x = line.p2.x - line.p1.x;
    v1.y = line.p2.y - line.p1.y;
    v2.x = line.p1.x - circle.center.x;
    v2.y = line.p1.y - circle.center.y;
    b = (v1.x * v2.x + v1.y * v2.y);
    c = 2 * (v1.x * v1.x + v1.y * v1.y);
    b *= -2;
    d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius));
    if(isNaN(d)){ // no intercept
        return [];
    }
    u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
    u2 = (b + d) / c;    
    retP1 = {};   // return points
    retP2 = {}  
    ret = []; // return array
    if(u1 <= 1 && u1 >= 0){  // add point if on the line segment
        retP1.x = line.p1.x + v1.x * u1;
        retP1.y = line.p1.y + v1.y * u1;
        ret[0] = retP1;
    }
    if(u2 <= 1 && u2 >= 0){  // second add point if on the line segment
        retP2.x = line.p1.x + v1.x * u2;
        retP2.y = line.p1.y + v1.y * u2;
        ret[ret.length] = retP2;
    }       
    return ret;
  },
  /* IMPORTED */
  download: function(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
  },
  /**
    * Возвращает смещённое до maxStep или меньше значение переменной variable.
    * Если значение выходит за пределы min/max, то возвращается значение min/max.
    * 
    * Returns a value from 1st argument shifted to maxStep or less.
    * If the value goes beyond min/max, it returns min/max
    * 
    * @param variable variable to shift
    * @param maxStep the hightest value to shift
    * @param min minimum value to return
    * @param max maximum value to return
    */
  mutateVariable: function(variable, maxStep, min, max) {
    let result = variable + maxStep*(1 - 2*Math.random());
    if (result < min) result = min;
    else if (result > max) result = max;
    return result;
  },
  /**
    * Находит точку перпендикуляра, опущенного на линию из точки perpendicularPoint.
    * Если этой точки нет, возвращает null.
    *
    * Finds the point of the perpendicular dropped on the line from the perpendicularPoint.
    * If this point doesn't exist, it returns null.
    * 
    * @param linePoint1 first point of line
    * @param linePoint2 second point of line
    * @param perpendicularPoint point to drop perpendicular from
    */
  getLinePerpendicularIntersectionPoint: function(linePoint1, linePoint2, perpendicularPoint) {
    var angleRatio = (linePoint2.y - linePoint1.y) / (linePoint2.x - linePoint1.x);
    if (angleRatio == Infinity || angleRatio == -Infinity) {
      // If the wall is vertical (or linePoint1.x == linePoint2.x)
      intersection = {x: linePoint1.x};
      intersection.y = perpendicularPoint.y;
      let avgY = (linePoint1.y + linePoint2.y)/2;
      let height = Math.abs(linePoint1.y - linePoint2.y);
      if (Math.abs(intersection.y - avgY) <= height/2)
        return intersection;
      else
        return null;
    }

    var wallLineOffset = linePoint1.y - angleRatio * linePoint1.x;
    var perpendicularOffset = perpendicularPoint.y - ( -angleRatio * perpendicularPoint.x );

    /* Точка перпендикуляра опущенного на ПРЯМУЮ, образованную двумя точками */
    var intersection = new Object(null);
    if (angleRatio == 0)
      intersection.x = perpendicularPoint.x
    else
      intersection = { x: (perpendicularOffset - wallLineOffset) / 2*angleRatio };
    intersection.y = angleRatio*intersection.x + wallLineOffset;

    var avgPoint = {
      x: (linePoint1.x + linePoint2.x)/2,
      y: (linePoint1.y + linePoint2.y)/2
    };
    var lineRect = {
      width: Math.abs(linePoint1.x - linePoint2.x),
      height: Math.abs(linePoint1.y - linePoint2.y)
    };

    if (Math.abs(intersection.x - avgPoint.x) <= lineRect.width/2 && Math.abs(intersection.y - avgPoint.y) <= lineRect.height/2)
      return intersection;
    else
      return null;
  },
  /**
   * Возвращает точку пересечения двух линий. Если точки нет, возвращает null.
   * 
   * Returns intersection point of two lines. If it doesn't exist, returns null.
   * 
   * @param line1Point1 first point of first line
   * @param line1Point2 second point of first line
   * @param line2Point1 first point of second line
   * @param line2Point2 second point of second line
   */
  getLinesIntersectionPoint: function(line1Point1, line1Point2, line2Point1, line2Point2) {
    var angle1Ratio = (line1Point2.y - line1Point1.y) / (line1Point2.x - line1Point1.x);
    var angle2Ratio = (line2Point2.y - line2Point1.y) / (line2Point2.x - line2Point1.x);

    if (
      (angle1Ratio != angle1Ratio || angle2Ratio != angle2Ratio) ||
      (Math.abs(angle1Ratio) == Infinity && Math.abs(angle2Ratio) == Infinity) ||
      (angle1Ratio == angle2Ratio)
    ) return null;

    // If the first line is vertical (line1Point1.x == line1Point2.x)
    if (angle1Ratio == Infinity || angle1Ratio == -Infinity) {
      let intersection = {x: line1Point1.x};
      let line2Offset = line2Point1.y - angle2Ratio * line2Point1.x
      intersection.y = angle2Ratio * intersection.x + line2Offset;

      if (
        (line2Point1.x < intersection.x && line2Point2.x < intersection.x) ||
        (line2Point1.x > intersection.x && line2Point2.x > intersection.x)
      ) return null;

      let avgY = (line1Point1.y + line1Point2.y)/2;
      let height = Math.abs(line1Point1.y - line1Point2.y);
      if (Math.abs(intersection.y - avgY) <= height/2)
        return intersection;
      else
        return null;
    }

    // If the second line is vertical (line2Point1.x == line2Point2.x)
    if (angle2Ratio == Infinity || angle2Ratio == -Infinity) {
      let intersection = {x: line2Point1.x};
      let line1Offset = line1Point1.y - angle1Ratio * line1Point1.x
      intersection.y = angle1Ratio * intersection.x + line1Offset;

      if (
        (line1Point1.x < intersection.x && line1Point2.x < intersection.x) ||
        (line1Point1.x > intersection.x && line1Point2.x > intersection.x)
      ) return null;

      let avgY = (line2Point1.y + line2Point2.y)/2;
      let height = Math.abs(line2Point1.y - line2Point2.y);
      if (Math.abs(intersection.y - avgY) <= height/2)
        return intersection;
      else
        return null;
    }

    let line2Offset = line2Point1.y - angle2Ratio * line2Point1.x;
    let line1Offset = line1Point1.y - angle1Ratio * line1Point1.x;

    // Точка пересечения двух ПРЯМЫХ, образованных отрезками
    let intersection = { x: ( line2Offset - line1Offset ) / ( angle1Ratio - angle2Ratio ) };
    intersection.y = angle1Ratio * intersection.x + line1Offset;

    // Проверка, лежит ли точка на обоих отрезках
    var avg1Point = {
      x: (line1Point1.x + line1Point2.x)/2,
      y: (line1Point1.y + line1Point2.y)/2
    };
    var line1Rect = {
      width: Math.abs(line1Point1.x - line1Point2.x),
      height: Math.abs(line1Point1.y - line1Point2.y)
    };
    var avg2Point = {
      x: (line2Point1.x + line2Point2.x)/2,
      y: (line2Point1.y + line2Point2.y)/2
    };
    var line2Rect = {
      width: Math.abs(line2Point1.x - line2Point2.x),
      height: Math.abs(line2Point1.y - line2Point2.y)
    };

    if (
      Math.abs(intersection.x - avg1Point.x) <= line1Rect.width/2 &&
      Math.abs(intersection.y - avg1Point.y) <= line1Rect.height/2 &&
      Math.abs(intersection.x - avg2Point.x) <= line2Rect.width/2 &&
      Math.abs(intersection.y - avg2Point.y) <= line2Rect.height/2
    )
      return intersection;
    else
      return null;
  }
};