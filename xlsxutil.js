//Module level function takes only module dependencies.
module.exports = function (xlsxpop) {
    "use strict";
    //Page level stuff that lives outside of lexical scoping.
    let page_keys = [];
    let page_fields = [];
    const page_field_colors = [];
    //Colors to use in spreadsheet headers for different levels of nesting.
    const colors = ["ccacab", "f7d4d2", "e2b8a5", "bca79e", "efa586",
        "efd186", "d8c9a2", "f9cf63", "bece8e", "b7e52b", "a1cecd"];
    //Page level meta gets this collow for headerss
    const page_color = "efadaa";
    //Try to convert umerical columns from string to float or int.
    function type_cleanup(datamatrix) {
        //Swap columns and rows
        function xyswap(matrix) {
            const rval = [];
            for (let x = 0; x < matrix[0].length; x += 1) {
                rval.push([]);
                for (let y = 0; y < matrix.length; y += 1) {
                    rval[rval.length - 1].push(matrix[y][x]);
                }
            }
            return rval;
        }
        //Remove dots and comma's.
        //Try to figure out if the last point or comma indicated a point.
        function only_last_sep(arr) {
            const rval = [];
            for (let i = 0; i < arr.length; i += 1) {
                const splits = arr[i].split(/[\.,]/);
                if (splits.length > 1) {
                    const lastpart = splits.pop();
                    //If the last section is three long, its probably
                    //an integer, no need to keep any dot/comma in.
                    if (lastpart.length === 3) {
                        rval.push(splits.join("") + lastpart);
                    } else {
                        //If the length of the last part is two,
                        //it's likely some currency number.
                        if (lastpart.length === 2) {
                            rval.push(splits.join("") + "." + lastpart);
                        } else {
                            //Otherwise, we don't know what to do
                            rval.push(splits.join("") + "#" + lastpart);
                        }
                    }
                } else {
                    rval.push(arr[i]);
                }
            }
            return rval;
        }
        //Check if all strings are numerals
        function all_numeral(arr) {
            for (let i = 0; i < arr.length; i += 1) {
                if (isNaN(arr[i])) {
                    return false;
                }
                const splits = arr[i].split(".");
                if (splits.length > 2) {
                    return false;
                }
            }
            return true;
        }
        //Check if all strings are integers.
        function all_integers(arr) {
            for (let i = 0; i < arr.length; i += 1) {
                if (isNaN(arr[i])) {
                    return false;
                }
                const splits = arr[i].split('.');
                if (splits.length > 1) {
                    return false;
                }
            }
            return true;
        }
        function all_float(arr) {
            for (let i = 0; i < arr.length; i += 1) {
                if (isNaN(arr[i])) {
                    return false;
                }
                const splits = arr[i].split('.');
                if (splits.length > 1) {
                    if (splits[splits.length - 1].length !== 2) {
                        return false;
                    }
                }

            }
            return true;
        }
        //Convert the whole array to integers.
        function to_integer_array(arr) {
            const rval = [];
            for (let i = 0; i < arr.length; i += 1) {
                rval.push(parseInt(arr[i]));
            }
            return rval;
        }
        //Convert the whole array to floats.
        function to_float_array(arr) {
            const rval = [];
            for (let i = 0; i < arr.length; i += 1) {
                rval.push(parseFloat(arr[i]));
            }
            return rval;
        }
        //Do a type cleanup of an array.
        function arr_type_cleanup(arr) {
            //Get a copy of the fields potentially parsable to
            //floats or integers.
            const stripped_arr = only_last_sep(arr);
            //Only patch if all are at least numeral.
            if (all_numeral(stripped_arr)) {
                //If all are integers, threat them as such.
                if (all_integers(stripped_arr)) {
                    return to_integer_array(stripped_arr);
                } else {
                    if (all_float(stripped_arr)) {
                        return to_float_array(stripped_arr);
                    } else {
                        return arr;
                    }
                }
            } else {
                //In all other cases, threat it as just strings.
                //FIXME: we need to consider other types as well.
                return arr;
            }
        }
        //First swap rows and columns.
        const m2 = xyswap(datamatrix);
        //Patch the rows.
        const rval = [];
        for (let i = 0; i < m2.length; i += 1) {
            rval.push(arr_type_cleanup(m2[i]));
        }
        //Swap columns and rows back and return.
        return xyswap(rval);
    }
    //Closure-private function for converting the intermediate object structure for
    //PDF extracted data to a dataframe. //This function uses recursion and uses
    //the attribute 'nestiung' to denote the current recursion level.
    function struct_to_dataframe(recordstructure, nesting = 0) {
        //Headers for the current lexical scope and sub tree.
        const own_headers = [],
            own_colors = [],
            own_values = [];
        //At the top level, extract some page level data frame style info.
        if (nesting === 0 && recordstructure.hasOwnProperty("page_scope")) {
            //Put all keys in a set so we don't get doubles.
            const allkeys = new Set();
            for (let i = 0; i < recordstructure.page_scope.length; i += 1) {
                const keys = Object.keys(recordstructure.page_scope[i]);
                keys.sort();
                for (let i2 = 0; i2 < keys.length; i2 += 1) {
                    allkeys.add(keys[i2]);
                }
            }
            //Remember page_keys.
            page_keys = Array.from(allkeys);
            page_fields = [];
            //For each page number in the page scope (starting at zero).
            for (let p = 0; p < recordstructure.page_scope.length; p += 1) {
                //One row of page scope info.
                const pg = recordstructure.page_scope[p];
                //Start of with an empty output row at page level.
                const prow = [];
                //Look up each of the known page level keys in order.
                for (let i = 0; i < page_keys.length; i += 1) {
                    const key = page_keys[i];
                    if (pg.hasOwnProperty(key)) {
                        //Push the value if pressent for this row
                        prow.push(pg[key]);
                    } else {
                        //Push empty string (FIXME: is this an empty cell?)
                        // otherwise.
                        prow.push("");
                    }
                    //One more field with page color.
                    page_field_colors.push(page_color);
                }
                //Push the info for one specific page.
                page_fields.push(prow);
            }
        }
        //Process the vatiables for "this" node within the current lexical scope.
        if (recordstructure.hasOwnProperty("lexical_scope")) {
            //Itterate all keys form the lexical scope of this node.
            const keys = Object.keys(recordstructure.lexical_scope);
            keys.sort();
            for (let index = 0; index < keys.length; index += 1) {
                //Add to the data-frame-like structure for this node.
                own_headers.push(keys[index]);
                own_values.push(recordstructure.lexical_scope[keys[index]]);
                //Colors for lexically scoped variables rotate if ever we
                //are to end up with documents of more than 11 lexical
                //scoping levels.
                own_colors.push(colors[nesting % 11]);
            }
        }
        //If this node exists within a specific page, get the proper page fields.
        //We will need to include these page level fields in our own data frame.
        let pfields = [];
        if (recordstructure.hasOwnProperty("page_ref")) {
            pfields =  page_fields[recordstructure.page_ref];
        }
        //If this node has any children, process these children.
        if (recordstructure.hasOwnProperty("children")) {
            const allkeys = new Set;
            const key2coll = {};
            //Itterate for all child nodes, first run.
            for (let index = 0; index < recordstructure.children.length; index += 1) {
                //Get data frame for the child.
                const child_data = struct_to_dataframe(recordstructure.children[index], nesting + 1);
                //Itterate over all headers found in the child data frame
                for (let i = 0; i < child_data.headers.length; i += 1) {
                    //Keep track of all header fields for this child.
                    allkeys.add(child_data.headers[i]);
                    //Keep track of a map mapping keys to their respective header colors.
                    key2coll[child_data.headers[i]] = child_data.colors[i];
                }
            }
            //Set as array
            const child_headers = Array.from(allkeys);
            //Initialize and fill list of child colors
            const child_colors = [];
            for (let i = 0; i < child_headers.length; i += 1) {
                child_colors.push(key2coll[child_headers[i]]);
            }
            //Initialize child records mergere data frame.
            const sparse_child_records = [];
            //Itterate over child nodes a second time.
            for (let index = 0; index < recordstructure.children.length; index += 1) {
                const child_data = struct_to_dataframe(recordstructure.children[index], nesting + 1);
                //Itterate over child data frame rows.
                for (let child_data_row = 0; child_data_row < child_data.data.length; child_data_row += 1) {
                    //Initialize and fill new output row
                    const row = [];
                    //Itterate over all possible headers.
                    for (let sparse_index = 0; sparse_index < child_headers.length; sparse_index += 1) {
                        if  (child_data.headers.includes(child_headers[sparse_index])) {
                            //If this child node has data with this header, copy the cell content.
                            row.push(child_data.data[child_data_row][sparse_index]);
                        } else {
                            //Otherwise, it's an empty cell.
                            row.push("");
                        }
                    }
                    //Concattenate our own values to those of each of our children.
                    if (pfields.length > 0) {
                        //If there are any page level fields, also concat these to
                        // our own.
                        sparse_child_records.push(row.concat(own_values).concat(pfields));
                    } else {
                        sparse_child_records.push(row.concat(own_values));
                    }
                }
            }
            //If there are any page level fields, for our own page,
            // concat these to our own.
            //Return our node's data frame
            if (pfields.length > 0) {
                return {
                    //If there are any page level fields, also concat these to
                    // our own.
                    headers: child_headers.concat(own_headers).concat(page_keys),
                    colors: child_colors.concat(own_colors).concat(page_field_colors),
                    data: sparse_child_records
                };
            } else {
                return {
                    headers: child_headers.concat(own_headers),
                    colors: child_colors.concat(own_colors),
                    data: sparse_child_records
                };
            }
        } else {
            //The current node has no children
            if (pfields.length > 0) {
                return {
                    //If there are any page level fields, also concat these to
                    // our own.
                    headers: own_headers.concat(page_keys),
                    colors: own_colors.concat(page_field_colors),
                    data: [own_values.concat(pfields)]
                };
            } else {
                return {
                    headers: own_headers,
                    colors: own_colors,
                    data: [own_values]
                };
            }
        }
    }
    //Object litteral with only one method (for now)
    return {
        //Method for exporting intermediate format data to an excell file.
        "export": function (recordstructure, outputfile) {
            //Convert structure to dataframe structure.
            const dataframe = struct_to_dataframe(recordstructure);
            dataframe.data = type_cleanup(dataframe.data);
            //Start off with a blank spreadsheet.
            xlsxpop.fromBlankAsync().then(function (workbook) {
                //Place the data into the spreadsheet
                workbook.sheet(0).cell("A2").value(dataframe.data);
                //Place the data headers in their location.
                workbook.sheet(0).cell("A1").value([dataframe.headers]);
                //Update the collors for the headers.
                const colmatrix = [];
                for (let idx = 0; idx < dataframe.data.length; idx += 1) {
                    colmatrix.push(dataframe.colors);
                }
                workbook.sheet(0).cell("A2").style("fill", colmatrix);
                //workbook.sheet(0).cell("A1").style("fill", [dataframe.colors]);
                //Write the spreadsheet to file.
                return workbook.toFileAsync(outputfile);
            });
        }
    };
};

