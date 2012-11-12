
var m = [30, 10, 10, 10],
    w = 1280 - m[1] - m[3],
    h = 300 - m[0] - m[2];

var x = d3.scale.ordinal().rangePoints([0, w], 1),
    y = {},
    dragging = {};

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    background,
    foreground;

var svg = d3.select("#parallel").append("svg:svg")
  .attr("width", w + m[1] + m[3])
  .attr("height", h + m[0] + m[2])
  .append("svg:g")
  .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

var lastClickedField = ""; // the last field that the user clicked on to sort the graph
var toggle = 0; // keeps track of state of colors
var SITES_PATH = "../../data/polis_10_12.csv";
var JSON_PATH = "../../data/romeland.json";

var filesToLoad = 1, sitesdata, peopledata;

d3.csv(SITES_PATH, function(csv) {
  sitesdata = csv;
  if ((--filesToLoad) < 1) Initialize();
});

function Initialize() {
  // Generate array of all headers for data
  var headers = d3.keys(sitesdata[0]);

  // Generate array of headers that correspond to data in parallel form
  parallelFieldNames = headers.filter(function(d) { return sitesdata[0][d] == "parallel";});

  // Generate array of headers that correspond to data in binary form
  binaryFieldNames = headers.filter(function(d) { return sitesdata[0][d] == "binary";});

  // Generate array of headers that correspond to data in checkbox form and 
  // create control panel for checkbox data
  checkboxControlPanel = {};
  checkboxFieldNames = headers.filter(function(d) { return sitesdata[0][d] == "checkbox" ;});  // will change as user interacts with map
  headers.filter(function(d) { return sitesdata[0][d] == "checkbox" && EnlargeCheckboxPanel(d, sitesdata[1][d], checkboxControlPanel) == true;});
  // Create a record of the original values in the control panel for the checkbox field
  checkboxOriginalState = {};
  headers.filter(function(d) { return sitesdata[0][d] == "checkbox" && EnlargeCheckboxPanel(d, sitesdata[1][d], checkboxOriginalState) == true;});

  // Create control panel for binary data fields
  binaryControlPanel = {};
  CreateBinaryControlPanel(binaryFieldNames);

  // Create control panel for parallel coordinate fields. The name of each field corresponds
  // to an array where the 0-index value is the minimum field value and the 1-index value is the
  // maximum field value
  parallelControlPanel = {};
  parallelFieldNames.filter(function(d) {
    return parallelControlPanel[d] = d3.extent(sitesdata, function(p) { return +p[d]; });
  });
  // Create a record of the original values in the control panel of the parallel coordinate field
  parallelOriginalState = {};
  parallelFieldNames.filter(function(d) {
    return parallelOriginalState[d] = d3.extent(sitesdata, function(p) { return +p[d]; });
  });

  sitesdata.splice(0,2); // remove rows in CSV that contain metadata for fields

 // CreateFeedbackPanel();
  CreateParallelCoords();
  createPlaceBox(headers);
  createPlaceTable(headers);
  CreatePlaceControls();
  CreateMap(headers);
}

//**************************//
// INITIALIZE PROGRAM STATE //
//**************************//

function InitializeStateFromURL() {
  if (window.location.hash == "") return;
  SetProgramState();
}

/* Checks the URL parameters follow the '#' sign and updates the control panel
   so that the program settings reflect the parameters. */
