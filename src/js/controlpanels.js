//****************************************//
//** CONTROL PANEL MANAGEMENT FUNCTIONS **//
//****************************************//

/* Populates the binaryControlPanel array with key/value pairs. The names of the fields that
   are binary become the keys, and a two-element array with two values initialized to "true"
   become the values.
   Index position zero represents whether the "no" option is visible
   Index position one represents whether the "yes" option is visible
*/
function CreateBinaryControlPanel(binaryFieldNames) {
  for(var i = 0; i < binaryFieldNames.length; i++) {
    var id = binaryFieldNames[i];
    binaryControlPanel[id] = [Boolean(true), Boolean(true)];
  }
}

/* For the field with the given id, determines whether the option at the
   given index is set to "true" or "false", where index position 0 corresponds to
   the "no" option and index position 1 corresponds to the "yes" option */
function GetBinaryControlValue(idLookup, indexToGet) {
  for(var key in binaryControlPanel) {
    if(key === idLookup) return (binaryControlPanel[key])[indexToGet];
  }
  console.log("Error! Tried to look up index that does not exist!");
}

/* For the field for the given id, changes the option at indexToSet to 
   newValue.*/
function SetBinaryControlValue(idLookup, indexToSet, newValue) {
  (binaryControlPanel[idLookup])[indexToSet] = newValue;
}

/* Adds a new key/value pair to the checkboxControlPanel array. The id is the key and the values
   in the untokenized string become the values.
   For example, if "field1" is the field name and fieldNamesString is "val1, val2, val3",
   then checkboxControlPanel will map from "field1" to ["val1", "val2", "val3"].
*/
function EnlargeCheckboxPanel(id, fieldNamesString, panel) {
  panel[id] = fieldNamesString.split(",");
}

/* Removes the fieldName value the list of selected values for id in the
 checkboxControlPanel array */
function RemoveCheckboxControlValue(id, fieldName) {
  var removeIndex = checkboxControlPanel[id].indexOf(fieldName);
  checkboxControlPanel[id].splice(removeIndex, 1); 
}

/* Adds the fieldName value to the list of selected values for id in the 
  checkboxControlPanel array */
function AddCheckboxControlValue(id, fieldName) {
  checkboxControlPanel[id].push(fieldName);
}

/* Takes in the field name of a given checkbox column and the name of an option for
   that checkbox. If that option is active for the field, returns true. Returns fals
   otherwise.
   For example, if "field1" is the field name, and its active options based on the checkboxControlPanel
   are ["val","val2","val3"], and checkboxOption is "val2", the function will return true.
*/
function IsCheckboxOptionActive(checkboxFieldName, checkboxOption) {
  return ((checkboxControlPanel[checkboxFieldName]).indexOf(checkBoxOption) != -1);
}

/* Gets the current minimum value for a parallel coordinate field */
function GetParallelMin(idLookup) {
  return (parallelControlPanel[idLookup])[0];
}

/* Gets the current maximum value for a parallel coordinate field */
function GetParallelMax(idLookup) {
  return (parallelControlPanel[idLookup])[1];
}

/* Updates the minimum value for a parallel coordinate field */
function SetParallelMin(idLookup, newMin) {
  (parallelControlPanel[idLookup])[0] = newMin;
}

/* Updates the maximum value for a parallel coordinate field */
function SetParallelMax(idLookup, newMax) {
  (parallelControlPanel[idLookup])[1] = newMax;
}