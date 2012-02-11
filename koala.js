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

var colorHash;
var leftToOpen = [];

// Find the color average of 4 colors in the RGB colorspace
function avgCol(x, y, z, w) {
  return [
    (x[0] + y[0] + z[0] + w[0]) / 4,
    (x[1] + y[1] + z[1] + w[1]) / 4,
    (x[2] + y[2] + z[2] + w[2]) / 4
  ];
}

function dataRGBString(d) {
  return 'rgb(' + colorHash[[d.x, d.y, d.size]].map(Math.round).join(',') + ')';
}

// Some people tend to try and click the circles.
var numClicks = 0;
function onCircleClick() {
  numClicks++;
  if (numClicks !== 5) return;
  //alert("You don't have to click, you can just mouse over. :-)");
}

// Find out if all the circles have been oppened
var doneCheckNeeded = false;
var doneInterval = setInterval(function() {
  if (!doneCheckNeeded) return;
  doneCheckNeeded = false;

  if (!vis
    .selectAll('circle')
    .filter(function(d) { return d.size > minSize; })
    .empty()) return;

  onDone();
  clearInterval(doneInterval);
}, 100);

function split(d) {
  if (d.removed || d.size <= minSize) return;
  d.removed = true;
  d3.select(this).remove();

  var x2 = 2 * d.x;
  var y2 = 2 * d.y;
  var nextSize = d.size / 2;

  addCircles([
    { x: x2,   y: y2,   size: nextSize, parent: d },
    { x: x2+1, y: y2,   size: nextSize, parent: d },
    { x: x2,   y: y2+1, size: nextSize, parent: d },
    { x: x2+1, y: y2+1, size: nextSize, parent: d }
  ])
}

function addCircles(circles, init) {
  for (var i = 0; i < circles.length; i++) {
    var d = circles[i],
        s = d.size;
    d.px = s * (d.x + .5);
    d.py = s * (d.y + .5);
    d.r  = s / 2;
    d.c  = dataRGBString(d);
  }

  var circle = vis
    .selectAll('circle.nope')
      .data(circles)
      .enter().append('circle');

  if (init) {
    // Setup the initial state of the initial circle
    circle = circle
      .attr('cx',   function(d) { return d.px; })
      .attr('cy',   function(d) { return d.py; })
      .attr('r', 4)
      .attr('fill', 'rgb(255,255,255)')
        .transition()
        .duration(1000);
  } else {
    // Setup the initial state of the opened circles
    circle = circle
      .attr('cx',   function(d) { d = d.parent; return d.px; })
      .attr('cy',   function(d) { d = d.parent; return d.py; })
      .attr('r',    function(d) { d = d.parent; return d.r; })
      .attr('fill', function(d) { d = d.parent; return d.c; })
      .attr('fill-opacity', 0.68)
        .transition()
        .duration(300);
  }

  // Transition the to the respective final state
  circle
    .attr('cx',   function(d) { return d.px; })
    .attr('cy',   function(d) { return d.py; })
    .attr('r',    function(d) { return d.r; })
    .attr('fill', function(d) { return d.c; })
    .attr('fill-opacity', 1)
    .each('end', function() { d3.select(this).attr('class', 'ready'); });
}

function onDone() {
  // something cool happens when done
  // ToDo
}

function loadImage(imageData) {
  var x, y;
  var dim  = maxSize / minSize;

  try {
    var canvas = document.createElement('canvas').getContext('2d');
    canvas.drawImage(imageData, 0, 0, dim, dim);
    data = canvas.getImageData(0, 0, dim, dim).data;
  } catch(e) {
    alert("Failed to load image.");
    return;
  }

  colorHash = {};

  var t = 0;
  for (y = 0; y < dim; y++) {
    for (x = 0; x < dim; x++) {
      var col = [data[t], data[t+1], data[t+2]];
      colorHash[[x,y,minSize]] = col;
      t += 4;
    }
  }

  var size = minSize;
  while (size < maxSize) {
    dim /= 2;
    var nextSize = size * 2;
    for (y = 0; y < dim; y++) {
      for (x = 0; x < dim; x++) {
        colorHash[[x,y,nextSize]] = avgCol(
          colorHash[[2*x  , 2*y  , size]],
          colorHash[[2*x+1, 2*y  , size]],
          colorHash[[2*x  , 2*y+1, size]],
          colorHash[[2*x+1, 2*y+1, size]]
        );
      }
    }
    size = nextSize;
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

  var xp, yp;
  function findAndSplit(posFn) {
    return function() {
      var pos = posFn(),
          n = pos.length;

      vis.selectAll('circle.ready')
        .filter(function(d) {
            for (var i = 0; i < n; i++) {
              var p = pos[i],
                  dx = d.px - p[0],
                  dy = d.py - p[1],
                  dxp = d.px - xp,
                  dyp = d.py - yp,
                  s = d.size;
                  r2 = d.r * d.r;

              if (minSize < s
                && dx*dx + dy*dy <= r2
                && dxp*dxp + dyp*dyp > r2) {
                return true;
              }
            }
            return false;
          })
        .each(split);

      xp = x;
      yp = y;
      d3.event.preventDefault();
    }
  }

  function mouseFn() { return [d3.svg.mouse(vis.node())]; }
  function touchFn() { return d3.svg.touches(vis.node()); }

  d3.select('body')
    .on('mousemove', findAndSplit(mouseFn))
    .on('touchmove', findAndSplit(touchFn));

  // Create the initial circle
  addCircles([{x:0, y:0, size:maxSize}], true);
}