function SetProgramState() {
  var userHash = (window.location.hash).slice(1); // get rid of the '#' sign
  var myFields = userHash.split(',');
  for (var i = 0; i < myFields.length; i++) {
    var fieldData = myFields[i].split('=');
    var currentFieldName = fieldData[0];
    var currentFieldValues = fieldData[1];
    if(parallelFieldNames.indexOf(currentFieldName) != -1) {  // field is parallel
      var minAndMaxValues = currentFieldValues.split('-');
      //SetParallelMin(currentFieldName, currentFieldValues[0]);
      //SetParallelMax(currentFieldName, currentFieldValues[1]);
      // update display
    } else if(binaryFieldNames.indexOf(currentFieldName) != -1) {  // field is binary
      var yesAndNoValues = currentFieldValues.split('-');
      SetBinaryControlValue(currentFieldName, 0, yesAndNoValues[0] == "true"); // convert to boolean before setting
      SetBinaryControlValue(currentFieldName, 1, yesAndNoValues[1] == "true"); // convert to boolean before setting
      d3.select("[id=" + currentFieldName + "]").select("[name=yes]").property("checked", GetBinaryControlValue(currentFieldName, 1));
      d3.select("[id=" + currentFieldName + "]").select("[name=no]").property("checked", GetBinaryControlValue(currentFieldName, 0));
    } else if(checkboxFieldNames.indexOf(currentFieldName) != -1) { // field is checkbox
      if(currentFieldValues === "NONE") {
        TurnOffAllCheckboxes(currentFieldName);
      } else {
        var checkboxValues = currentFieldValues.split('-');
        TurnOffAllCheckboxes(currentFieldName);
        for(var i = 0; i < checkboxValues.length; i++) {
          var lookupString = "[name=" + currentFieldName + "_" + checkboxValues[i] + "]";
          EnlargeCheckboxPanel(currentFieldName, checkboxValues[i], checkboxControlPanel);
          (d3.select("[id=" + currentFieldName + "]")).select("[name=" + checkboxValues[i] + "]").property("checked", true);
        }
      }
    }
  }
  UpdateDisplay();
}

/* For a given field in the checkbox control panel, removes field values and sets all checkboxes to
   unchecked. */
function TurnOffAllCheckboxes(idLookup) {
  for(var i = 0; i < checkboxControlPanel[idLookup].length; i++) {
    (d3.select("[id=" + idLookup + "]")).select("[name=" + checkboxControlPanel[idLookup][i] + "]").property("checked", false);
  }
  checkboxControlPanel[idLookup].length = 0;
}

