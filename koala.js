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

function KttM(options) {
  // Set defaults
  options = options || {};
  options.selector = options.selector || 'body';
  options.onDone   = options.onDone   || function() {};

  var canvas = document.createElement('canvas').getContext('2d');
  var x, y;
  var size = 512,
      minDiam = 4;

  var dim  = size / minDiam;

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

  // Some people tend to try and click the circles.
  var numClicks = 0;
  function onCircleClick() {
    numClicks++;
    if (numClicks !== 5) return;
    alert("You don't have to click, you can just mouse over. :-)");
  }

  // Create the SVG ellement
  var vis = d3.select(options.selector)
    .append("svg:svg")
      .attr("width", size)
      .attr("height", size);

  // Find out if all the circles have been oppened
  var doneCheckNeeded = false;
  var doneInterval = setInterval(function() {
    if (!doneCheckNeeded) return;
    doneCheckNeeded = false;
    if (leftToOpen.length > 0) return;
    options.onDone();
    clearInterval(doneInterval);
  }, 100);

  function split(x, y, d) {
    var classStr = 'c' + [x,y,d].join('_');
    vis.select('circle.' + classStr).remove();
    leftToOpen.splice(leftToOpen.indexOf(classStr), 1);

    addCircle(2*x,   2*y,   d+1);
    addCircle(2*x+1, 2*y,   d+1);
    addCircle(2*x,   2*y+1, d+1);
    addCircle(2*x+1, 2*y+1, d+1);
  }

  function addCircle(x, y, d) {
    var params = [x,y,d];

    var unit = size / Math.pow(2,d);
    var half = unit / 2;
    var classStr = 'c'+params.join('_');

    var circle = vis.append('svg:circle')
      .attr('class', classStr);

    leftToOpen.push(classStr);

    function finish(circle) {
      if (unit > minDiam) {
        if (!circle) circle = d3.select(this);
        circle
          .on('mouseover', function() { split(x, y, d); })
          .on('click', onCircleClick);
      }
      doneCheckNeeded = true;
    }

    if (d > 0) {
      var xOld = Math.floor(x / 2);
      var yOld = Math.floor(y / 2);
      var dOld = d - 1;
      var unitOld = size / Math.pow(2, dOld);
      var halfOld = unitOld / 2;
      var clsOld = 'c'+[xOld,yOld,dOld].join('_');

      circle = circle
        .attr('cx', unitOld * xOld + halfOld)
        .attr('cy', unitOld * yOld + halfOld)
        .attr('r', halfOld)
        .attr('fill', 'rgb(' + colorHash[clsOld].map(Math.round).join(',') + ')')
        .attr('fill-opacity', 0.68)
          .transition()
          .duration(300);
    } else {
      circle = circle
        .attr('cx', unit * x + half)
        .attr('cy', unit * y + half)
        .attr('r', 4)
        .attr('fill', 'rgb(255,255,255)')
          .transition()
          .duration(2000);
    }

    circle
      .attr('cx', unit * x + half)
      .attr('cy', unit * y + half)
      .attr('r', half)
      .attr('fill', 'rgb(' + colorHash[classStr].map(Math.round).join(',') + ')')
      .attr('fill-opacity', 1)
      .each("end", finish);
  }

  function loadImage(imageData) {
    try {
      canvas.drawImage(imageData, 0, 0, dim, dim);
      data = canvas.getImageData(0, 0, dim, dim).data;
    } catch(e) {
      alert("Failed to load image.");
      return;
    }
    var depth = Math.round(Math.log(dim) / Math.log(2));

    colorHash = {};

    var t = 0;
    for (y = 0; y < dim; y++) {
      for (x = 0; x < dim; x++) {
        var col = [data[t], data[t+1], data[t+2]];
        colorHash['c' + [x,y,depth].join('_')] = col;
        t += 4;
      }
    }

    level = dim;
    do {
      level /= 2;
      depth--;
      for (y = 0; y < level; y++) {
        for (x = 0; x < level; x++) {
          colorHash['c' + [x,y,depth].join('_')] = avgCol(
            colorHash['c' + [2*x  ,2*y  ,depth+1].join('_')],
            colorHash['c' + [2*x+1,2*y  ,depth+1].join('_')],
            colorHash['c' + [2*x  ,2*y+1,depth+1].join('_')],
            colorHash['c' + [2*x+1,2*y+1,depth+1].join('_')]
          );
        }
      }
    } while(level > 1);

    addCircle(0, 0, 0);
  }

  return loadImage;
};



