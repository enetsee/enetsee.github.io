'use strict';
/* jshint globalstrict: true */
/* global d3,crossfilter,colorbrewer,topojson,worldMap,histogram,timelineAnim*/
function type(d,i) {
  d.index = i;
  d.time = d3.time.format.iso.parse(d.time);
  d.latitude = +d.latitude;
  d.longitude = +d.longitude;
  d.mag = +d.mag;
  d.depth = +d.depth;
  return d;
}

function ready(error,tectonics,world,quakeData) {
  console.log("ready");
  d3.select("#loading").remove();  
  var xf = crossfilter(quakeData);  
  var all = xf.groupAll();
  var dimMag = xf.dimension(function (d) { return Math.max(5.0, Math.min(9.2, d.mag)); } );
  var msrMag = dimMag.group(function (x) { return Math.floor(x * 10) / 10; }).reduceCount();
  var dimLat = xf.dimension(function (d) { return [d.longitude,d.latitude]; });
  // msrLat = dimLat.group().reduceCount();
  var dimDepth = xf.dimension(function (d) { return Math.max(0, Math.min(750, d.depth)); } );
  var msrDepth = dimDepth.group(function (x) { return Math.floor(x / 25) * 25; }).reduceCount();
  var dimDate = xf.dimension(function (d) { return d.time; });
  var msrDate = dimDate.group(d3.time.year).reduceCount();
  var quakes = worldMap(tectonics,world)
    .dimension(dimLat)
    .reset(function() { window.reset(0); })
    .filterElem("#filters");

  var magnitude = histogram()
    .title("Magnitude")
    .dimension(dimMag)
    .measure(msrMag)
    .brushRound(function (x) { return  Math.round(x * 10) / 10; } )
    .brushFloor(function (x) { return Math.floor(x * 10) / 10 ; } )
    .brushCeil(function (x) { return Math.ceil(x * 10) / 10; } )
    .xgrid(d3.svg.axis().ticks(9))
    .xaxis(d3.svg.axis().ticks(9).tickSize(4,0))
    .scale_x( d3.scale.linear().domain([5.0,9.5]).rangeRound([0,10*42]) )
    .scale_y(d3.scale.pow().exponent(0.5).range([100,0]))
    .filterTextFormat(d3.format(".1f"))
    .filterElem("#filters")
    .reset(function() { window.reset(1); })
    .filter([6.5,9.5]);
  var depth = histogram()
    .title("Depth (km)")
    .dimension(dimDepth)
    .measure(msrDepth)
    .brushRound(function (x) { return  Math.round(x / 25) * 25; } )
    .brushFloor(function (x) { return Math.floor(x / 25) * 25 ; } )
    .brushCeil(function (x) { return Math.ceil(x / 25) * 25; } )
    .xgrid(d3.svg.axis().ticks(14))
    .xaxis(d3.svg.axis().ticks(14).tickSize(4,0))
    .scale_x( d3.scale.linear().domain([0,750]).rangeRound([0,10*42]) )
    .scale_y(d3.scale.pow().exponent(0.5).range([100,0]))
    .filterTextFormat(d3.format(".1f"))
    .reset(function() { window.reset(2); })
    .filterElem("#filters")
    .filter([0,50]);
  var startDate = d3.time.day.floor(dimDate.bottom(1)[0].time);
  var endDate = d3.time.day.ceil(dimDate.top(1)[0].time);
  var timeline = histogram()
    .dimension(dimDate)
    .measure(msrDate)
    .title("Event Date")
    .brushRound(d3.time.year.round)
    .brushFloor(d3.time.year.floor)
    .brushCeil(d3.time.year.ceil)
    .xgrid(d3.svg.axis().ticks(d3.time.year,5))
    .xaxis(d3.svg.axis().ticks(d3.time.year,5).tickSize(4,0))
    .scale_x(
        d3.time.scale()
        .domain([d3.time.year(startDate),d3.time.year.ceil(endDate)])
        .rangeRound([0,10 * 90])
    )
    .scale_y(d3.scale.linear().range([120,0]))
    .filterTextFormat(d3.time.format("%Y"))
    .reset(function() { window.reset(3); })
    .filterElem("#filters")     
    .filter([new Date(2005, 1, 1), new Date(2015, 1, 1)]);

  var charts = [quakes, magnitude, depth, timeline];
  var chart = d3.selectAll(".chart")
    .data(charts)
    .each(function(chart) { chart.on("brush",renderAll).on("brushend", renderAll); });
    renderAll();
  function render(method) { d3.select(this).call(method); }
  function renderAll() {
    chart.each(render);    
  }

  window.reset = function(i) {
    charts[i].filter(null);
    renderAll();
  };

  window.filter = function(filters) {
    filters.forEach(function(d, i) { charts[i].filter(d); });
    renderAll();
  };
  function nextYear(dt) {
    return (d3.time.year.offset(dt,1));
  }
  var anim = timelineAnim(startDate,endDate,nextYear,730+350  ,charts,renderAll);
  d3.select("#anim-play").on("click",anim.play);
  d3.select("#anim-pause").on("click",anim.pause);
  d3.select("#anim-stop").on("click",anim.stop);
}