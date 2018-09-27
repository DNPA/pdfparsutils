//Our treetemplate module has json as only dependency.
module.exports = function (json, conf) {
    "use strict";
    let aggressive_regex = false;
    let strip_attributes_first = false;
    let drop_nonregex_text = false;
    if (conf.hasOwnProperty("aggressive_regex")) {
        aggressive_regex = conf.aggressive_regex;
    }
    if (conf.hasOwnProperty("strip_attributes_first")) {
        strip_attributes_first = conf.strip_attributes_first;
    }
    if (conf.hasOwnProperty("drop_nonregex_text")) {
        drop_nonregex_text = conf.drop_nonregex_text;
    }
    return {
        "cell_matches": function (tmplcell, arr) {
            //Itterate over all cells in the raster row.
            for (let i = 0; i < arr.length; i += 1) {
                //The match is true unless one of the template cell attributes makes it false.
                let matched = true;
                //Select the candidate cell to match against.
                const candidate = arr[i];
                //Itterate over all of the keys in the template cell.
                const keys = Object.keys(tmplcell);
                for (let ki = 0; ki < keys.length; ki += 1) {
                    //If we haven't disqualified this cell already,
                    //and our attribute is different between raster and template cell:
                    if (matched === true && tmplcell[keys[ki]] !== candidate[keys[ki]]) {
                        //If the key is actually defined in the candidate as well, we don't have a match
                        //If the key isn't defined in the candidate, but teplate cell defines
                        //it as null, then we still might have a match.
                        if (keys[ki] in candidate || tmplcell[keys[ki]] !== null) {
                            matched = false;
                        }
                        //Special case regexlist. Compare template regeclist entry with cell T entry.
                        if (keys[ki] === "regexlist" && "T" in candidate) {
                            let regexmatch = false;
                            //Test for a regex match.
                            for (let rindex = 0; rindex < tmplcell.regexlist.length; rindex += 1) {
                                //If any of the regex candidates matches, we have a match.
                                const re = new RegExp(tmplcell.regexlist[rindex].regex, "u");
                                if (re.test(candidate.T)) {
                                    regexmatch = true;
                                }
                            }
                            //Only if non of the regexes matches our match fails.
                            if (regexmatch === true) {
                                matched = true;
                            }
                        }
                    }
                }
                //We only need one candidate to match for a match here.
                if (matched !== false) {
                    return true;
                }
            }
            //If non of the candidates matches, we don't have a match.
            return false;
        },
        //Test a whole set of need to match template cells.
        "row_matches": function (tmplmatch, arr) {
            //Itterate the template match rule cells
            for (let i = 0; i < tmplmatch.length; i += 1) {
                //If one of the cells doesn't match, our match rule as a whole doesn't either.
                if (this.cell_matches(tmplmatch[i], arr) === false) {
                    return false;
                }
            }
            //Only if all cells match do we have a match.
            return true;
        },
        //The cells from a parsed document have nested structures. This function converts such
        //a nested structure into a more or less flattened one for a whole row.
        "flatten_row": function (row) {
            //And this inner function does the same for a single cell.
            //Second argument is the column number.
            function flatten_cell(cell, column) {
                //Start off with an empty return value object for our flattened cell.
                const rval = {};
                //Remember the column our cell came from.
                rval.column = column;
                //Itterate all the keys in the original cell
                const keys = Object.keys(cell);
                for (let ki = 0; ki < keys.length; ki += 1) {
                    const key = keys[ki];
                    //We ignore the "x" and "y" keys.
                    if (key !== "x"  && key !== "y" && key !== "w" && key !== "h" && key !== "sw") {
                        //The "R" key designates a nested object.
                        if (key === "R") {
                            if (cell[key].length !== 1) {
                                //If the R holds more than one object, we don't have
                                //the right logic to flatten the cell!
                                throw Error("Unexpected length for R array");
                            }
                            //Itterate all the keys in the R nested object.
                            const keys2 = Object.keys(cell[key][0]);
                            for (let ki2 = 0; ki2 < keys2.length; ki2 += 1) {
                                const key2 = keys2[ki2];
                                //The R::TS key designates an array that we want to
                                //convert to seperate attributes.
                                if (key2 === "TS") {
                                    if (cell.R[0][key2].length !== 4) {
                                        throw Error("Unexpected length for TS");
                                    }
                                    rval.f_fc = cell.R[0][key2][0];
                                    rval.f_sz = cell.R[0][key2][1];
                                    rval.f_bd = cell.R[0][key2][2];
                                    rval.f_it = cell.R[0][key2][3];
                                } else {
                                    //A "T" attributes required URL-decoding.
                                    if (key2 === "T") {
                                        rval[key2] = decodeURIComponent(cell.R[0][key2]);
                                    } else {
                                        rval[key2] = cell.R[0][key2];
                                    }
                                }
                            }
                        } else {
                            rval[key] = cell[key];
                        }
                    }
                }
                return rval;
            }
            //Start of the outer function
            const rval = [];
            //Itterate the whole row.
            for (let i = 0; i < row.length; i += 1) {
                //Get our specific cell.
                const cell = row[i];
                if (cell.length > 0) {
                    //Non empty cell.
                    //There might be more than one object in a single cell.
                    for (let i2 = 0; i2 < cell.length; i2 += 1) {
                        const fc = flatten_cell(cell[i2], i);
                        rval.push(fc);
                    }
                } else {
                    //Empty cell.
                    const empty = {};
                    empty.elt = "Empty";
                    empty.column = i;
                    rval.push(empty);
                }
            }
            return rval;
        },
        //Make an adjusted version of the matching proposal that also matches the extra line
        "proposal_positive_adjust": function (proposal, line, regexcandidates) {
            //If the line already matches, we are done.
            if (this.row_matches(proposal, line)) {
                return proposal;
            }
            //Start off with an empty new proposal.
            const newproposal = [];
            //Itterate all elements from the previous proposal.
            for (let i = 0; i < proposal.length; i += 1) {
                if (this.cell_matches(proposal[i], line)) {
                    //Cells that match completely are copied to the new proposal
                    newproposal.push(proposal[i]);
                } else {
                    //Cells that don't need some more attention.
                    //
                    //DOCREF:KniplijnNaarMatchlineLogica.doc:Level=2a;Item=1
                    const keys = Object.keys(proposal[i]);
                    //Create a new cell proposal
                    const cellproposal = {};
                    cellproposal.elt =  proposal[i].elt;
                    //First try with just this specific column
                    cellproposal.column =  proposal[i].column;
                    //if (!cell_matches(cellproposal, line)) {
                    //    //Ok, without the column numbere then.
                    //    delete cellproposal.column;
                    //}
                    if (this.cell_matches(cellproposal, line)) {
                        //Ok, the type only cell matches, there is hope.
                        //Itterate over all the keys in the original proposal.
                        for (let ki = 0; ki < keys.length; ki += 1) {
                            //Make a deep copy of the current cell proposal
                            //and copy the one attribute designated by the current key.
                            const newtry = json.parse(json.stringify(cellproposal));
                            newtry[keys[ki]] = proposal[i][keys[ki]];
                            if (this.cell_matches(newtry, line)) {
                                //If the matching cell still matches, use the attribute
                                //in our new cell match also.
                                cellproposal[keys[ki]] = proposal[i][keys[ki]];
                            } else {
                                //If it doesn't and we are looking at the "T" attribute,
                                //maybe the use of regexes could help.
                                //DOCREF:KniplijnNaarMatchlineLogica.doc:Level=2a;Item=1.1
                                if (keys[ki] === "T") {
                                    //Start off with an empty list of regexes.
                                    const regexset = [];
                                    //Itterate over all the regex candidates.
                                    for (let ri = 0; ri < regexcandidates.length; ri += 1) {
                                        const candidate = regexcandidates[ri];
                                        const re = new RegExp(candidate.regex, "u");
                                        if (re.test(proposal[i][keys[ki]])) {
                                            //We have found a matching regex.
                                            //Need to look if we already had this one.
                                            let inthere = false;
                                            if (regexset.length > 0) {
                                                for (let ri2 = 0; ri2 < regexset.length; ri2 += 1) {
                                                    if (candidate.regex === regexset[ri2].regex) {
                                                        inthere = true;
                                                    }
                                                }
                                            }
                                            //Add regex if we hadn't already.
                                            if (inthere === false) {
                                                regexset.push(candidate);
                                            }
                                        }
                                    }
                                    //regexlist should replace the T.
                                    if (regexset.length > 0) {
                                        delete newtry.T;
                                        newtry.regexlist = regexset;
                                        //Test once more using the regex set in the proposal.
                                        if (this.cell_matches(cellproposal, line)) {
                                            //If it matches, add regexlist to cell proposal.
                                            cellproposal.regexlist = regexset;
                                        }
                                    }
                                }
                            }
                        }
                        //Add cell proposal to the new proposal
                        newproposal.push(cellproposal);
                    }
                }
            }
            //Return null if our poposal is empty.
            if (newproposal.length === 0) {
                return null;
            }
            return newproposal;
        },
        //Test if non of the not to be matching lines matches against a template proposal
        "nothing_matches": function (tmplmatch, matrix) {
            //Itterate all rows in the matrix
            for (let i = 0; i < matrix.length; i += 1) {
                //If even one row matches, return false
                if (this.row_matches(tmplmatch, matrix[i])) {
                    return false;
                }
            }
            //If none of the rows match return true.
            return true;
        },
        "minimize_proposal": function (prop, nmlines, regexcandidates) {
            if (aggressive_regex === true) {
                for (let prop_index = 0; prop_index < prop.length; prop_index += 1) {
                    {
                        if (prop[prop_index].elt === "Texts" && prop[prop_index].hasOwnProperty("T")) {
                            const try_delete = prop[prop_index].T;
                            delete prop[prop_index].T;
                            const regexset = [];
                            for (let ri2 = 0; ri2 < regexcandidates.length; ri2 += 1) {
                                const candidate = regexcandidates[ri2];
                                const re = new RegExp(candidate.regex, "u");
                                if (re.test(try_delete)) {
                                    prop[prop_index].regexlist = [candidate];
                                    if (this.nothing_matches(prop, nmlines)) {
                                        regexset.push(candidate);
                                    }
                                }
                            }
                            if (regexset.length > 0) {
                                //Managed to find replacement regex.
                                prop[prop_index].regexlist = regexset;
                                if (!this.nothing_matches(prop, nmlines)) {
                                    //Bummer, we get matches now where we shouldn't, let's
                                    //try to fix that.
                                    delete prop[prop_index].regexlist;
                                    if (drop_nonregex_text) {
                                        return [];
                                    }
                                    prop[prop_index].T = try_delete;
                                }
                            } else {
                                //Nope, restore the T
                                if (drop_nonregex_text === false) {
                                    prop[prop_index].T = try_delete;
                                } else {
                                    if (!this.nothing_matches(prop, nmlines)) {
                                        return [];
                                    }

                                }
                                if (prop[prop_index].hasOwnProperty("regexlist")) {
                                    delete prop[prop_index].regexlist;
                                }
                            }
                        }
                    }
                }
            }
            //DOCREF:KniplijnNaarMatchlineLogica.doc:Level=2b 1.1/1.2
            //Sort first before trying to remove;
            //Sort in order we would like to try and remove cells from the match candidate
            const sorted_prop = [];
            for (let i = 0; i < 4; i += 1) {
                let filter = [];
                switch (i) {
                case 3:
                    filter = ["Empty"];
                    break;
                case 2:
                    filter = ["Texts"];
                    break;
                case 1:
                    filter = ["Fills"];
                    break;
                case 0:
                    filter = ["HLines", "VLines"]; //NOTE: change from design!!
                }
                for (let prop_index = 0; prop_index < prop.length; prop_index += 1) {
                    if (filter.includes(prop[prop_index].elt)) {
                        sorted_prop.push(prop[prop_index]);
                    }
                }
            }
            //Try to remove full cells in order as sorted
            const rval = [];
            const emptycells = [];
            while (sorted_prop.length > 0) {
                if (strip_attributes_first) {
                    const dont_remove = sorted_prop.pop();
                    rval.push(dont_remove);
                } else {
                    //Cell we want to try and remove
                    const try_remove = sorted_prop.pop();
                    //Non of the non matching lines should match with the cell removed
                    if (!this.nothing_matches(sorted_prop.concat(rval), nmlines)) {
                        //If one does, we need to put our removed cell back.
                        rval.push(try_remove);
                    } else {
                        if (try_remove.elt === "Empty") {
                            emptycells.push(try_remove);
                        }
                    }
                }
            }
            //Now that we have whole cells removed and have the minimum set of removed cells,
            //we continue to look if we can strip attributes.
            //Itterate over each of the remaining cells
            for (let ri = rval.length - 1; ri >= 0; ri -= 1) {
                if (rval[ri].elt === "Texts") {
                    //DOCREF:KniplijnNaarMatchlineLogica.doc:Level=2b 2.1
                    //Try removing complete regexlist.
                    if ("regexlist" in rval[ri]) {
                        //If there is a text matching cell with a regex list,
                        //first see if we can do without completely.
                        const try_delete = rval[ri].regexlist;
                        delete rval[ri].regexlist;
                        if (!this.nothing_matches(rval, nmlines)) {
                            //If we can't, start off with a new empty regex set
                            const regexset = [];
                            for (let rj = 0; rj < try_delete.length; rj += 1) {
                                const candidate = try_delete[rj];
                                rval[ri].regexlist = [candidate];
                                if (this.nothing_matches(rval, nmlines)) {
                                    //If an individual regex matches none of the non matching lines
                                    //add that regex back to the set.
                                    regexset.push(candidate);
                                }
                            }
                            //Add back the stripped down regex set.
                            rval[ri].regexlist = regexset;
                        }
                    }
                    //Try removing T.
                    if ("T" in rval[ri]) {
                        const try_delete = rval[ri].T;
                        delete rval[ri].T;
                        if (!this.nothing_matches(rval, nmlines)) {
                            //DOCREF:KniplijnNaarMatchlineLogica.doc:Level=2b 2.2
                            //That didn't work, try re-introducing an empty cell.
                            let ok = false;
                            for (let ndx = 0; ndx < emptycells.length; ndx += 1) {
                                if (ok === false) {
                                    const trycell = emptycells[ndx];
                                    rval.push(trycell);
                                    if (!this.nothing_matches(rval, nmlines)) {
                                        rval.pop();
                                    } else {
                                        ok = true;
                                    }
                                }
                            }
                            if (ok === false) {
                            //That didn't work, try replacing with a regex.
                                const regexset = [];
                                for (let ri2 = 0; ri2 < regexcandidates.length; ri2 += 1) {
                                    const candidate = regexcandidates[ri2];
                                    const re = new RegExp(candidate.regex, "u");
                                    if (re.test(try_delete)) {
                                        rval[ri].regexlist = [candidate];
                                        if (this.nothing_matches(rval, nmlines)) {
                                            regexset.push(candidate);
                                        }
                                    }
                                }
                                if (regexset.length > 0) {
                                    //Managed to find replacement regex.
                                    rval[ri].regexlist = regexset;
                                    if (!this.nothing_matches(rval, nmlines)) {
                                        delete rval[ri].regexlist;
                                        rval[ri].T = try_delete;
                                    }
                                } else {
                                    //Nope, restore the T
                                    rval[ri].T = try_delete;
                                    if (rval[ri].hasOwnProperty("regexlist")) {
                                        delete rval[ri].regexlist;
                                    }
                                }
                            }
                        }
                    }
                    //We may have more than one regexes now, lets just keep one
                    if ("regexlist" in rval[ri]) {
                        //DOCREF:KniplijnNaarMatchlineLogica.doc:Level=2b 2.3
                        let bestindex = -1;
                        let highest = 0;
                        //Find the regex with the highest weight
                        for (let i = 0; i < rval[ri].regexlist.length; i += 1) {
                            if (rval[ri].regexlist[i].weight > highest) {
                                highest = rval[ri].regexlist[i].weight;
                                bestindex = i;
                            }
                        }
                        //Set the regex to just the one with the highest weight.
                        if (bestindex > -1) {
                            rval[ri].regexlist = [rval[ri].regexlist[bestindex]];
                        }
                    }
                }
                //Now er look at removing all the attributes we can
                //DOCREF:KniplijnNaarMatchlineLogica.doc:Level=2b 2.4
                const keys = Object.keys(rval[ri]);
                //Itterate all the keys in a rorted way
                keys.sort();
                keys.reverse();
                for (let ki = 0; ki < keys.length; ki += 1) {
                    const key = keys[ki];
                    //Skip regexlist,column,row and elt, try everything else
                    if (key !== "regexlist" && key !== "column" && key !== "row" && key !== "elt") {
                        if (key !== "T" || rval[ri].elt !== "Texts") {
                            //Remove the attribute
                            const try_delete = rval[ri][key];
                            delete rval[ri][key];
                            //Restore it if we must.
                            if (!this.nothing_matches(rval, nmlines)) {
                                rval[ri][key] = try_delete;
                            }
                        }
                    }
                }
            }
            //Try to remove full cells in order as sorted
            const rval2 = [];
            while (rval.length > 0) {
                if (strip_attributes_first === false) {
                    const dont_remove = rval.pop();
                    rval2.push(dont_remove);
                } else {
                    //Cell we want to try and remove
                    const try_remove = rval.pop();
                    //Non of the non matching lines should match with the cell removed
                    if (!this.nothing_matches(rval.concat(rval2), nmlines)) {
                        //If one does, we need to put our removed cell back.
                        rval2.push(try_remove);
                    } 
                }
            }
            return rval2;
        },
        //Given an array of rasters and an array of row sets with lines that are considered
        //to need to be matches, propose a matching rule that matches the designated lines,
        //yet not any of the lines interleaving the designated lines from the top down.
        "propose_horizontal_down_match": function (rasters, rowsets, regexcandidates) {
            const matchinglines = [];
            const nonmatchinglines = [];
            //Create a set with all possible attributes found in the designated rasters.
            const possibleattributes = new Set([]);
            for (let ri = 0; ri < rasters.length; ri += 1) {
                for (let rj = 0; rj < rasters[ri].length; rj += 1) {
                    const raster = rasters[ri][rj];
                    const flatrow = this.flatten_row(raster);
                    for (let j = 0; j < flatrow.length; j += 1) {
                        const keys = Object.keys(flatrow[j]);
                        for (let k = 0; k < keys.length; k += 1) {
                            possibleattributes.add(keys[k]);
                        }
                    }
                }
            }
            //Fill the positives and the negatives
            //DOCREF:KniplijnNaarMatchlineLogica.doc:Level=1;Item=1..3
            for (let ri = 0; ri < rasters.length; ri += 1) {
                let maxrow = -1;
                const rows = rowsets[ri];
                const raster = rasters[ri];
                for (let i = 0; i < rows.length; i += 1) {
                    if (rows[i] > maxrow) {
                        maxrow = rows[i];
                    }
                }
                const matchinglinenumbers = new Set(rows);
                for (let i = 0; i < maxrow + 1; i += 1) {
                    if (matchinglinenumbers.has(i)) {
                        matchinglines.push(this.flatten_row(raster[i]));
                    } else {
                        nonmatchinglines.push(this.flatten_row(raster[i]));
                    }
                }
            }
            //Start off with using the whole first matching line as proposal
            //DOCREF:KniplijnNaarMatchlineLogica.doc:Level=1;Item=4
            let proposal = json.parse(json.stringify(matchinglines[0]));
            //Add loads of null stuff for attributes missing.
            const keys = possibleattributes.keys();
            for (let i = 0; i < keys.length; i += 1) {
                const mightbemissing = keys[i];
                for (let i = 0; i < proposal.length; i += 1) {
                    if (!(mightbemissing in proposal[i])) {
                        proposal[i][mightbemissing] = null;
                    }
                }
            }
            //DOCREF:KniplijnNaarMatchlineLogica.doc:Level=1;Item=5
            for (let i = 0; i < matchinglines.length; i += 1) {
                //Adjust the initial proposal so other matching line match as well.
                proposal = this.proposal_positive_adjust(proposal, matchinglines[i], regexcandidates);
                if (proposal === null) {
                    return null;
                }
            }
            //DOCREF:KniplijnNaarMatchlineLogica.doc:Level=1;Item=6
            if (proposal.length === 0) {
                return null;
            }
            //DOCREF:KniplijnNaarMatchlineLogica.doc:Level=1;Item=7
            if (this.nothing_matches(proposal, nonmatchinglines) === false) {
                return null;
            }
            //DOCREF:KniplijnNaarMatchlineLogica.doc:Level=1;Item=8
            proposal = this.minimize_proposal(proposal, nonmatchinglines, regexcandidates);
            //DOCREF:KniplijnNaarMatchlineLogica.doc:Level=1;Item=9
            return proposal;
        },
        //Transform an existing matrix in such a way that we can apply standarized
        //operations on it no matter it's original orientation.
        "transform_matrix": function ({
            matrix =  [],
            direction_swap = false,
            rowcol_swap = false
        }) {
            if (matrix.length === 0) {
                return [];
            }
            if (matrix[0].length === 0) {
                return [];
            }
            //Make a deep copy of the matrix and set it as return value.
            let rval = json.parse(json.stringify(matrix));
            if (rowcol_swap) {
                //Swap the rows and cols if requested.
                rval = [];
                for (let nri = 0; nri < matrix[0].length; nri += 1) {
                    rval.push([]);
                    for (let nci = 0; nci < matrix.length; nci += 1) {
                        rval[nri].push(matrix[nci][nri]);
                    }
                }
            }
            //Swap up and down if requested.
            if (direction_swap) {
                rval.reverse();
            }
            return rval;
        },
        //as above but for a collection of matrices.
        "tranform_matrices": function ({
            matrices =  [[]],
            direction_swap = false,
            rowcol_swap = false
        }) {
            const rval = [];
            for (let i = 0; i < matrices.length; i += 1) {
                const transformed = this.transform_matrix({
                    matrix: matrices[i],
                    direction_swap: direction_swap,
                    rowcol_swap: rowcol_swap
                });
                rval.push(transformed);
            }
            return rval;
        },
        //If we use reversed rows (up <-> down), we need to change the line numbers
        //accordingly.
        "reverse_row_indices": function ({
            indices = [[]],
            matrices =  [[]]
        }) {
            const rval = [];
            if (indices.length !== matrices.length) {
                throw Error("indices and matrices arrays should have the same length.");
            }
            for (let i1 = 0; i1 < indices.length; i1 += 1) {
                const matrixlenght = matrices[i1].length;
                rval.push([]);
                //reversed index into the indices list.
                const i = rval.length - 1;
                for (let i2 = 0; i2 < indices[i1].length; i2 += 1) {
                    //Fill rval with inverted matrix row indices.
                    rval[i].push(matrixlenght - indices[i1][i2] - 1);
                }
            }
            return rval;
        },
        //Given an array of rasters and an array of row sets with lines that are considered
        //to need to be matches, propose a matching rule that matches the designated lines,
        //yet not any of the lines interleaving the designated lines from the bottom up.
        "propose_horizontal_up_match": function (rasters, rowsets, regexcandidates) {
            //Invert the rasters
            const inverted_rasters = this.tranform_matrices({
                matrices: rasters,
                direction_swap: true,
                rowcol_swap: false
            });
            //Invert the indices
            const inverted_lines = this.reverse_row_indices({
                indices: rowsets,
                matrices: rasters
            });
            //Call the up->down version of the logic and return the resulting match
            const rval = this.propose_horizontal_down_match(inverted_rasters, inverted_lines, regexcandidates);
            return rval;
        },
        //Find all the row (or column) indices that would match a given match rule.
        "find_match_instances": function (rasterarray, match, repeat, splitoncols, reversedirection) {
            let arr = rasterarray;
            //Swap rows and cols if requested
            if (splitoncols) {
                arr = this.transform_matrix({
                    matrix: rasterarray,
                    direction_swap: false,
                    rowcol_swap: true
                });
            }
            const rval = [];
            let linecount = 0;
            //
            for (let rstri = 0; rstri < arr.length; rstri += 1) {
                rval.push([]);
                //Look at each row in the matrix
                for (let rowi = 0; rowi < arr[rstri].length; rowi += 1) {
                    linecount += 1;
                    //Work with a flattened version of the row.
                    const frow = this.flatten_row(arr[rstri][rowi]);
                    if (this.row_matches(match, frow)) {
                        //If repeat is set to true we want more than one result.
                        //So we append if repeat is true OR our result is still empty.
                        if (repeat || rval[rstri].length === 0) {
                            rval[rstri].push(rowi);
                        } else {
                            //If the result isn't empty, we may not have the right match yet.
                            //If reverse direction is desired, we need to find the LAST matching line.
                            if (repeat === false && reversedirection && rval[rstri].length === 1) {
                                rval[rstri][0] = rowi;
                            }
                        }
                    }
                }
            }
            return rval;
        },
        //Compare template match cell with flattened raster text cell
        //A cell will match 0.0% or 100% only.
        "cellmatch": function (rastercell, templatecell) {
            let isvar = false;
            if (templatecell.matchtype === "var") {
                isvar = true;
            }
            //Skip cells always match
            if (templatecell.matchtype === "skip") {
                return [1.0, isvar];
            }
            //Compare all font related fields. Each of them needs to match.
            if (templatecell.f_fc !== rastercell.TS[0]) {
                return [0.0, isvar];
            }
            if (templatecell.f_sz !== rastercell.TS[1]) {
                return [0.0, isvar];
            }
            if (templatecell.f_bd !== rastercell.TS[2]) {
                return [0.0, isvar];
            }
            if (templatecell.f_it !== rastercell.TS[3]) {
                return [0.0, isvar];
            }
            //If the font matches and this is a variable, then we have a match
            if (templatecell.matchtype === "var") {
                return [1.0, isvar];
            }
            //Otherwise, this is a constant and we need to check the content also
            if (templatecell.content === decodeURIComponent(rastercell.T)) {
                return [1.0, isvar];
            } else {
                return [0.0, isvar];
            }
        },
        //Determine the matching weight for a whole leaf node
        "get_leaf_match_weight": function (raster, document, pageno, template, ttp) {
            //FIXME: need to implement horizontal colapsing
            const collapse = template.collapse;
            if (collapse === "horizontal") {
                throw Error("Collapsing horizontally not yet implemented in get_leaf_match_weight");
            }
            //Not a single variable type cell has yet been identified
            let has_var = 0;
            //Initialize our return value with an empty object.
            const rval = {};
            //Initialize the total weight of how match we actually match at zero.
            rval.weight = 0.0;
            //Get the text raster representation of our leaf node.
            const traster = ttp.as_text_raster({raster: raster, collapse: collapse });
            //In order to be able to match, the template and the leaf node raster must
            //have the exact same dimentions.
            if (traster.length === template.designations.length &&
                traster[0].length === template.designations[0].length) {
                //The sum of all cell level match values
                let totalweight = 0.0;
                //The number of somewhat matching cells.
                let matchcount = 0;
                //Itterate each of the cell pairs of the text raster and template.
                for (let row = 0; row < traster.length; row += 1) {
                    for (let col = 0; col < traster[row].length; col += 1) {
                        const rastercell = traster[row][col];
                        const templatecell =  template.designations[row][col];
                        //Ignore null cells.
                        if (rastercell !== null) {
                            //One more cell with a weight.
                            matchcount += 1;
                            //See if the non-null cell matches
                            if (templatecell !== null) {
                                const [weight, isvar] = this.cellmatch(rastercell, templatecell);
                                //Update the total march count
                                totalweight += weight;
                                if (isvar) {
                                    //The leaf node contains at least one variable
                                    has_var = true;
                                }
                            }
                        }
                    }
                }
                //If there was nothing to match, then everything matched.
                if (matchcount === 0) {
                    rval.weight = 1.0;
                } else {
                    //Otherwise, we use the average matching weight of those cells
                    //that could match for this leaf node.
                    rval.weight = totalweight / matchcount;
                }
            } else {
                //If the dimensions are not the some, we have no match
                rval.weight = 0.0;
            }
            //Floating point equality, > 0.99999 means we have a fill (1.00000) match
            if (rval.weight > 0.99999) {
                rval.fullmatch = true;
                rval.found = true;
            } else {
                rval.fullmatch = false;
                //We don't have a full match. If we are below 0.4 in weight
                //we consider that we don't have a match at all.
                if (rval.weight < 0.4) {
                    rval.found = false;
                } else {
                    rval.found = true;
                }
            }
            //Return the return value and a boolen indicating if there are 'any' vars in this leaf node.
            return [rval, has_var];
        },
        //Get the matching weight plus meta data for a single record at some level.
        "get_single_record_match_weight": function (
            praster,
            document,
            pageno,
            template,
            firstline,
            lastline,
            ttp) {
            //A record type node in the template has only one child template.
            const tmpl = template.children[0];
            const recordraster = document(
                {
                    p: pageno,
                    minxdiff: tmpl.minxdiff,
                    minydiff: tmpl.minydiff,
                    parentraster: praster,
                    rgreaterorequal: firstline,
                    rlessorequal: lastline
                }
            );
            if (tmpl.nodetype === "nonleaf") {
                //A structure with nested records, process all subbranches for this record
                // eslint-disable-next-line no-use-before-define
                return this.get_nonleaf_match_weight(recordraster, document, pageno, tmpl, ttp);
            } else {
                //A normal leaf-node record.
                return this.get_leaf_match_weight(recordraster, document, pageno, tmpl, ttp);
            }
        },
        //Get the matching weight for a non-leaf node with a collection of child records
        "get_nonleaf_records_match_weight": function (raster, document, pageno,  template, ttp) {
            //Get the matching line for the match rule in the template
            const instance_indices = this.find_match_instances(
                [raster],
                template.match,
                true,
                false,
                template.reversed
            );
            const rval = {};
            //If no lines are found, our non-leaf node isn't a match
            if (instance_indices.length === 0 || instance_indices[0].length === 0) {
                rval.weight = 0.0;
                rval.fullmatch = false;
                rval.found = false;
                return [rval, false];
            }
            //Our separator itself is worth 0.1 of the max weight of this node.
            rval.weight = 0.1;
            //Empty list of child node match info.
            rval.children = [];
            //Determine how many children we are to be expecting.
            //Start of with the number of matches found
            let expectedcount = instance_indices[0].length;
            if (instance_indices[0][0] !== 0 &&
                instance_indices[0][instance_indices[0].length - 1] !== raster.length - 1) {
                //If the first index doesn't point to the first row in the raster
                // and the last index doesn't point to the last line in the raster,
                // we'll expect one more.
                expectedcount += 1;
            }
            if (instance_indices[0][0] -= 0 &&
                instance_indices[0][instance_indices[0].length - 1] === raster.length - 1) {
                //If the first index points to the first row in the raster
                // AND the last index points to the last line in the raster,
                // we'll expect one less
                expectedcount -= 1;
            }
            //How much children have we actually seen so far
            let realcount = 0;
            //Determine the relative weight of a single record child node.
            //90% divided by the expected number of child nodes.
            const okrecordweight = 0.9 / expectedcount;
            const include = template.include;
            //Does any of the records have any variables.
            let hasvar = false;
            //Itterate over all seperator lines
            for (let r = 0; r < instance_indices.length; r += 1) {
                //Skip the seperator line unless its defined as part of raster 2.
                let skip = 1;
                let append = 0;
                if (include === "part2") {
                    skip = 0;
                } else {
                    if (include === "part1") {
                        append = 1;
                    }
                }
                if (instance_indices[r][0] === 0) {
                    //The first seperator is the first line in the raster.
                    //Process seperator lines starting fron the SECOND one
                    for (let i = 1; i < instance_indices[r].length; i += 1) {
                        let v = undefined;
                        let hasvar1 = undefined;
                        //Look at matching strength of one child
                        [v, hasvar1] = this.get_single_record_match_weight(
                            raster,
                            document,
                            pageno,
                            template,
                            instance_indices[r][i - 1] + skip,
                            instance_indices[r][i] - 1 + append,
                            ttp);
                        //Keep counting the real number of children.
                        realcount += 1;
                        rval.children.push(v);
                        //Add weight to the total weight.
                        rval.weight += okrecordweight * v.weight;
                        //Even if only one record has values, the total has values
                        if (hasvar1) {
                            hasvar = true;
                        }
                    }
                    //If there is still one to process, do the last one.
                    if (realcount < expectedcount) {
                        let v2 = undefined;
                        let hasvar2 = undefined;
                        //Look at matching strength of the final child
                        [v2, hasvar2] = this.get_single_record_match_weight(
                            raster,
                            document,
                            pageno,
                            template,
                            instance_indices[r][instance_indices[r].length - 1] + skip,
                            raster.length - 1,
                            ttp);
                        //Keep counting the real number of children.
                        realcount += 1;
                        rval.children.push(v2);
                        //Add weight to the total weight.
                        rval.weight += okrecordweight * rval.children[rval.children.length - 1].weight;
                        //Even if only one record has values, the total has values
                        if (hasvar2) {
                            hasvar = true;
                        }
                    }
                } else {
                    //The first seperator is NOT the first line in the raster.
                    let v = undefined;
                    let hasvar1 = undefined;
                    //Process the first record seperate from the rest.
                    [v, hasvar1] = this.get_single_record_match_weight(
                        raster,
                        document,
                        pageno,
                        template,
                        0,
                        instance_indices[r][0] - 1 + append,
                        ttp);
                    //Keep counting the real number of children.
                    realcount += 1;
                    rval.children.push(v);
                    //Add weight to the total weight.
                    rval.weight += okrecordweight * rval.children[rval.children.length - 1].weight;
                    //Even if only one record has values, the total has values
                    if (hasvar1) {
                        hasvar = true;
                    }
                    //Continue processing seperator lines starting fron the second one
                    for (let i = 1; i < instance_indices[r].length; i += 1) {
                        let v2 = undefined;
                        let hasvar2 = undefined;
                        //Look at matching strength of the final child
                        [v2, hasvar2] = this.get_single_record_match_weight(
                            raster,
                            document,
                            pageno,
                            template,
                            instance_indices[r][i - 1] + skip,
                            instance_indices[r][i] - 1 + append,
                            ttp
                        );
                        //Keep counting the real number of children.
                        realcount += 1;
                        rval.children.push(v2);
                        //Add weight to the total weight.
                        rval.weight += okrecordweight * rval.children[rval.children.length - 1].weight;
                        //Even if only one record has values, the total has values
                        if (hasvar2) {
                            hasvar = true;
                        }
                    }
                    //There might be one more to process
                    if (instance_indices[r][instance_indices[r].length - 1] !== raster.length - 1) {
                        let v3 = undefined;
                        let hasvar3 = undefined;
                        //Look at matching strength of the final child
                        [v3, hasvar3] = this.get_single_record_match_weight(
                            raster,
                            document,
                            pageno,
                            template,
                            instance_indices[r][instance_indices[r].length - 1] + skip,
                            raster.length - 1,
                            ttp
                        );
                        //Keep counting the real number of children.
                        realcount += 1;
                        rval.children.push(v3);
                        //Add weight to the total weight.
                        rval.weight += okrecordweight * rval.children[rval.children.length - 1].weight;
                        //Even if only one record has values, the total has values
                        if (hasvar3) {
                            hasvar = true;
                        }
                    }
                }
            }
            //The real number of children should equate the expected number.
            if (expectedcount !== realcount && template.repeat !== "record") {
                throw Error("Expected and real count didn't match!");
            }
            //Floting point equivalent of rval.weight === 1.0
            if (rval.weight > 0.99999) {
                rval.fullmatch = true;
                rval.found = true;
                delete rval.children;
            } else {
                rval.fullmatch = false;
                if (rval.weight < 0.4) {
                    rval.found = false;
                } else {
                    rval.found = true;
                }
            }
            return [rval, hasvar];
        },
        //Matching weight calculation for a simple top/bottom split
        "get_nonleaf_simple_match_weight": function (praster, document, pageno, template, ttp) {
            //Get the matching line for the match rule in the template
            const instance_indices = this.find_match_instances(
                [praster],
                template.match,
                false,
                false,
                template.reversed);
            const rval = {};
            //If no lines are found, our non-leaf node isn't a match.
            if (instance_indices.length === 0) {
                rval.weight = 0.0;
                rval.fullmatch = false;
                rval.found = false;
                return [rval, false];
            }
            //Our separator itself is worth 0.1 of the max weight of this node.
            rval.weight = 0.1;
            let topraster = null;
            //Empty list of child node match info.
            rval.children = [];
            // Keep track if top and bottom actually contain variables.
            let isvar1 = false;
            let isvar2 = false;
            //Get the raster for the top.
            //If template defines the matching line to be included in the top raster,
            // then include it.
            if (template.include === "part1") {
                topraster = document(
                    {
                        p: pageno,
                        minxdiff: template.children[0].minxdiff,
                        minydiff: template.children[0].minydiff,
                        parentraster: praster,
                        rgreaterorequal: 0,
                        rlessorequal: instance_indices[0][0]
                    }
                );
            } else {
                if (instance_indices[0][0] === 0) {
                    return [rval, false];
                }
                topraster = document(
                    {
                        p: pageno,
                        minxdiff: template.children[0].minxdiff,
                        minydiff: template.children[0].minydiff,
                        parentraster: praster,
                        rgreaterorequal: 0,
                        rlessthan: instance_indices[0][0]
                    }
                );
            }
            //Get matching weight and meta for top raster/template combo depending on
            // child type in template.
            if (template.children[0].nodetype === "nonleaf") {
                let v = undefined;
                // eslint-disable-next-line no-use-before-define
                [v, isvar1] = this.get_nonleaf_match_weight(topraster, document, pageno, template.children[0], ttp);
                rval.children.push(v);
            } else {
                let v = undefined;
                [v, isvar1] = this.get_leaf_match_weight(topraster, document, pageno, template.children[0], ttp);
                rval.children.push(v);
            }
            //Get the raster for the bottom.
            //If template defines the matching line to be included in the bottom raster,
            // then include it.
            let bottomraster = null;
            if (template.include === "part2") {
                bottomraster = document(
                    {
                        p: pageno,
                        minxdiff: template.children[1].minxdiff,
                        minydiff: template.children[1].minydiff,
                        parentraster: praster,
                        rgreaterorequal: instance_indices[0][0],
                        rlessorequal: praster.length - 1
                    }
                );
            } else {
                bottomraster = document(
                    {
                        p: pageno,
                        minxdiff: template.children[1].minxdiff,
                        minydiff: template.children[1].minydiff,
                        parentraster: praster,
                        rgreaterthan: instance_indices[0][0],
                        rlessorequal: praster.length - 1
                    }
                );
            }
            //Get matching weight and meta for bottom raster/template combo depending on
            // child type in template.
            if (template.children[1].nodetype === "nonleaf") {
                let v = undefined;
                // eslint-disable-next-line no-use-before-define
                [v, isvar2] = this.get_nonleaf_match_weight(bottomraster, document, pageno, template.children[1], ttp);
                rval.children.push(v);
            } else {
                let v = undefined;
                [v, isvar2] = this.get_leaf_match_weight(bottomraster, document, pageno, template.children[1], ttp);
                rval.children.push(v);
            }
            //If one of the two children contains variables, then by proxy so does this node.
            const isvar = isvar1 || isvar2;
            if (isvar1 === isvar2) {
                //If both or neither top and bottom contain vars, weigh nodes equally
                rval.weight += 0.45 *  rval.children[0].weight;
                rval.weight += 0.45 *  rval.children[1].weight;
            } else {
                //If only one contains vars, weigh that node five times as much
                if (isvar1) {
                    rval.weight += 0.75 *  rval.children[0].weight;
                    rval.weight += 0.15 *  rval.children[1].weight;
                } else {
                    rval.weight += 0.15 *  rval.children[0].weight;
                    rval.weight += 0.75 *  rval.children[1].weight;
                }
            }
            //Floating point == 1
            if (rval.weight > 0.99999) {
                rval.fullmatch = true;
                rval.found = true;
                delete rval.children;
            } else {
                //At least 0,4 to be considered a match has been found.
                rval.fullmatch = false;
                if (rval.weight < 0.4) {
                    rval.found = false;
                } else {
                    rval.found = true;
                }
            }
            return [rval, isvar];
        },
        //Get the matching weight for a non-leaf node
        "get_nonleaf_match_weight": function (raster, document, pageno, template, ttp) {
            //FIXME: Implement for vertical splits as well.
            if (template.splittype !== "horizontal") {
                throw Error("Only horizontal split currently supported for get_nonleaf_match_weight.");
            }
            //Call different weighing function depending if children are records or top and bottom.
            if (template.repeat === "none") {
                //Top and bottom weighing
                return this.get_nonleaf_simple_match_weight(raster, document, pageno, template, ttp);
            } else {
                //Collection of records weighing.
                return this.get_nonleaf_records_match_weight(raster, document, pageno, template, ttp);
            }
        },
        //Bottom of the recursive match weighing for a page and a template.
        "get_match": function (document, pageno, template, ttp) {
            //Get the raster for the page as a whole.
            const raster = document(
                {
                    p: pageno,
                    minxdiff: template.minxdiff,
                    minydiff: template.minydiff
                }
            );
            let rval = undefined;
            let isvar = false;
            //Recursively get the matching weight for the template and page raster.
            [rval, isvar]  = this.get_nonleaf_match_weight(raster,
                document,
                pageno,
                template,
                ttp);
            //copy some meta info from the template to the top level of our matching.
            rval.minxdiff = template.minxdiff;
            rval.minydiff = template.minydiff;
            return rval;
        },
        //Test if candidate is a better match than the previous best match
        "better_match": function (candidate, formerbest) {
            if (candidate.weight > formerbest.weight) {
                return true;
            } else {
                return false;
            }
        }
    };
};
