'use strict';
/* jshint globalstrict: true */
/* global d3,crossfilter,colorbrewer,topojson */
function worldMap(tectonics,world,maxEvents) {
	var margin = {top: 0, right: 0, bottom: 0, left: 0};
	var active = d3.select(null);
	var width = 928;
	var height = 528;
	var magScale =
		d3.scale.linear()
		.domain([5.0,9.5])
		.range([1.0,8.0]);


	var colorScale = 
		d3.scale.quantize().domain([9.0,5.0])
		.range(["#d53e4f","#f46d43","#fdae61","#fee08b","#ffffbf","#e6f598","#abdda4","#66c2a5"]);
		// .range(['#FEE5D9','#FCAE91','#FB6A4A','#DE2D26','#A50F15']);

	var nEvents = maxEvents? maxEvents : Infinity;
	var projection = d3.geo.mercator()
		.scale(148)
		.translate([ width / 2 ,  height / 2]);
	var path = d3.geo.path().projection(projection);
	var filterElem;
	var reset;	
	var brushDirty;
	var brushRound = function(_) { return _; };
	var brushFloor = function(_) { return _; };
	var brushCeil = function(_) { return _; };
 	var brush = d3.svg.brush()
	    .x(d3.scale.linear().domain([-180, 180]).range([0, width]))
	    .y(d3.scale.linear().domain([-90, 90]).range([height, 0]))
	    .on("brush.chart", brushed)
	    .on("brushend.chart",brushended);
	var fg,bg;
	var dimension;
	var measure;
	var filter;
	function chart(elem) {
		elem.each(function() {
			var elem = d3.select(this);
			var svg = elem.select("g");
			if( svg.empty() ) {
				svg = elem
		          .append("svg")
		          .attr("width", width + margin.right + margin.left)
		          .attr("height", height + margin.top + margin.bottom)
		          .append("g")
		          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        		var defs = svg.append("defs");		        
						
				/* outer glow to be applied to earthquake-circles*/
				var glow =defs.append("filter").attr("id","glow");
				glow.append("feGaussianBlur").attr("stdDeviation",2.5).attr("result","coloredBlur");
				var feMerge = glow.append("feMerge");
				feMerge.append("feMergeNode").attr("in","coloredBlur");
				feMerge.append("feMergeNode").attr("in","SourceGraphic");


				svg.append("g").attr("id","tectonic-paths").selectAll(".tectonics")
      				.data(topojson.feature(tectonics, tectonics.objects.tec).features)
      				.enter().insert("path",".graticule")
      				.attr("class", "tectonic")
      				.attr("d", path);
				
				

				svg.append("clipPath")
					.attr("id","clip")
					.selectAll(".country")
					.data(topojson.feature(world, world.objects.countries).features)
					.enter().insert("path", ".graticule")
					.attr("class", "country")
					.attr("d", path);

				svg.append("image")
					.attr("y",-350)					
					.attr("clip-path","url(#clip)")
					.attr("xlink:href","../img/gray-earth.jpg")
					.attr("width",928)
					.attr("height",1227);
					


				svg.append("g").attr("id","map-outline")
					.selectAll(".country")
					.data(topojson.feature(world, world.objects.countries).features)
					.enter().insert("path", ".graticule")
					.attr("class", "country")
					.attr("d", path);
			
				fg = svg.append("g").attr("id","quake-events");


				var gBrush = svg.append("g").attr("class","mapbrush").call(brush).call(brush.event);
				gBrush.selectAll(".resize")
					.append("circle")
					.attr("r",4)
					.attr("fill","rgba(69,81,98,0.4)");
			}
			
			var qks = fg.selectAll("circle")
						.data(d3.functor(dimension.top(nEvents)), function(d,i) { return d.index; });
						
			var startDate;
			var endDate;
			try { 
				startDate = d3.time.year.floor(dimension.bottom(1)[0].time);
			} catch(e) {
				startDate = new Date(1900,0,1);
			}

			try { 
				endDate = d3.time.year.floor(dimension.top(1)[0].time);
			} catch (e) {
				endDate = new Date(2015,0,1);
			}
			
			qks.enter()
				.append("circle")
				.style("fill",function (d) { return colorScale(d.mag); })
				.attr("fill-opacity",0.65)
				.attr("filter","url(#glow)")
				.attr("cx", function (d) {  return projection([d.longitude,d.latitude])[0]; })
				.attr("cy", function (d) {  return projection([d.longitude,d.latitude])[1]; })
				.style("stroke","none")
				.attr("r",1e-6)
				.transition()
				.attr("r",function (d) { return magScale(d.mag); })
				.duration(350)
				.delay(function(d,i) { return Math.min(1000,diff(startDate,d.time) * 2); });

			qks.exit()
				.transition()
				.attr("r",1e-6)		
				.duration(350)
				.delay(function(d,i) { return Math.min(730,diff(d.time,endDate)); })
				.remove();
		});

	
		function diff(d0,d1) {
			return (d1.getTime() - d0.getTime()) / 864e5;
		}

		function resizeHandlePath(d) {
	    var e = +(d == "e"),
	        x = e ? 1 : -1,
	        y = height / 16;
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
    var ex1 = extent.map(brushRound);
	    if(ex1[0] >= ex1[1]) {
	      ex1[0] = brushFloor(extent[0]);
	      ex1[1] = brushCeil(extent[1]);
	    }
    	return ex1;
  	}




  	function removeFilterText() {    
      if(filterElem) {
        var elem = d3.select(filterElem);
        var filterText = elem.select("#filter-map");
        if(!filterText.empty()) {
          filterText.remove();
        }
      }    
  	}



  function addFilterText(text) {
    if(filterElem) {

      var elem = d3.select(filterElem);
      var filterText = elem.select("#filter-map").select("span");
    
      if(filterText.empty()) {
        var li = elem.append("li").attr("id","filter-map");
        var div = li.append("div").attr("class","modern");
        div.append("i").attr("class","fa fa-filter");
        filterText = div.append("span").attr("class","filter-text");
        div.append("i").attr("class","fa fa-times-circle");
        d3.select("#filter-map").on("click",function() {  
             reset();
        	 removeFilterText();
        	 d3.select("g.mapbrush").call(brush.event);
          });
      }
      filterText.text(text);
    }
  }






  function brushstarted() {}

  function brushed(){
	var ex = brush.extent();		
	d3.select(this).call(brush.extent(ex));
	var rect = d3.select(".mapbrush rect");
	d3.select("#clip-map rect")
		.attr("x",rect.attr("x"))
		.attr("y",rect.attr("y"))
		.attr("height",rect.attr("height"))
		.attr("width",rect.attr("width"));		
  }

  function brushended() {
		if(brush.empty()) {			
			d3.select("#clip-map rect")
				.attr("x",0)
				.attr("y",0)
				.attr("height",height)
				.attr("width",width);
			removeFilterText()
			dimension.filterAll();
		} else {
			
			var ex = brush.extent();
		   	var msg = "Coordinates : (" 
		   			+ d3.format(".2f")(ex[0][0]) + "," + d3.format(".2f")(ex[0][1]) +  ") - (" 
		   			+ d3.format(".2f")(ex[1][0]) + "," + d3.format(".2f")(ex[1][1]) + ")";
    		addFilterText(msg);
			dimension.filterFunction(function (d) {  return ( d[0] > ex[0][0] && d[0] < ex[1][0] && d[1] > ex[0][1] && d[1] < ex[1][1]);  });
		}
  }

chart.reset = function(_) {
     if(!arguments.length) return reset;
    reset = _;
    return chart;
  };
  
  chart.filterElem = function(_) {
    if(!arguments.length) return filterElem;
    filterElem = _;
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
  chart.dimension = function(_) {
    if (!arguments.length) return dimension;
    dimension = _;
    return chart;
  };
  chart.measure = function(_) {
    if (!arguments.length) return measure;
    measure = _;
    return chart;
  };
  chart.filter = function(_) {
    if (_) {
      	brush.extent(_);
      	var ex = _;
		dimension.filterFunction(function (d) {  return ( d[0] > ex[0][0] && d[0] < ex[1][0] && d[1] > ex[0][1] && d[1] < ex[1][1]);  });
    } else {
      brush.clear();
      dimension.filterAll();
    }
     d3.select("g.mapbrush").call(brush.event);
    brushDirty = true;
    return chart;
  };
  chart.extent = function() {
		return brush.extent();
  };
  // rebind brush events and return the chart function
  return d3.rebind(chart,brush,"on");
}