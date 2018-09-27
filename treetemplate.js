//The treetemplate module has json library and treetemplate core library as dependencies.
module.exports = function (json, core) {
    "use strict";
    //Module function returns an object literal that defines the module level methods.
    return {
        //This method implements the primarry module function:
        // * Create or restore a template collection.
        //If no collection JSON is provided from a previous run of the tool with
        //a similar document, then a brand new empty template collection is initialized.
        "collection": function ({collection = "[]"}) {
            let tpl_col = null;
            //Try to convert the collection JSON to an object.
            try {
                tpl_col = json.parse(collection);
            } catch (e) {
                throw Error("Invalid JSON for collection construction");
            }
            //If the collection isn't empty, do some basic sanity tests on its content.
            for (let i = 0; i < tpl_col.length; i += 1) {
                const tmpl = tpl_col[i];
                if (!(tmpl.hasOwnProperty("minxdiff")) || !(tmpl.hasOwnProperty("minxdiff"))) {
                    throw Error("Template JSON doesn't look like a valid template.");
                }
            }
            //"collection" closure-private method for getting a designated node from the
            // template. This function takes a node from the template and a
            // relative designation, then returns an object literal representing
            // the node.
            function get_node(treepart, designation) {
                let restore_json = "";
                let node = treepart;
                //Make a copy of the designation.
                const dsg = designation.slice();
                //Remember the minxdiff and minydiff from the node.
                let min_x_diff = node.minxdiff;
                let min_y_diff = node.minydiff;
                //Walk the template for all components of the designation.
                while (dsg.length > 0) {
                    node = node[dsg.shift()];
                    //Child values for minxdiff/minydiff overrule that of the
                    // parent.
                    if (typeof node.minxdiff !== 'undefined') {
                        min_x_diff = node.minxdiff;
                        min_y_diff = node.minydiff;
                    }
                }
                //Return an object literal representing a template node.
                return {
                    "set_restorepoint": function() {
                        if (restore_json === "") {
                            if (node.hasOwnProperty("match")) {
                                throw Error("A restore point should NOT have its match value set!");
                            }
                            restore_json = JSON.stringify(node);
                        }
                    },
                    "restore": function() {
                        if (restore_json !== "") {
                            const node2 = json.parse(restore_json);
                            for (let key in  node) {
                                if (node.hasOwnProperty(key)) {
                                    delete node[key];
                                }
                            }
                            for (let key in node2) {
                                if (node2.hasOwnProperty(key)) {
                                    node[key] = node2[key];
                                }
                            }
                        } else {
                            throw Error("NOTICE: restore called without any previous set_restorepoint call"); 
                        }
                    },
                    "clear": function() {
                        for (let prop of ["children","repeat","include","match","reversed","nodetype","splittype"]){
                            if (node.hasOwnProperty(prop)) {
                                delete node[prop];
                            }
                        }
                    },
                    //Make this template node into a non-leaf node that defines
                    //a horizontal split.
                    "horizontal_split": function (
                        {
                            repeat = "none",
                            include = "none",
                            match = [],
                            reversed = false
                        }) {
                        //A set of asserts to check sanity of input stuff
                        if (!(repeat instanceof String) && typeof repeat !== 'string') {
                            throw Error("repeat needs String as repeat argument");
                        }
                        if (!(["none", "record"].includes(repeat))) {
                            throw Error("Invalid value for repeat string");
                        }
                        if (!(include instanceof String) && typeof include !== 'string') {
                            throw Error("include needs String as include argument");
                        }
                        if (!(["none", "part1", "part2"].includes(include))) {
                            throw Error("Invalid value for include string");
                        }
                        if (!(Array.isArray(match)) || match.length === 0) {
                            throw Error("match must be a non-empty array of objects");
                        }
                        for (let i = 0; i < match.length; i += 1) {
                            const mcel = match[i];
                            if (!(mcel.hasOwnProperty("elt"))) {
                                throw Error("Match has no elt property");
                            }
                            const elt = mcel.elt;
                            if (!(elt instanceof String) && typeof elt !== 'string') {
                                throw Error("match needs String as elt attribute");
                            }
                        }
                        if (typeof reversed !== typeof true) {
                            throw Error("reversed must be a boolean!");
                        }
                        //End of asserts section for method
                        //Update the template node in corespondence with function
                        // attributes.
                        node.repeat = repeat;
                        node.include = include;
                        node.match = match;
                        node.reversed = reversed;
                        node.nodetype = "nonleaf";
                        node.splittype = "horizontal";
                        //Create two empty child nodes.
                        if (node.repeat !== "none") {
                            node.children = [
                                {
                                    "minxdiff": min_x_diff,
                                    "minydiff": min_y_diff
                                }
                            ];
                        } else {
                            node.children = [
                                {
                                    "minxdiff": min_x_diff,
                                    "minydiff": min_y_diff
                                },
                                {
                                    "minxdiff": min_x_diff,
                                    "minydiff": min_y_diff
                                }];
                        }
                    },
                    //Make this template node into a non-leaf node that defines
                    //a vertical split.
                    "vertical_split": function (
                        {
                            repeat = "none",
                            include = "none",
                            match = [],
                            reversed = false
                        }) {
                        //A set of asserts to check sanity of input stuff
                        if (!(repeat instanceof String) && typeof repeat !== 'string') {
                            throw Error("repeat needs String as repeat argument");
                        }
                        if (!(["none", "record"].includes(repeat))) {
                            throw Error("Invalid value for repeat string");
                        }
                        if (!(include instanceof String) && typeof include !== 'string') {
                            throw Error("include needs String as include argument");
                        }
                        if (!(["none", "part1", "part2"].includes(include))) {
                            throw Error("Invalid value for include string");
                        }
                        if (!(Array.isArray(match)) || match.length === 0) {
                            throw Error("match must be a non-empty array of objects");
                        }
                        for (let i = 0; i < match.length; i += 1) {
                            const mcel = match[i];
                            if (!(mcel.hasOwnProperty("elt"))) {
                                throw Error("Match has no elt property");
                            }
                            const elt = mcel.elt;
                            if (!(elt instanceof String) && typeof elt !== 'string') {
                                throw Error("match needs String as elt attribute");
                            }
                        }
                        if (typeof reversed !== typeof true) {
                            throw Error("reversed must be a boolean!");
                        }
                        //End of asserts section for method
                        //Update the template node in corespondence with function
                        // attributes.
                        node.repeat = repeat;
                        node.include = include;
                        node.match = match;
                        node.reversed = reversed;
                        node.nodetype = "nonleaf";
                        node.splittype = "vertical";
                        if (node.repeat !== "none") {
                            node.children = [
                                {
                                    "minxdiff": min_x_diff,
                                    "minydiff": min_y_diff
                                }
                            ];
                        } else {
                            node.children = [
                                {
                                    "minxdiff": min_x_diff,
                                    "minydiff": min_y_diff
                                },
                                {
                                    "minxdiff": min_x_diff,
                                    "minydiff": min_y_diff
                                }];
                        }
                    },
                    //Get the firat child of this non-leaf node
                    "first_child": function () {
                        return get_node(node, ["children", 0]);
                    },
                    //Get the second child of this non-leaf node
                    "second_child": function () {
                        return get_node(node, ["children", 1]);
                    },
                    //Make this template node into a leaf node.
                    "set_as_leaf": function (
                        {
                            collapse = "none",
                            designations = []
                        }) {
                        //A set of asserts to check sanity of input stuff
                        if (!(collapse instanceof String) && typeof collapse !== 'string') {
                            throw Error("collapse should be a string argument");
                        }
                        if (!(["none", "vertical", "horizontal"].includes(collapse))) {
                            throw Error("Invalid value for collapse argument.");
                        }
                        if (!(Array.isArray(designations)) || designations.length === 0) {
                            throw Error("designations must be a non-empty array.");
                        }
                        if (!(Array.isArray(designations[0])) || designations[0].length === 0) {
                            throw Error("designations must be a non-empty array of non empty arrays.");
                        }
                        for (let row = 0; row < designations.length; row += 1) {
                            for (let col = 0; col < designations[row].length; col += 1) {
                                const cell = designations[row][col];
                                if (cell !== null) {
                                    if (typeof cell !== 'object' || (cell instanceof Array) || (cell instanceof Date)) {
                                        throw Error("cell should contain an object.");
                                    }
                                    if (!(cell.hasOwnProperty("META"))) {
                                        throw Error("cell should contain META attribute.");
                                    }
                                }
                            }
                        }
                        if (collapse === "vertical" && designations.length > 1) {
                            throw Error("Designations may only have one row in vertical collapse mode.");
                        }
                        //End of asserts section for method
                        //Update the template node in corespondence with function
                        // attributes.
                        node.nodetype = "leaf";
                        node.collapse = collapse;
                        node.designations = [];
                        //Itterate over the designations matrix.
                        for (let row = 0; row < designations.length; row += 1) {
                            node.designations.push([]);
                            for (let idx = 0; idx < designations[row].length; idx += 1) {
                                //Copy nulls to the template node.
                                if (designations[row][idx] === null) {
                                    node.designations[row].push(null);
                                } else {
                                    //Do some basic transformation for the raster cell based info.
                                    // and user added meta data.
                                    node.designations[row].push(designations[row][idx].META);
                                    if (node.designations[row][idx].matchtype === "const") {
                                        node.designations[row][idx].content = decodeURIComponent(designations[row][idx].T);
                                    }
                                    node.designations[row][idx].f_fc = designations[row][idx].TS[0];
                                    node.designations[row][idx].f_sz = designations[row][idx].TS[1];
                                    node.designations[row][idx].f_bd = designations[row][idx].TS[2];
                                    node.designations[row][idx].f_it = designations[row][idx].TS[3];
                                }
                            }
                        }
                    },
                    //Get the base meta data for this template node.
                    "meta": function () {
                        if (node.nodetype ===  "nonleaf") {
                            return {
                                nodetype: node.nodetype,
                                splittype: node.splittype,
                                repeat: node.repeat,
                                include: node.include,
                                match: node.match,
                                reversed: node.reversed,
                                minxdiff: min_x_diff,
                                minydiff: min_y_diff
                            };
                        } else {
                            return {
                                nodetype: node.nodetype,
                                collapse: node.collapse,
                                designations: node.designations,
                                minxdiff: min_x_diff,
                                minydiff: min_y_diff
                            };
                        }
                    },
                    "update_raster_granularity": function ({
                        minxdiff = min_x_diff,
                        minydiff = min_y_diff
                    }) {
                        min_x_diff = minxdiff;
                        min_y_diff = minydiff;
                        node.minxdiff = minxdiff;
                        node.minydiff = minydiff;
                    }
                };
                //End of template node object literal returned by get_node
            }
            //"collection" closure-private method for creating a new copy of an
            // existing template from the collection and adding it to the collection.
            function copy_node(rootnode, parentindex) {
                //Push an extra copy of the designated template to the collection.
                const str = json.stringify(tpl_col[parentindex]);
                tpl_col.push(json.parse(str));
                //Return reference to the just added copy
                return get_node(rootnode, [tpl_col.length - 1]);
            }
            //The "collection" function returns a collection object literal.
            return {
                //Return a helper closure-aided object literal for getting a
                // template suitable for one specific page.
                "get_template_page_scope": function () {
                    //Start off with the invalid index into the collection.
                    let rindex = -1;
                    //Return our helper object literal for a document page.
                    return {
                        //Get a fresh new empty template.
                        "add_template": function (
                            {
                                minxdiff = 0.001,
                                minydiff = 0.001
                            }) {
                            //A set of asserts to check sanity of input stuff
                            if (typeof minxdiff !== 'number' || typeof minxdiff !== 'number') {
                                throw Error("minxfiff/minydiff should be numbers");
                            }
                            //Only one of the three methods may be called and may be
                            // called only once.
                            if (rindex !== -1) {
                                throw Error("Call only one template fetching operation per working page!");
                            }
                            //Make an empty template node and add it to collection.
                            const obj = {
                                minxdiff: minxdiff,
                                minydiff: minydiff
                            };
                            tpl_col.push(obj);
                            //Return the new emplty template we just created.
                            rindex = tpl_col.length - 1;
                            const rval = get_node(tpl_col, [tpl_col.length - 1]);
                            return rval;
                        },
                        //Get a specific template. NOTE!! : This will be an existing template,
                        //make modifications at your own perril.
                        "get_template": function (index) {
                            //A set of asserts to check sanity of input stuff
                            if (!(Number.isInteger(index)) || index < 0) {
                                throw Error("index should be a non negative integer");
                            }
                            //This method may get called more than once, but only with
                            //the exact same index.
                            if (rindex !== -1) {
                                if (index !== rindex) {
                                    throw Error("Call only one template fetching operation per working page!");
                                }
                            }
                            //Return the already existing node.
                            return get_node(tpl_col, [index]);
                        },
                        //Get a brand new copy of an existing template. Use this one if you are going
                        //to make changes to a template and want the original intact.
                        "copy_template": function (parentindex) {
                            //A set of asserts to check sanity of input stuff
                            if (!(Number.isInteger(parentindex)) || parentindex < 0) {
                                throw Error("parentindex should be a non negative integer");
                            }
                            //Only one of the three methods may be called and may be
                            // called only once.
                            if (rindex !== -1) {
                                throw Error("Call only one template fetching operation per working page!");
                            }
                            //Return a brand new copy of the designated node.
                            rindex = parentindex;
                            return copy_node(tpl_col, parentindex);
                        }
                    };
                    //End of returned template page scope object literal.
                },
                //Return a json serialized version of the template collection.
                "as_json": function () {
                    return json.stringify(tpl_col, undefined, 4);
                },
                //Size of the collection.
                "size": function () {
                    return tpl_col.length;
                },
                //Find the best pre-existing page template for a given page.
                "best_match": function (document, pageno, ttp) {
                    //A set of asserts to check sanity of input stuff
                    if (typeof document !== 'function') {
                        throw Error("document should be a function.");
                    }
                    if (!(Number.isInteger(pageno)) || pageno < 0) {
                        throw Error("pageno should be a non negative integer");
                    }
                    if (!(ttp.hasOwnProperty('propose_match'))) {
                        throw Error("ttp is not of the proper type");
                    }
                    if (typeof ttp.propose_match !== 'function') {
                        throw Error("ttp is not of the proper type");
                    }
                    if (tpl_col.length === 0) {
                        return null;
                    }
                    //Lets start of with the first template as best match.
                    let best_match = core.get_match(document, pageno, tpl_col[0], ttp);
                    best_match.index = 0;
                    //Itterate all other templates looking for a better match.
                    for (let i = 1; i < tpl_col.length; i += 1) {
                        const altmatch = core.get_match(document, pageno, tpl_col[i], ttp);
                        if (core.better_match(altmatch, best_match)) {
                            best_match = altmatch;
                            best_match.index = i;
                        }
                    }
                    return best_match;
                }
            };
            //End of collection object literal returned by "collection".
        },
        //End of module level object "collection" method.
        //Propose a match for use in template based on rasters and designated seperator(s)
        "propose_match": function ({
            rasterarray = null,
            rcindexarray = null,
            splitoncols = false,
            reversedirection = false,
            regexcandidates = []
        }) {
            //A set of asserts to check sanity of input stuff
            if (rasterarray === null || rcindexarray === null) {
                throw Error("Required function argument not set.");
            }
            if (!(Array.isArray(rasterarray)) || rasterarray.length === 0) {
                throw Error("rasterarray must be a non-empty array.");
            }
            for (let rno = 0; rno < rasterarray.length; rno += 1) {
                const raster = rasterarray[rno];
                if (!(Array.isArray(raster)) || raster.length === 0) {
                    throw Error("raster must be a non-empty array");
                }
                if (!(Array.isArray(raster[0])) || raster[0].length === 0) {
                    throw Error("raster must be a non-empty array of non empty arrays");
                }
                for (let row = 0; row < raster.length; row += 1) {
                    for (let col = 0; col < raster[row].length; col += 1) {
                        if (!(Array.isArray(raster[row][col]))) {
                            throw Error("raster cell must be an empty or a small one object array");
                        }
                        if (raster[row][col].length > 0) {
                            const v =  raster[row][col][0];
                            if (typeof v !== 'object' || v === null || (v instanceof Array) || (v instanceof Date)) {
                                throw Error("raster cell should contain an object.");
                            }
                            if (!(v.hasOwnProperty('elt'))) {
                                throw Error("raster cell object should have an 'elt' field");
                            }
                        }
                    }
                }
            }
            if (!(Array.isArray(rcindexarray)) || rcindexarray.length === 0) {
                throw Error("rcindexarray must be a non-empty array.");
            }
            for (let rno = 0; rno < rcindexarray.length; rno += 1) {
                const iset = rcindexarray[rno];
                if (!(Array.isArray(iset)) || iset.length === 0) {
                    throw Error("rcindexarray must be a non-empty array of non empty arrays.");
                }
                for (let i = 0; i < iset.length; i += 1) {
                    if (!(Number.isInteger(iset[i])) || iset[i] < 0) {
                        throw Error("rcindexarray must contain non negative integers.");
                    }
                }
            }
            if (!(Array.isArray(regexcandidates)) || regexcandidates.length === 0) {
                throw Error("regexcandidates must be a non-empty array.");
            }
            //End of asserts
            if (splitoncols === false) {
                if (reversedirection === false) {
                    return core.propose_horizontal_down_match(rasterarray, rcindexarray, regexcandidates);
                } else {
                    return core.propose_horizontal_up_match(rasterarray, rcindexarray, regexcandidates);
                }
            } else {
                if (reversedirection === false) {
                    throw Error("NOT YET IMPLEMENTED : Only split on rows currently implemented.");
                } else {
                    throw Error("NOT YET IMPLEMENTED : Only default matching (top/left) and split on rows currently implemented.");
                }
            }
        },
        //Given a match rule as found in template or returned from propose_match, find mathing rows (or cols).
        "find_matches": function (
            {
                rasterarray = null,
                match = null,
                repeat = true,
                splitoncols = false,
                reversedirection = false
            }
        ) {
            //A set of asserts to check sanity of input stuff
            if (rasterarray === null || match === null) {
                if (rasterarray === null && match === null) {
                    throw Error("Required function arguments rasterarray and match not set.");
                }
                if (rasterarray === null) {
                    throw Error("Required function arguments rasterarray not set.");
                }
                throw Error("Required function arguments match not set.");
            }
            if (!(Array.isArray(rasterarray)) || rasterarray.length === 0) {
                throw Error("rasterarray must be a non-empty array.");
            }
            for (let rno = 0; rno < rasterarray.length; rno += 1) {
                const raster = rasterarray[rno];
                if (!(Array.isArray(raster)) || raster.length === 0) {
                    throw Error("raster must be a non-empty array");
                }
                if (!(Array.isArray(raster[0])) || raster[0].length === 0) {
                    throw Error("raster must be a non-empty array of non empty arrays");
                }
                for (let row = 0; row < raster.length; row += 1) {
                    for (let col = 0; col < raster[row].length; col += 1) {
                        if (!(Array.isArray(raster[row][col]))) {
                            throw Error("raster cell must be an empty or a small one object array");
                        }
                        if (raster[row][col].length > 0) {
                            const v =  raster[row][col][0];
                            if (typeof v !== 'object' || v === null || (v instanceof Array) || (v instanceof Date)) {
                                throw Error("raster cell should contain an object.");
                            }
                            if (!(v.hasOwnProperty('elt'))) {
                                throw Error("raster cell object should have an 'elt' field");
                            }
                        }
                    }
                }
            }
            if (!(Array.isArray(match)) || match.length === 0) {
                throw Error("match must be a non-empty array of objects.");
            }
            const v =  match[0];
            if (typeof v !== 'object' || v === null || (v instanceof Array) || (v instanceof Date)) {
                throw Error("match cell should contain an object.");
            }
            if (!(v.hasOwnProperty('elt'))) {
                throw Error("match cell object should have an 'elt' field");
            }
            if (typeof (repeat) !== typeof (true)) {
                throw Error("repeat should be bool");
            }
            if (typeof (splitoncols) !== typeof (true)) {
                throw Error("splitoncols should be bool");
            }
            if (typeof (reversedirection) !== typeof (true)) {
                throw Error("reversedirection should be bool");
            }
            //End of asserts.
            const rval =  core.find_match_instances(rasterarray, match, repeat, splitoncols, reversedirection);
            return rval;
        },
        "set_restorepoint": function () {
            ;
        },
        "restore": function () {
            ;
        },
        //Get a leaf node raster from a regular raster. The leaf node raster has
        //text cells only and allows to designate these as variables or constants.
        "as_text_raster": function (
            {
                raster = [],
                collapse = "none",
                seperator = null
            }
        ) {
            // Determine seperator for colapsing.
            let sep = seperator;
            if (seperator === null) {
                if (collapse === "vertical") {
                    //For vertical collapse, newline is the default seperator
                    sep = "\n";
                } else {
                    if (collapse === "horizontal") {
                        //For horizonatl collapse, use ♞ as default seperator.
                        sep = "♞";
                    } else {
                        //Non colapsed, use ♟ as default.
                        sep = "♟";
                    }
                }
            }
            //A set of asserts to check sanity of input stuff
            if (!(sep instanceof String) && typeof sep !== 'string') {
                throw Error("as_text_raster needs String as seperator argument");
            }
            if (!(collapse instanceof String) && typeof collapse !== 'string') {
                throw Error("as_text_raster needs String as collapse argument");
            }
            if (!(Array.isArray(raster)) || raster.length === 0) {
                throw Error("raster must be a non-empty array");
            }
            if (!(Array.isArray(raster[0])) || raster[0].length === 0) {
                throw Error("raster must be a non-empty array of non empty arrays");
            }
            for (let row = 0; row < raster.length; row += 1) {
                for (let col = 0; col < raster[row].length; col += 1) {
                    if (!(Array.isArray(raster[row][col]))) {
                        throw Error("raster cell must be an empty or a small one object array");
                    }
                    if (raster[row][col].length > 0) {
                        const v =  raster[row][col][0];
                        if (typeof v !== 'object' || v === null || (v instanceof Array) || (v instanceof Date)) {
                            throw Error("raster cell should contain an object.");
                        }
                        if (!(v.hasOwnProperty('elt'))) {
                            throw Error("raster cell object should have an 'elt' field");
                        }
                    }
                }
            }
            //End of asserting code
            //Initialize return raster
            const rval = [];
            if (collapse !== "horizontal") {
                //vertical or no colapse
                //start of with an empty row
                const emptyrow = [];
                //Fill the row with a null value for each column.
                if (raster.length > 0) {
                    for (let col = 0; col < raster[0].length; col += 1) {
                        emptyrow.push(null);
                    }
                }
                //If we don't need to collapse, add a copy of our null filled
                //array to our matrix.
                if (collapse === "none") {
                    for (let row = 0; row < raster.length; row += 1) {
                        rval.push(emptyrow.slice());
                    }
                } else {
                    //If we do need to colapse, a single row is enough.
                    //collapse horizontally, we only need one row.
                    rval.push(emptyrow.slice());
                }
            } else {
                //Horizontal collapse, every row has only one cell.
                for (let row = 0; row < raster.length; row += 1) {
                    rval.push([null]);
                }
            }
            //Itterate over all cells in the original raster
            for (let row = 0; row < raster.length; row += 1) {
                for (let col = 0; col < raster[row].length; col += 1) {
                    //Look deeper into each raster cell. Itterate all elements in raster cell.
                    if (raster[row][col].length > 0) {
                        for (let ell = 0; ell < raster[row][col].length; ell += 1) {
                            //Only process text elements.
                            if (raster[row][col][ell].elt === "Texts") {
                                let tr = row;
                                let tc = col;
                                //Adjust column and row depending on collapse attribute.
                                if (collapse === "vertical") {
                                    tr = 0;
                                }
                                if (collapse === "horizontal") {
                                    tc = 0;
                                }
                                if (rval[tr][tc] === null) {
                                    //If nothing defined for this cell yet, process text element.
                                    rval[tr][tc] = {};
                                    const element = raster[row][col][ell];
                                    //Itterate all element keys.
                                    const keys = Object.keys(raster[row][col][ell]);
                                    for (let ki = 0; ki < keys.length; ki += 1) {
                                        const key = keys[ki];
                                        //Ignore x and y.
                                        if (key !== "x"  && key !== "y") {
                                            //Taverse into the R object.
                                            if (key === "R") {
                                                //Itterate all of R's keys
                                                const keys2 = Object.keys(element[key][0]);
                                                for (let ki2 = 0; ki2 < keys2.length; ki2 += 1) {
                                                    const key2 = keys2[ki2];
                                                    rval[tr][tc][key2] = element.R[0][key2];
                                                }
                                            } else {
                                                rval[tr][tc][key] = element[key];
                                            }
                                        }
                                    }
                                    //Add a META section to the cell involved. Default type is "skip"
                                    rval[tr][tc].META = {"matchtype": "skip"};
                                    //Add a set of methods to the text cells.
                                    //This method sets a cell as defining a variable.
                                    //A variable has a name and can have either "lexical" or "page" scoping.
                                    //Hoisting level will hoist a variable to a higher "lexical" scope.
                                    rval[tr][tc].designate_as = function (name,
                                        lexical_scoping = true,
                                        hoist_level = 0) {
                                        //Some assert stuff.
                                        if (!(name instanceof String) && (typeof name !== 'string')) {
                                            throw Error("name should be a string");
                                        }
                                        if (!(Number.isInteger(hoist_level)) || hoist_level < 0) {
                                            throw Error("page must be a non negative integer.");
                                        }
                                        if (typeof (lexical_scoping) !== typeof (true)) {
                                            throw Error("lexical_scoping must be a boolean");
                                        }
                                        //End of asserts
                                        //Update META
                                        rval[tr][tc].META = {"matchtype": "var"};
                                        rval[tr][tc].META.lexical_scoping = lexical_scoping;
                                        rval[tr][tc].META.hoist_level = hoist_level;
                                        rval[tr][tc].META.varname = name;
                                    };
                                    rval[tr][tc].skip = function () {
                                        rval[tr][tc].META = {"matchtype": "skip"};
                                    };
                                    rval[tr][tc].const = function () {
                                        rval[tr][tc].META = {"matchtype": "const"};
                                    };
                                } else {
                                    //If something is already in the cell, only look at appending text content.
                                    rval[tr][tc].T = rval[tr][tc].T + sep + raster[row][col][ell].R[0].T;
                                }
                            }
                        }
                    }
                }
            }
            return rval;
        }
    };
    //End of module level object literal returned by module main function.
};
