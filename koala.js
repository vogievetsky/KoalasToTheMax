"use strict"

/*
* Made with love by Vadim Ogievetsky for Annie Albagli (Valentine's Day 2011)
* Powered by Mike Bostock's D3
*
* For me on GitHub:  https://github.com/vogievetsky/KoalasToTheMax
* License: MIT  [ http://koalastothemax.com/LICENSE ]
*
* If you are reading this then I have an easter egg for you:
* You can use your own custom image as the source, simply type in:
* http://koalastothemax.com?<your image url>
* e.g.
* http://koalastothemax.com?http://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Flag_of_the_United_Kingdom.svg/200px-Flag_of_the_United_Kingdom.svg.png
*
* also if you want to use a custom image and want people to guess what it is
* (without seeing the url) then you can type the url in base64 encoding like so:
* http://koalastothemax.com?<your image url in base64>
* e.g.
* http://koalastothemax.com?YXN0bGV5LmpwZw==
* (try to guess the image above)
*/

var koala = {
  version: '1.8.2'
};

(function() {
  function array2d(w, h) {
    var a = [];
    return function(x, y, v) {
      if (x < 0 || y < 0) return void 0;
      if (arguments.length === 3) {
        // set
        return a[w * x + y] = v;
      } else if (arguments.length === 2) {
        // get
        return a[w * x + y];
      } else {
        throw new TypeError("Bad number of arguments");
      }
    }
  }

  // Find the color average of 4 colors in the RGB colorspace
  function avgColor(x, y, z, w) {
    return [
      (x[0] + y[0] + z[0] + w[0]) / 4,
      (x[1] + y[1] + z[1] + w[1]) / 4,
      (x[2] + y[2] + z[2] + w[2]) / 4
    ];
  }

  koala.supportsCanvas = function() {
    var elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));
  };

  koala.supportsSVG = function() {
    return !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect;
  };

  function Circle(vis, xi, yi, size, color, children, layer, onSplit) {
    this.vis = vis;
    this.x = size * (xi + 0.5);
    this.y = size * (yi + 0.5);
    this.size = size;
    this.color = color;
    this.rgb = d3.rgb(color[0], color[1], color[2]);
    this.children = children;
    this.layer = layer;
    this.onSplit = onSplit;
  }

  Circle.prototype.isSplitable = function() {
    return this.node && this.children
  }

  Circle.prototype.split = function() {
    if (!this.isSplitable()) return;
    d3.select(this.node).remove();
    delete this.node;
    Circle.addToVis(this.vis, this.children);
    this.onSplit(this);
  }

  Circle.prototype.checkIntersection = function(startPoint, endPoint) {
    var edx = this.x - endPoint[0],
        edy = this.y - endPoint[1],
        sdx = this.x - startPoint[0],
        sdy = this.y - startPoint[1],
        r2  = this.size / 2;

    r2 = r2 * r2; // Radius squared

    // End point is inside the circle and start point is outside
    return edx * edx + edy * edy <= r2 && sdx * sdx + sdy * sdy > r2;
  }

  Circle.addToVis = function(vis, circles, init) {
    var circle = vis.selectAll('.nope').data(circles)
      .enter().append('circle');

    if (init) {
      // Setup the initial state of the initial circle
      circle = circle
        .attr('cx',   function(d) { return d.x; })
        .attr('cy',   function(d) { return d.y; })
        .attr('r', 4)
        .attr('fill', '#ffffff')
          .transition()
          .duration(1000);
    } else {
      // Setup the initial state of the opened circles
      circle = circle
        .attr('cx',   function(d) { return d.parent.x; })
        .attr('cy',   function(d) { return d.parent.y; })
        .attr('r',    function(d) { return d.parent.size / 2; })
        .attr('fill', function(d) { return String(d.parent.rgb); })
        .attr('fill-opacity', 0.68)
          .transition()
          .duration(300);
    }

    // Transition the to the respective final state
    circle
      .attr('cx',   function(d) { return d.x; })
      .attr('cy',   function(d) { return d.y; })
      .attr('r',    function(d) { return d.size / 2; })
      .attr('fill', function(d) { return String(d.rgb); })
      .attr('fill-opacity', 1)
      .each('end',  function(d) { d.node = this; });
  }

  // Main code
  var vis,
      maxSize = 512,
      minSize = 4,
      dim = maxSize / minSize;

  koala.loadImage = function(imageData) {
    // Create a canvas for image data resizing and extraction
    var canvas = document.createElement('canvas').getContext('2d');
    // Draw the image into the corner, resizing it to dim x dim
    canvas.drawImage(imageData, 0, 0, dim, dim);
    // Extract the pixel data from the same area of canvas
    // Note: This call will throw a security exception if imageData
    // was loaded from a different domain than the script.
    return canvas.getImageData(0, 0, dim, dim).data;
  };

  koala.makeCircles = function(selector, colorData, onEvent) {
    onEvent = onEvent || function() {};

    var splitableByLayer = [],
        splitableTotal = 0,
        nextPercent = 0;

    function onSplit(circle) {
      // manage events
      var layer = circle.layer;
      splitableByLayer[layer]--;
      if (splitableByLayer[layer] === 0) {
        onEvent('LayerClear', layer);
      }

      var percent = 1 - d3.sum(splitableByLayer) / splitableTotal;
      if (percent >= nextPercent) {
        onEvent('PercentClear', Math.round(nextPercent * 100));
        nextPercent += 0.05;
      }
    }

    // Make sure that the SVG exists and is empty
    if (!vis) {
      // Create the SVG ellement
      vis = d3.select(selector)
        .append("svg")
          .attr("width", maxSize)
          .attr("height", maxSize);
    } else {
      vis.selectAll('circle')
        .remove();
    }

    // Got the data now build the tree
    var finestLayer = array2d(dim, dim);
    var size = minSize;

    // Start off by populating the base (leaf) layer
    var xi, yi, t = 0, color;
    for (yi = 0; yi < dim; yi++) {
      for (xi = 0; xi < dim; xi++) {
        color = [colorData[t], colorData[t+1], colorData[t+2]];
        finestLayer(xi, yi, new Circle(vis, xi, yi, size, color));
        t += 4;
      }
    }

    // Build up successive nodes by grouping
    var layer, prevLayer = finestLayer;
    var c1, c2, c3, c4, currentLayer = 0;
    while (size < maxSize) {
      dim /= 2;
      size = size * 2;
      layer = array2d(dim, dim);
      for (yi = 0; yi < dim; yi++) {
        for (xi = 0; xi < dim; xi++) {
          c1 = prevLayer(2 * xi    , 2 * yi    );
          c2 = prevLayer(2 * xi + 1, 2 * yi    );
          c3 = prevLayer(2 * xi    , 2 * yi + 1);
          c4 = prevLayer(2 * xi + 1, 2 * yi + 1);
          color = avgColor(c1.color, c2.color, c3.color, c4.color);
          c1.parent = c2.parent = c3.parent = c4.parent = layer(xi, yi,
            new Circle(vis, xi, yi, size, color, [c1, c2, c3, c4], currentLayer, onSplit)
          );
        }
      }
      splitableByLayer.push(dim * dim);
      splitableTotal += dim * dim;
      currentLayer++;
      prevLayer = layer;
    }

    // Create the initial circle
    Circle.addToVis(vis, [layer(0, 0)], true);

    // Interaction helper functions
    function splitableCircleAt(pos) {
      var xi = Math.floor(pos[0] / minSize),
          yi = Math.floor(pos[1] / minSize),
          circle = finestLayer(xi, yi);
      if (!circle) return null;
      while (circle && !circle.isSplitable()) circle = circle.parent;
      return circle || null;
    }

    function intervalLength(startPoint, endPoint) {
      var dx = endPoint[0] - startPoint[0],
          dy = endPoint[1] - startPoint[1];

      return Math.sqrt(dx * dx + dy * dy);
    }

    function breakInterval(startPoint, endPoint, maxLength) {
      var breaks = [],
          length = intervalLength(startPoint, endPoint),
          numSplits = Math.max(Math.ceil(length / maxLength), 1),
          dx = (endPoint[0] - startPoint[0]) / numSplits,
          dy = (endPoint[1] - startPoint[1]) / numSplits,
          startX = startPoint[0],
          startY = startPoint[1];

      for (var i = 0; i <= numSplits; i++) {
        breaks.push([startX + dx * i, startY + dy * i]);
      }
      return breaks;
    }

    function findAndSplit(startPoint, endPoint) {
      var breaks = breakInterval(startPoint, endPoint, 4);
      var circleToSplit = []

      for (var i = 0; i < breaks.length - 1; i++) {
        var sp = breaks[i],
            ep = breaks[i+1];

        var circle = splitableCircleAt(ep);
        if (circle && circle.isSplitable() && circle.checkIntersection(sp, ep)) {
          circle.split();
        }
      }
    }

    // Handle mouse events
    var prevMousePosition = null;
    function onMouseMove() {
      var mousePosition = d3.mouse(vis.node());

      // Do nothing if the mouse point is not valid
      if (isNaN(mousePosition[0])) {
        prevMousePosition = null;
        return;
      }

      if (prevMousePosition) {
        findAndSplit(prevMousePosition, mousePosition);
      }
      prevMousePosition = mousePosition;
      d3.event.preventDefault();
    }

    // Handle touch events
    var prevTouchPositions = {};
    function onTouchMove() {
      var touchPositions = d3.touches(vis.node());
      for (var touchIndex = 0; touchIndex < touchPositions.length; touchIndex++) {
        var touchPosition = touchPositions[touchIndex];
        var prevTouchPosition = prevTouchPositions[touchPosition.identifier]
        if (prevTouchPosition) {
          findAndSplit(prevTouchPosition, touchPosition);
        }
        prevTouchPositions[touchPosition.identifier] = touchPosition;
      }
      d3.event.preventDefault();
    }

    function onTouchEnd() {
      var touches = d3.event.changedTouches;
      for (var touchIndex = 0; touchIndex < touches.length; touchIndex++) {
        var touch = touches.item(touchIndex);
        prevTouchPositions[touch.identifier] = null;
      }
      d3.event.preventDefault();
    }

    // Initialize interaction
    d3.select(document.body)
      .on('mousemove.koala', onMouseMove)
      .on('touchmove.koala', onTouchMove)
      .on('touchend.koala', onTouchEnd)
      .on('touchcancel.koala', onTouchEnd);
  };
})();
