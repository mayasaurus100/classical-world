//****************************************//
//** SET UP THE DATA DISPLAY COMPONENTS **//
//****************************************//

/* Creates box that displays information for each site the user clicks on */
function createPlaceBox(headers){
  var table = d3.select("#rightBar").append("svg");
  var returnThisHeader = function(d){ return d;};

  placeBoxDataFields = table.selectAll("text")
    .data(headers)
    .enter()
    .append("svg:text")
    .text(returnThisHeader)
    .attr("id", returnThisHeader)
    .attr("x", 20)
    .attr("y", function(d, i) { return 20 * i;});
}

/* Creates the data table that displays full information for each of the sites 
   that is currently visible on the map 

   Table code based on sample from: http://jsfiddle.net/7WQjr/
*/
function createPlaceTable(headers){
  var columns = headers;
  console.log(columns);
  
  var table = d3.select("#placeTable").append("table"),
    thead = table.append("thead");
    tbody = table.append("tbody");

  thead.append("tr")
    .selectAll("th")
    .data(columns)
    .enter()
    .append("th")
      .text(function(column) { return column; });

  //creates a row for each object in data
  rows = tbody.selectAll("tr")
    .data(sitesdata)
    .enter()
    .append("tr")
    .style("display", null);

  //creates a cell for each column in each row
  cells = rows.selectAll("td")
    .data(function(row) {
        return columns.map(function(column) {
          return {column: column, value: row[column]};
        });
      })
    .enter()
    .append("td")
      .text(function(d) { return d.value; });
}