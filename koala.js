"use strict"

/*
* Made with love by Vadim Ogievetsky for Annie Albagli (Valentine's Day 2011)
* Powered by Mike Bostock's D3
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

var vis,
    maxSize = 512,
    minSize = 4;

// Find the color average of 4 colors in the RGB colorspace
function avgCol(x, y, z, w) {
  return [
    (x[0] + y[0] + z[0] + w[0]) / 4,
    (x[1] + y[1] + z[1] + w[1]) / 4,
    (x[2] + y[2] + z[2] + w[2]) / 4
  ];
}

function colToRGB(col) {
  return 'rgb(' + col.map(Math.round).join(',') + ')';
}

// Some people tend to try and click the circles.
var numClicks = 0;
function onCircleClick() {
  numClicks++;
  if (numClicks !== 5) return;
  //alert("You don't have to click, you can just mouse over. :-)");
}

function loadImage(imageData, onEvent) {
  onEvent = onEvent || function() {};
  var dim  = maxSize / minSize;
  var canvas, data;

  try {
    canvas = document.createElement('canvas').getContext('2d');
    canvas.drawImage(imageData, 0, 0, dim, dim);
    data = canvas.getImageData(0, 0, dim, dim).data;
  } catch(e) {
    alert("Failed to load image.");
    return;
  }

  // Got the data now build the tree
  var prevLayer = {};
  var layer;
  var size = minSize;
  var x, y, t, col;
  var layerNumber = 0
  var layerCount = [];
  var totalCount = 0;

  t = 0;
  for (y = 0; y < dim; y++) {
    for (x = 0; x < dim; x++) {
      col = [data[t], data[t+1], data[t+2]];
      prevLayer[[x,y]] = {
        x:   size * (x + .5),
        y:   size * (y + .5),
        r:   size / 2,
        col: col,
        rgb: colToRGB(col),
        layer: layerNumber
      };
      t += 4;
    }
  }
  layerCount.push(dim * dim);
  totalCount += dim * dim;

  var grid = prevLayer;

  var c1, c2, c3, c4;
  while (size < maxSize) {
    dim /= 2;
    size = size * 2;
    layerNumber++;
    layer = {};
    for (y = 0; y < dim; y++) {
      for (x = 0; x < dim; x++) {
        c1 = prevLayer[[2*x  , 2*y  ]];
        c2 = prevLayer[[2*x+1, 2*y  ]];
        c3 = prevLayer[[2*x  , 2*y+1]];
        c4 = prevLayer[[2*x+1, 2*y+1]];
        col = avgCol(c1.col, c2.col, c3.col, c4.col);
        layer[[x,y]] = c1.parent = c2.parent = c3.parent = c4.parent = {
          x:   size * (x + .5),
          y:   size * (y + .5),
          r:   size / 2,
          col: col,
          rgb: colToRGB(col),
          children: [c1, c2, c3, c4],
          layer: layerNumber
        };
      }
    }
    layerCount.push(dim * dim);
    totalCount += dim * dim;
    prevLayer = layer;
  }

  // Make sure that the svg exists and is empty
  if (!vis) {
    // Create the SVG ellement
    vis = d3.select("div#dots")
      .append("svg")
        .attr("width", maxSize)
        .attr("height", maxSize);
  } else {
    vis.selectAll('circle').remove();
  }

  function split(d) {
    if (!d.node || !d.children) return;
    d3.select(d.node).remove();
    delete d.node;
    addCircles(d.children);

    layerCount[d.layer]--;
    if (layerCount[d.layer] == 0) {
      if (d.layer == 0) {
        onEvent('done')
      }
    }
  }

  function addCircles(circles, init) {
    var circle = vis
      .selectAll('.nope')
        .data(circles)
        .enter().append('circle');

    if (init) {
      // Setup the initial state of the initial circle
      circle = circle
        .attr('cx',   function(d) { return d.x; })
        .attr('cy',   function(d) { return d.y; })
        .attr('r', 4)
        .attr('fill', 'rgb(255,255,255)')
          .transition()
          .duration(1000);
    } else {
      // Setup the initial state of the opened circles
      circle = circle
        .attr('cx',   function(d) { d = d.parent; return d.x; })
        .attr('cy',   function(d) { d = d.parent; return d.y; })
        .attr('r',    function(d) { d = d.parent; return d.r; })
        .attr('fill', function(d) { d = d.parent; return d.rgb; })
        .attr('fill-opacity', 0.68)
          .transition()
          .duration(300);
    }

    // Transition the to the respective final state
    circle
      .attr('cx',   function(d) { return d.x; })
      .attr('cy',   function(d) { return d.y; })
      .attr('r',    function(d) { return d.r; })
      .attr('fill', function(d) { return d.rgb; })
      .attr('fill-opacity', 1)
      .each('end',  function(d) {
          d.node = this;
          d3.select(this).attr('class', 'ready');
        });
  }

  function findBase(pos) {
    var x = Math.floor(pos[0] / minSize),
        y = Math.floor(pos[1] / minSize),
        base = grid[[x,y]];
    if (!base) return null;
    while (base && !base.node) base = base.parent;
    return base || null;
  }

  var posPrev = [];
  function findAndSplit(posFn) {
    return function() {
      var pos = posFn(),
          n = pos.length;

      for (var i = 0; i < n; i++) {
        var p = pos[i];
        var d = findBase(p);
        if (d && d.children) {
          var pp  = posPrev[i] || [0,0],
              dx  = d.x - p[0],
              dy  = d.y - p[1],
              dxp = d.x - pp[0],
              dyp = d.y - pp[1],
              r2  = d.r * d.r;

          if (dx*dx + dy*dy <= r2 && dxp*dxp + dyp*dyp >= r2) split(d);
        }
        posPrev[i] = p;
      }
      d3.event.preventDefault();
    }
  }

  function mouseFn() { return [d3.svg.mouse(vis.node())]; }
  function touchFn() { return d3.svg.touches(vis.node()); }

  d3.select('body')
    .on('mousemove', findAndSplit(mouseFn))
    .on('touchmove', findAndSplit(touchFn));

  // Create the initial circle
  addCircles([layer[[0,0]]], true);
}