/* Sets up the panel of parallel coordinates at program start.*/
function CreateParallelCoords() {
  // Generate the list of dimensions and create a scale for each.
  x.domain(dimensions = parallelFieldNames.filter(function(d) {
    return (y[d] = d3.scale.linear()
      .domain(d3.extent(sitesdata, function(p) { return +p[d]; }))
      .range([h, 0]));
    })
  );

  // Add grey background lines for context.
  background = svg.append("svg:g")
    .attr("class", "background")
    .selectAll("path")
    .data(sitesdata)
    .enter().append("svg:path")
    .attr("d", path);

  // Add blue foreground lines for focus.
  foreground = svg.append("svg:g")
    .attr("class", "foreground")
    .selectAll("path")
    .data(sitesdata)
    .enter().append("svg:path")
    .attr("d", path);

  // Add a group element for each dimension.
  var g = svg.selectAll(".dimension")
    .data(dimensions)
    .enter().append("svg:g")
    .attr("class", "dimension")
    .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
    .on("click", titleClick);
/*    .call(d3.behavior.drag()
    .on("dragstart", function(d) {
      dragging[d] = this.__origin__ = x(d);
      background.attr("visibility", "hidden");
     })
    .on("drag", function(d) {
      dragging[d] = Math.min(w, Math.max(0, this.__origin__ += d3.event.dx));
      foreground.attr("d", path);
      dimensions.sort(function(a, b) { return position(a) - position(b); });
      x.domain(dimensions);
      g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
    })
    .on("dragend", function(d) {
      delete this.__origin__;
      delete dragging[d];
      transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
      transition(foreground)
        .attr("d", path);
        background
          .attr("d", path)
          .transition()
          .delay(500)
          .duration(0)
          .attr("visibility", null);
        }));*/

  // Add an axis and title.
  g.append("svg:g")
    .attr("class", "axis")
    .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
    .append("svg:text")
    .attr("text-anchor", "middle")
    .attr("y", -9)
    .text(String);

  // Add and store a brush for each axis.
  g.append("svg:g")
    .attr("class", "brush")
    .each(function(d) { d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brush", brush)); })
    .selectAll("rect")
    .attr("x", -8)
    .attr("width", 16);
}

//****************************//
//** DATA CONTROL BOX SETUP **//
//****************************//

/* Creates binary checkboxes from all of the columns marked "binary" in the CSV */
function CreateBinaryBoxes(form){
  var fieldName = function(d){ return d;}; // returns name of column in CSV
  var testAlert = function(d){console.log("HELLO!");};

  var binaryBoxes = form.selectAll("p")
    .data(binaryFieldNames)
    .enter()
    .append("p")
    .attr("class", "binaryForm")
    .attr("id", fieldName);

  binaryBoxes.append("label")
    .text(fieldName)
    .attr("for", fieldName)
    .attr("onClick", "titleClick(this.__data__)");
  binaryBoxes.append("input")
    .attr("class", "binaryBox")
    .attr("type", "checkbox")
    .attr("checked", true)
    .attr("id", fieldName)
    .attr("name", "no")
    .attr("onClick", "UpdateBinaryBoxes(this)");
  binaryBoxes.append("input")
    .attr("class", "binaryBox")
    .attr("type", "checkbox")
    .attr("checked", true)
    .attr("id", fieldName)
    .attr("name", "yes")
    .attr("onClick", "UpdateBinaryBoxes(this)");
}

/* Creates multi-select checkboxes from of the columns marked "checkbox" in the CSV */
function CreateCheckboxControls(form) {
  var returnThis = function(d){ return d;};
  
  var checkboxes = form.selectAll("p")
    .data(checkboxFieldNames)
    .enter()
    .append("p")
    .attr("class", "checkboxForm")
    .attr("type", "input")
    .attr("id", returnThis)
    .attr("values", checkboxControlPanel[returnThis]);

  var labels = form.selectAll("p").append("label")
    .text(returnThis)
    .attr("for", returnThis);

  // For each field, adds all of the checkbox values that correspond to the option
  for(var index = 0; index < checkboxFieldNames.length; index++) {
    var field = checkboxFieldNames[index];
    var currentLabel = labels.filter(function(d, i) { return d == field;});
    
    currentLabel.selectAll("input")
      .data(checkboxControlPanel[field])
      .enter()
      .append("input")
      .attr("class", "checkboxForm")
      .attr("type", "checkbox")
      .attr("checked", true)
      .attr("id", checkboxFieldNames[index])
      .attr("name", returnThis)
      .attr("onClick", "UpdateCheckboxes(this)")
      .append("label")
        .text(returnThis)
        .attr("for", returnThis);   
  }
}

/* Creates the binary-option checkboxes from the columns marked "binary" in the CSV */
function CreatePlaceControls(){
  var checkboxesForm = d3.select("#checkboxes").append("form");
  CreateCheckboxControls(checkboxesForm);
  var binaryForm = d3.select("#binary").append("form");
  CreateBinaryBoxes(binaryForm);
}

/* Creates the feedback panel for user testing */
function CreateFeedbackPanel() {
  var feedbackForm = d3.select("#feedback").append("form");

  feedbackForm.append("input")
    .attr("type", "textarea")
    .attr("style", "width:500px;height:200px")
    .attr("id", "feedbackForm");
  feedbackForm.append("input")
    .attr("type", "button")
    .attr("style", "width:100px")
    .attr("id", "feedbackForm");

}

//*******************************************//
//** PARALLEL COORDINATE SUPPORT FUNCTIONS **//
//*******************************************//

/* Handles a brush event by calculating the max/min parallel parameters that need to change,
   updating the control panel for the parallel coordinates accordingly, and updating the display. */
function brush() {
  var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
  extents = actives.map(function(p) { return y[p].brush.extent(); });
  ParallelBrushUpdate(actives, extents); // Updates the control panel for the parallel coordinate component
  UpdateDisplay();
}

function clip(d) {
  return path(circle.clip(d));
}

/* Returns the path for a given data point. */
function path(d) {
  return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
}

function position(d) {
  var v = dragging[d];
  return v == null ? x(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}


//****************************************//
//** UPDATE DISPLAY AND RESPOND TO USER **//
//****************************************//


/* Changes the color of nodes and foreground lines on the basis of the
   user's click on the title of a data field. */
function titleClick(d) {
  var pmin, pmax;

  if(parallelFieldNames.indexOf(d) != -1) {
    pmin = GetParallelMin(d);
    pmax = GetParallelMax(d);
  } else if(binaryFieldNames.indexOf(d) != -1) {
    pmin = 0;
    pmax = 1;
  }
  var pq1 = (pmax * .25) + (pmin * .75);
  var pq2 = (pmax * .5) + (pmin * .5);
  var pq3 = (pmax * .75) + (pmin * .25);

  var stateZero = ["#0571B0","#92C5DE","#F7F7F7","#F4A582","#CA0020"];
  var stateOne = ["#CA0020","#F4A582","#F7F7F7","#92C5DE","#0571B0"];

  var pathRamp;
  if (d === lastClickedField && toggle == 0) {
    pathRamp = d3.scale.linear().domain([pmin,pq1,pq2,pq3,pmax]).range(stateOne);
    toggle = 1;
  } else {
    pathRamp = d3.scale.linear().domain([pmin,pq1,pq2,pq3,pmax]).range(stateZero);
    toggle = 0;
  }
  lastClickedField = d;
  foreground.style("stroke", function(p) {return (pathRamp(p[d]))});
  d3.selectAll(".sites").style("fill", function(p) {return (pathRamp(p[d]))});
}

/* For a given site toCheck that is passed in as a parameter, returns true if the
   site should be visible and false if the site should be invisible. */
function CheckForVisibility(toCheck) {

  //Check parallel coordinate fields
  for(var pField in parallelControlPanel) {
    fieldMax = GetParallelMax(pField);
    fieldMin = GetParallelMin(pField);
    if(toCheck[pField] < fieldMin || toCheck[pField] > fieldMax) return false;
  }

  //Check binary fields
  for(var bField in binaryControlPanel) {
    noFieldSetting = GetBinaryControlValue(bField, 0);
    yesFieldSetting = GetBinaryControlValue(bField, 1);
    toCheckValue = toCheck[bField];

    if(yesFieldSetting == true) {
      if(noFieldSetting == false) {
        if(toCheckValue == 0) return false; // 0 is off and 1 is on, return false if toCheckValue == 0
      } // otherwise 0 is on and 1 is on, do not need to filter on this field
    } else {
       if(noFieldSetting == false) return false; // both 0 and 1 are off, return false if toCheckValue == 1
       if(toCheckValue == 1) return false; // 0 is on and 1 is off, return false if toCheckValue == 1
    }
  }

  //Check checkbox fields
  for(var cfield in checkboxControlPanel) {
    checkedValues = checkboxControlPanel[cfield];
    var containsValue = false;
    for(var i = 0; i < checkedValues.length; i++) {
      if(toCheck[cfield].indexOf(checkedValues[i]) > -1) containsValue = true;
    }
    if(containsValue == false) return false; // returns false if field does not contain at least one value in checkedValues
  }
  return true;
}

/* Updates the control panel for parallel coordinates when a brush event occurs 
   activeFields is an array that contains the names of the fields that are currently selected
   in the parallel coordinate panel.
   fieldExtents is an array of arrays that holds the new min/max values for each of the fields that are
   currently selected.
   names in activeFields correspond to min/max pairs in fieldExtents.
*/
function ParallelBrushUpdate(activeFields, fieldExtents) {
  for(var i = 0; i < activeFields.length; i++) {
    var currentField = activeFields[i];
    SetParallelMin(currentField, fieldExtents[i][0]);
    SetParallelMax(currentField, fieldExtents[i][1]);
  }
}

/* Updates the info box with information about site when a site is selected */
function siteClick(clickedPoint) {
  var headers = d3.keys(sitesdata[0]);
  var returnThis = function(d, i){ return clickedPoint[headers[i]];};
  placeBoxDataFields.text(returnThis);

  projection.origin([clickedPoint.xcoord, clickedPoint.ycoord]);
  projection.scale(4500);
  sites.attr("transform", function(d) { return "translate(" + projection([d.xcoord, d.ycoord]) + ")"; });
  embossed.attr("d", clip);
}

/* Changes value in BinaryControlPanel and updates map when a binary checkbox is
   checked or unchecked. */
function UpdateBinaryBoxes(binaryBox){
  var desiredValue = (binaryBox.name == "yes") ? 1 : 0;
  SetBinaryControlValue(binaryBox.id, desiredValue, binaryBox.checked);
  UpdateDisplay();
}

/* When a checkbox is checked or unchecked, updates the checkboxControlPanel and
   then updates the display. */
function UpdateCheckboxes(checkbox) {
  var fieldValue = checkbox.name;
  var fieldID = checkbox.id;
  if(checkbox.checked == true) {
    AddCheckboxControlValue(fieldID, fieldValue); // went from unchecked to checked
  } else {
    RemoveCheckboxControlValue(fieldID, fieldValue); // went from checked to unchecked
  } 
  UpdateDisplay();
}

/* Updates all of the data being displayed by checking to see which objects should
   be visible and toggling the elements to which they are bound on and off accordingly. */
function UpdateDisplay() {
  // go through all sitesdata, create an array of the "name" of a city that is to be displayed
  // and then make the display test into a question of whether the name is in the array
  var placesToDisplay = [];
  for(var i = 0; i < sitesdata.length; i++) {
    if(CheckForVisibility(sitesdata[i])) {
      placesToDisplay.push(sitesdata[i]['name']);
    }    
  }

  var arrayContains = function(place) {return placesToDisplay.indexOf(place['name']) != -1;};
/*  for(var i = 0; i < sitesdata.length; i++) {
    var currentPlace = sitesdata[i]['name'];
    if(placesToDisplay.indexOf(currentPlace) != -1) {
      sites.select("[name=" + currentPlace + "");
    } else {

    }
  }*/

  sites.style("display", function(d, i) { return (arrayContains(d) ? null : "none");});
  rows.style("display", function(d, i) { return (arrayContains(d) ? null : "none");});
  foreground.style("display", function(d, i) { return (arrayContains(d) ? null : "none");});
  UpdateURL();
}

/* Generates a unique string representing the current state of the program and then updates
   the URL to contain this string. Checks to see which of the fields have been altered from
   their default settings and generates a string to represent those alterations. */
function UpdateURL() {
  var myURL = "";

  // Check binary fields
  for(var i = 0; i < binaryFieldNames.length; i++) {
    var currentField = binaryFieldNames[i];
    if(GetBinaryControlValue(currentField, 0) != true || GetBinaryControlValue(currentField, 1) != true) {
      myURL = myURL + currentField + "=" + GetBinaryControlValue(currentField, 0) + "-" + GetBinaryControlValue(currentField, 1) + ",";
    }
  }

  // Check parallel fields
  for(var i = 0; i < parallelFieldNames.length; i++) {
    var currentField = parallelFieldNames[i];
    var originalMin = (parallelOriginalState[currentField])[0];
    var originalMax = (parallelOriginalState[currentField])[1];
    var currentMin = GetParallelMin(currentField);
    var currentMax = GetParallelMax(currentField);
    if(currentMin != originalMin || currentMax != originalMax) {
      myURL = myURL + currentField + "=" + currentMin.toFixed(2) + "-" + currentMax.toFixed(2) + ",";
    }
  }

  // Check checkbox fields
  for(var i = 0; i < checkboxFieldNames.length; i++) {
    var currentField = checkboxFieldNames[i];
    if(checkboxControlPanel[currentField].length < checkboxOriginalState[currentField].length) {
      myURL = myURL + currentField + "=";
      for(var j = 0; j < checkboxControlPanel[currentField].length; j++) {
        if (j != 0) myURL = myURL + "-";
        myURL = myURL + checkboxControlPanel[currentField][j];
      }
      if(checkboxControlPanel[currentField].length == 0) myURL = myURL + "NONE";
      myURL = myURL + ",";
    }
  }
  window.location.hash = "#" + myURL;  
}