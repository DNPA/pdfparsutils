//Don't polute the global namespace. We export only this one nameless function.
//Arguments:
//        Pdf2json : required pdf2json module, should be imported in top level
//                   self invoking function of our backend app.
module.exports = function (Pdf2json) {
    "use strict";
    //Module is a closure holding the pdf2json dependency that returns
    //a module level object literal with only one method.
    return {
        //The parse method expects the binary content of a PDF object
        //as first argument. The other two arguments are callbacks that
        //are to be used on either failure or successfull parsing of the PDF.
        "parse": function (pdfBuffer, errcallback, rdycallback) {
            //Private function for converting a row number to an y value,
            // if poaaible
            function row_to_y(rowno, raster) {
                if (!(Number.isInteger(rowno)) || rowno < 0) {
                    throw Error("rowno must be a non negative integers");
                }
                if (rowno >= raster.length) {
                    throw Error("row_to_y called on non existing row number.");
                }
                //Get the row from the raster
                const r = raster[rowno];
                //Itterate over the cells of the row untill we find a value for "y"
                for (let i = 0; i < r.length; i += 1) {
                    if ((r[i].length > 0) && ("y" in r[i][0])) {
                        //Return that value
                        return r[i][0].y;
                    }
                }
                //If we diddn't find any "y", return -1
                return -1;
            }
            //Private function for converting a colymn number to an x value
            // if possible
            function col_to_x(colno, raster) {
                //Itterate over all rows
                for (let i = 0; i < raster[0].lenght; i += 1) {
                    //Look only at the cell from the designated column.
                    //Return the value for "x" as soon as we find one.
                    if ((raster[i][colno].length > 0) && ("x" in raster[i][colno][0])) {
                        return raster[i][colno][0].x;
                    }
                }
                //If there is no "x" defined in the column, return -1.
                return -1;
            }
            //Some basic assertion type checks on function arguments.
            if (!(pdfBuffer instanceof Buffer)) {
                throw Error("pdfBuffer should be a Buffer");
            }
            if (typeof errcallback !== 'function') {
                throw Error("errcallback should be a function");
            }
            if (typeof rdycallback !== 'function') {
                throw Error("errcallback should be a function");
            }
            //Instantiate the parser from the pdf2json library
            const pdfParser = new Pdf2json(); //Our actual PDF parser.
            //Map the error callback directly to the one supplied by our user.
            pdfParser.on("pdfParser_dataError", errcallback);
            //Define an on success function for our PDF parsing.
            pdfParser.on("pdfParser_dataReady", function (pdfData) {
                //Some more assert type sanity checks
                if (!(pdfData.hasOwnProperty('formImage'))) {
                    throw Error("pdfData doesn't have the expected structure.");
                }
                const parsed_pdf = pdfData; //Store the parsing result for later usage.
                //Call the user defined callback. The function arguments are the
                //number of pages and a rasterize function that the user should use
                //in order to extract rasters from the parsed PDF document.
                rdycallback(parsed_pdf.formImage.Pages.length,
                    //The rasterize function.
                    function ({p = 0, minxdiff = null, minydiff = null,
                        //Range attributes for the absolute y
                        ygreaterthan = -1, ylessthan = -1, ygreaterorequal = -1, ylessorequal = -1,
                        //Range attributes for the absolute x
                        xgreaterthan = -1, xlessthan = -1, xgreaterorequal = -1, xlessorequal = -1,
                        //Use rows instead of y
                        rgreaterthan = -1, rlessthan = -1, rgreaterorequal = -1, rlessorequal = -1,
                        //Use comumns instead of x
                        cgreaterthan = -1, clessthan = -1, cgreaterorequal = -1, clessorequal = -1,
                        parentraster = [],
                        //For future use with sticky columns/rows.
                        parent_yuniq = null,
                        parent_xuniq = null,
                        get_grid_meta = false}) {
                        if (!(Number.isInteger(rgreaterthan))) {
                            throw Error("rgreaterthan must be an integer.");
                        }
                        if (!(Number.isInteger(rlessthan))) {
                            throw Error("rlessthan must be an integer.");
                        }
                        if (!(Number.isInteger(rgreaterorequal))) {
                            throw Error("rgreaterorequal must be an integer.");
                        }
                        if (!(Number.isInteger(rlessorequal))) {
                            throw Error("rlessorequal must be an integer.");
                        }
                        if (!(Number.isInteger(cgreaterthan))) {
                            throw Error("cgreaterthan must be an integer.");
                        }
                        if (!(Number.isInteger(clessthan))) {
                            throw Error("clessthan must be an integer.");
                        }
                        if (!(Number.isInteger(cgreaterorequal))) {
                            throw Error("cgreaterorequal must be an integer.");
                        }
                        if (!(Number.isInteger(clessorequal))) {
                            throw Error("clessorequal must be an integer.");
                        }
                        if (rgreaterthan >= rlessorequal && rgreaterthan !== -1 && rlessorequal !== -1) {
                            if (rgreaterthan === rlessorequal && parentraster.length -1 === rgreaterthan) {
                                return [[]];
                            }
                            throw Error("rgreaterthan >= rlessorequal");
                        }
                        if (rgreaterorequal > rlessorequal + 1 && rgreaterorequal !== -1 && rlessorequal !== -1) {
                            throw Error("rgreaterorequal > rlessorequal - 1");
                        }
                        if (rgreaterthan !== -1 && rlessthan !== -1 && rgreaterthan >= rlessthan + 1) {
                            throw Error("rgreaterthan >= rlessthan + 1");
                        }
                        if (rgreaterorequal >= rlessthan && rgreaterorequal !== -1 &&  rlessthan !== -1) {
                            throw Error("rgreaterorequal >= rlessthan");
                        }
                        //Curry the minimal difference for a semiUnique function.
                        function semiUnique(mindiff) {
                            //List of semi-unique values returned earlier by below
                            //function.
                            const uniqlist = [];
                            //Return the function for uniqueness test.
                            return  function (val) {
                                for (let i = 0; i < uniqlist.length; i += 1) {
                                    //If the current value is reall close to one returned earlier,
                                    // pretend it's the same.
                                    if (Math.abs(uniqlist[i] - val) <= mindiff) {
                                        return false;
                                    }
                                }
                                //Remember this value.
                                uniqlist.push(val);
                                return true;
                            };
                        };
                        //Find the proper place in the grid according to one of the axis.
                        function gridPos(axis_uniq, axis_value, mindiff) {
                            for (let i = 0; i < axis_uniq.length; i += 1) {
                                //If the value is close enough, the value is close enough.
                                if (Math.abs(axis_uniq[i] - axis_value) <= mindiff) {
                                    return i;
                                }
                            }
                        };
                        //For sorting numerically.
                        function sortNumber(a, b) {
                            return a - b;
                        };
                        //Test if the y provided falls within the range defined.
                        function validY(y) {
                            if (
                                (
                                    ((ygreaterthan === -1) && (ygreaterorequal === -1)) ||
                                    ((ygreaterthan !== -1) && (ygreaterthan + minydiff < y)) ||
                                    ((ygreaterorequal !== -1) && (ygreaterorequal - minydiff <= y))
                                ) &&
                                   (
                                       ((ylessthan === -1) && (ylessorequal === -1)) ||
                                       ((ylessthan !== -1) && (ylessthan - minydiff > y)) ||
                                       ((ylessorequal !== -1) && (ylessorequal + minydiff >= y))
                                   )
                            ) {
                                return true;
                            } else {
                                return false;
                            }
                        };
                        //Test if the x provided falls within the range defined.
                        function validX(x) {
                            if (
                                (
                                    ((xgreaterthan === -1) && (xgreaterorequal === -1)) ||
                                    ((xgreaterthan !== -1) && (xgreaterthan + minxdiff < x)) ||
                                    ((xgreaterorequal !== -1) && (xgreaterorequal - minxdiff <= x))
                                ) &&
                                (
                                    ((xlessthan === -1) && (xlessorequal === -1)) ||
                                    ((xlessthan !== -1) && (xlessthan - minxdiff > x)) ||
                                    ((xgreaterorequal !== -1) && (xlessorequal + minxdiff >= x))
                                )
                            ) {
                                return true;
                            } else {
                                return false;
                            }
                        };
                        //Some more assert type checks on function attributes
                        if (minxdiff === null || minydiff === null) {
                            throw Error("minxdiff or minydiff not specified!");
                        }
                        //Properly convert row and col ranges to x and y ranges.
                        if (parentraster.length > 0) {
                            if (rgreaterthan !== -1) {
                                ygreaterthan = row_to_y(rgreaterthan, parentraster);
                            }
                            if (rlessthan !== -1) {
                                ylessthan = row_to_y(rlessthan, parentraster);
                            }
                            if (rgreaterorequal !== -1) {
                                ygreaterorequal = row_to_y(rgreaterorequal, parentraster);
                            }
                            if (rlessorequal !== -1) {
                                ylessorequal = row_to_y(rlessorequal, parentraster);
                            }
                            if (cgreaterthan !== -1) {
                                xgreaterthan = col_to_x(cgreaterthan, parentraster);
                            }
                            if (clessthan !== -1) {
                                xlessthan = col_to_x(clessthan, parentraster);
                            }
                            if (cgreaterorequal !== -1) {
                                xgreaterorequal = col_to_x(cgreaterorequal, parentraster);
                            }
                            if (clessorequal !== -1) {
                                xlessorequal = col_to_x(clessorequal, parentraster);
                            }
                        }
                        const xs = [],
                            ys = [];
                        //Our specific page from the parsed document
                        const page = parsed_pdf.formImage.Pages[p];
                        //These are the parts of the parsed document we are interested in.
                        //Texts, Fills and horizontal+vertical lines.
                        const cols = ["Texts", "HLines", "VLines", "Fills"];
                        //Start off by creating a list of all X and all Y values in the page.
                        for (let og = 0; og < cols.length; og += 1) {
                            const oset = page[cols[og]];
                            for (let element = 0; element < oset.length; element += 1) {
                                if (validY(oset[element].y) && validX(oset[element].x)) {
                                    xs.push(oset[element].x);
                                    ys.push(oset[element].y);
                                }
                            }
                        }
                        //Sort the found x-es and y-s.
                        xs.sort(sortNumber);
                        ys.sort(sortNumber);
                        //Take the unique x and y values with supplied margins.
                        const xuniq = xs.filter(semiUnique(minxdiff));
                        const yuniq = ys.filter(semiUnique(minydiff));
                        if (parent_xuniq !== null) {
                            xuniq = parent_xuniq;
                        }
                        if (parent_yuniq !== null) {
                            yuniq = parent_yuniq;
                        }
                        //Create an empty grid.
                        const grid = [];
                        for (let yi = 0; yi < yuniq.length; yi += 1) {
                            grid.push([]);
                            for (let xi = 0; xi < xuniq.length; xi += 1) {
                                grid[yi].push([]);
                            }
                        }
                        //Fill the grid will the tags from our page.
                        for (let og = 0; og < cols.length; og += 1) {
                            const oset = page[cols[og]];
                            for (let element = 0; element < oset.length; element += 1) {
                                if (validY(oset[element].y) && validX(oset[element].x)) {
                                    const ell = Object.assign({}, oset[element]);
                                    ell.elt = cols[og];
                                    grid[gridPos(yuniq,
                                        oset[element].y, minydiff)][gridPos(xuniq,
                                        oset[element].x, minxdiff)].push(ell);
                                }
                            }
                        }
                        if (grid.length === 0) {
                            throw Error("Must not return empty grid!");
                        }
                        //And finaly, return the grid.
                        if (get_grid_meta) {
                            return [grid, xuniq, yuniq];
                        } else {
                            //This return is soon to be depricated once
                            //sticky columns get implemented.
                            return grid;
                        }
                    }
                );
            });
            //Invoke parser
            pdfParser.parseBuffer(pdfBuffer);
        }
    };
};
