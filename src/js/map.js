//********************//
//** CREATE THE MAP **//
//********************//

/* Creates and displays the map */
function CreateMap(headers){
  rankRamp = d3.scale.linear().domain([0,.005]).range([1,10]).clamp(true);

  projection = d3.geo.azimuthal()
    .scale(2500)
    .origin([22.8,38.6])
    .mode("orthographic")
    .translate([640, 400]);

  circle = d3.geo.greatCircle()
    .origin(projection.origin());

  path = d3.geo.path()
    .projection(projection);

  mapsvg = d3.select("#map").append("svg:svg")
    .attr("width", 1280)
    .attr("height", 800);

  map = mapsvg.append("svg:g").attr("class", "map")
    .attr("transform", "translate(2,3)");

  d3.json(JSON_PATH, function(collection) {
    embossed = map.selectAll("path.countries")
      .data(collection.features)
      .enter().append("svg:path")
      .attr("d", clip)
      .attr("class", "countries")
      .style("fill", "black")
      .style("stroke", "#638a8a")
      .style("stroke-width", 4);

    sites = map.selectAll("g.sites")
      .data(sitesdata)
      .enter()
      .append("svg:g")
      .attr("class", "foreground")
      .attr("transform", function(d) {return "translate(" + projection([d.xcoord,d.ycoord]) + ")";})
      .style("cursor", "pointer")
      .on("click", siteClick);

  sites.append("svg:circle")      
      .attr('r', 5)
      .attr("class", "sites")
      .style("fill", "red")
      .style("stroke", "grey")
      .style("opacity", 0)
      .transition()
      .delay(300)
      .duration(1000)
      .style("opacity", .85);
 
  InitializeStateFromURL(); // call InitializeState from inside this function because InitializeState calls 
                            // UpdateDisplay, which needs access to sites data
  }) //end collection of functions
}//end CreateMap function