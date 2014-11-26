'use strict';
/* jshint globalstrict: true */
/* global d3,crossfilter,colorbrewer */
function histogram() {
  if(!histogram.id) histogram.id =0;
  var id = histogram.id++;
  // basic formatting
  var margin = {top: 30, right: 20, bottom: 25, left: 20};
  var title;
  // scales
  var scale_x;
  var scale_y;
  // axes
  var xaxis = d3.svg.axis().orient("bottom");
  var xgrid = d3.svg.axis();
  var interactive = true;
  // brush
  var brushDirty;
  var brushRound = function(_) { return _; };
  var brushFloor = function(_) { return _; };
  var brushCeil = function(_) { return _; };
  var brush = d3.svg.brush()
    .on("brushstart.chart",brushstarted)
    .on("brush.chart",brushed)
    .on("brushend.chart",brushended);
  //  crossfiltered data
  var dimension;
  var measure;
  var filter;
  var filterElem;
  var filterTextFormat;
  var reset;
  var svg;
  function chart(elem) {
    var width = scale_x.range()[1];
    var height = scale_y.range()[0];
    scale_y.domain([0, measure.top(1)[0].value ]);
    elem.each(function() {
      var elem = d3.select(this);
      svg = elem.select("g");
      if(svg.empty()) {
        svg = elem
          .append("svg")
          .attr("width", width + margin.right + margin.left)
          .attr("height", height + margin.top + margin.bottom);


        // var grad = svg.append("defs")
        //   .append("linearGradient")
        //   .attr("id","axis-bg-grad")
        //   .attr("x1","0%")
        //   .attr("x2","0%")
        //   .attr("y1","0%")
        //   .attr("y2","100%");

        // grad.append("stop")
        //   .attr("offset","0%")
        //   .style("stop-color","rgb(237,237,237)");

        // grad.append("stop")
        //   .attr("offset","100%")
        //   .style("stop-color","rgb(197,197,197)");



        svg = svg.append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        // chart background
        svg.append("rect").attr("class","chartarea")
          .attr("width", width)
          .attr("height", height);
        // title
        if(title){
        svg.append("g")
          .attr("transform","translate(0," +  (12 - margin.top) + ")")
          .append("text")
          .text(title)
          .attr("class","chart-title");
        }
        // //  ggplot-style grid
        svg.append("g")
          .attr("class", "x grid")
          .attr("transform", "translate(0," + height + ")")
          .call(xgrid.tickSize(-height))
          .selectAll(".tick");
          // .filter(tick_minor_x)
          // .attr("class", "tick minor");
        // create foreground and background geometry
        svg.selectAll(".geom")
          .data(["background","foreground"])
          .enter().append("path")
          .attr("class", function(nm) { return nm + " geom"; })
          .datum(measure.all());
        // create clip path..
        svg.append("clipPath")
          .attr("id","clip-histogram-" + id)
          .append("rect")
          .attr("width",width)
          .attr("height",height);
        //  and apply to foreground geometry
        svg.selectAll(".foreground.geom")
          .attr("clip-path", "url(#clip-histogram-" + id + ")");
        
        // svg.append("g")          
        //   .attr("transform", "translate(0," + height + ")")
        //   .append("rect")
        //   .attr("class","x axis-bg")
        //   .attr("x",-18)
        //   .attr("fill","url(#axis-bg-grad)")
        //   .attr("stroke","rgb(35,35,35)")
        //   .attr("stroke-width","0.5px")
        //   .attr("width",width+36)
        //   .attr("height",22)
        //   .attr("rx",3)
        //   .attr("ry",3);

        // add the x axis
        svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xaxis);
          // .selectAll(".tick text")
          // .attr("transform","translate(14,-18)");

        // create brush and attach resize handles
        var gBrush = svg.append("g").attr("class","brush").call(brush).call(brush.event);
        gBrush.selectAll("rect").attr("height",height);
        gBrush.selectAll(".resize").append("path").attr("d",resizeHandlePath);
      }


      if (brushDirty) {
        brushDirty = false;
        svg.selectAll(".brush").call(brush);
        // TODO: update filter alert
        if(brush.empty()) {
          svg.select("#clip-histogram-" + id + " rect")
          .attr("x",null)
          .attr("width","100%");
        } else {
          // if the brush is set externally don't force a snap
          var ex = brush.extent(); //snapExtent(brush.extent());
          svg.select("#clip-histogram-" + id + " rect")
            .attr("x",scale_x(ex[0]))
            .attr("width",scale_x(ex[1]) - scale_x(ex[0]));
        }
      }

      if(brush.empty()) { removeFilterText(); }
      else { 
        var ex = snapExtent(brush.extent());
         var msg = title + " : " + filterTextFormat(ex[0]) + " - " + filterTextFormat(ex[1]);
          addFilterText(msg);
      }
      // apply
      svg.selectAll(".geom").attr("d",geometry);
    });




    // build svg path from crossfilter group data
    function geometry(groups) {
        var path = [],
            i = -1,
            n = groups.length,
            d;
        var px = Math.floor(scale_x(groups[1].key)) - Math.floor(scale_x(groups[0].key));
        var space = Math.max(2,px / 6);
        var gap = Math.max(2,px - 2*space);
        var x,y,y2;
        while (++i < n) {
          d = groups[i];
          x = Math.round(scale_x(d.key));
          y = Math.round(scale_y(d.value));
          path.push("M", x+ space, ",", height, "V", y, "h"+ gap +"V", height);
        }
        return path.join("");
    }
    // pretty resize handles for the brush
     function resizeHandlePath(d) {
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = height / 3;
        return "M" + (0.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (0.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
      }
  }
  function snapExtent(extent) {
    if(interactive) {
      var ex1 = extent.map(brushRound);
      if(ex1[0] >= ex1[1]) {
        ex1[0] = brushFloor(extent[0]);
        ex1[1] = brushCeil(extent[1]);
      }
      return ex1;
    } else {
      return extent;
    }
  }



  function removeFilterText() {    
      if(filterElem) {
        var elem = d3.select(filterElem);
        var filterText = elem.select("#filter-histogram-" + id);
        if(!filterText.empty()) {
          filterText.remove();
        }
      }    
  }



  function addFilterText(text) {
    if(filterElem) {

      var elem = d3.select(filterElem);
      var filterText = elem.select("#filter-histogram-" + id).select("span");
    
      if(filterText.empty()) {
        var li = elem.append("li").attr("id","filter-histogram-" +id);
        var div = li.append("div").attr("class","modern");
        div.append("i").attr("class","fa fa-filter");
        filterText = div.append("span").attr("class","filter-text");
        div.append("i").attr("class","fa fa-times-circle");
        d3.select("#filter-histogram-"+id).on("click",function() {  
            reset();
            removeFilterText();            
          });
      }

      filterText.text(text);
    }
  }

  function brushstarted() {}

  function brushed(){
    var extent0 = brush.extent();
    var extent1 = d3.event.mode === "move" ? extent0 : snapExtent(extent0);
    d3.select(this).call(brush.extent(extent1));
    d3.select("#clip-histogram-" + id + " rect")
      .attr("x",scale_x(extent1[0]))
      .attr("width",scale_x(extent1[1]) - scale_x(extent1[0]));
  }


  function brushended() {
      if(brush.empty()){
        d3.select("#clip-histogram-" + id + " rect")
          .attr("x",null)
          .attr("width","100%");
        removeFilterText();
        dimension.filterAll();
      } else {
         var ex = snapExtent(brush.extent());
        d3.select(this).transition()
          .call(brush.extent(ex));
          // .call(brush.event);
        d3.select("#clip-histogram-" + id + " rect").transition()
          .attr("x",scale_x(ex[0]))
          .attr("width",scale_x(ex[1]) - scale_x(ex[0]));

        var msg = title + " : " + filterTextFormat(ex[0]) + " - " + filterTextFormat(ex[1]);
        addFilterText(msg);
        dimension.filter(ex);
      }
  }

  chart.interactive = function(_) {
    if(!arguments.length) return interactive;
    interactive = _;
    return chart;
  };
  chart.brushRound = function(_) {
    if(!arguments.length) return brushRound;
    brushRound = _;
    return chart;
  };
  chart.brushFloor = function(_) {
    if(!arguments.length) return brushFloor;
    brushFloor = _;
    return chart;
  };
  chart.brushCeil = function(_) {
    if(!arguments.length) return brushCeil;
    brushCeil = _;
    return chart;
  };
  chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
  };
  chart.xaxis = function(_) {
    if (!arguments.length) return xaxis;
    xaxis = _;
    return chart;
  };
  chart.xgrid = function(_) {
    if (!arguments.length) return xgrid;
    xgrid = _;
    return chart;
  };
  chart.scale_x = function(_) {
    if (!arguments.length) return scale_x;
    scale_x = _;
    xaxis.scale(scale_x);
    xgrid.scale(scale_x);
    brush.x(scale_x);
    return chart;
  };
  chart.scale_y = function(_) {
    if (!arguments.length) return scale_y;
    scale_y = _;
    return chart;
  };
  chart.dimension = function(_) {
    if (!arguments.length) return dimension;
    dimension = _;
    return chart;
  };
  chart.title = function(_) {
    if (!arguments.length) return title;
    title = _;
    return chart;
  };
  chart.measure = function(_) {
    if (!arguments.length) return measure;
    measure = _;
    return chart;
  };
  chart.extent = function() {
    return brush.extent();
  };

  chart.filterTextFormat = function(_) {
    if(!arguments.length) return filterTextFormat;
    filterTextFormat = _;
    return chart;
  };

  
  chart.filterElem = function(_) {
    if(!arguments.length) return filterElem;
    filterElem = _;
    return chart;
  };

  chart.reset = function(_) {
     if(!arguments.length) return reset;
    reset = _;
    return chart;
  };

  chart.filter = function(_) {
    
    if (_) {
      brush.extent(_);
      dimension.filterRange(_);
    } else {
      brush.clear();
      dimension.filterAll();
    }
    brushDirty = true;
    return chart;
  };



  return d3.rebind(chart,brush,"on");
}