//Module level function takes only module dependencies
module.exports = function (json, regexes) {
    "use strict";
    //Simple assert for regexes constructor argument.
    if (!(Array.isArray(regexes)) || regexes.length === 0) {
        throw Error("regexes should be a non empty array");
    }
    //Return module level object literal with only one method.
    return {
        //Construct a convenient wrapper for a document/template pair.
        "document_template_pair": function (parseddocument, ttp, pagecount) {
            //Check function arguments
            if (!(ttp.hasOwnProperty('as_text_raster')) || !(ttp.hasOwnProperty('propose_match'))) {
                throw Error("ttp misses a method.");
            }
            if (typeof ttp.as_text_raster !== 'function') {
                throw Error("as_text_raster is not a method");
            }
            //Private create_node function.
            //Note: return value is an important object litteral that "is" part
            // of the public API
            function create_node(parseddocument, args, template, page) {
                //Check function arguments
                if (!(Number.isInteger(page)) || page < 0) {
                    throw Error("page must be a non-empty array of non negative integers");
                }
                let raster = parseddocument(args);
                //Defaults
                let reversedirection = false;
                let repeat = "none";
                let include = "none";
                //FIXME: initialize above from template if possible!
                //
                //Return object literal for a single node of a sub page raster
                //and a sub template.
                return {
                    "define_as_horizontal_split_non_leafnode": function (
                        {
                            splitrows = [],
                            reverse_direction = false,
                            repeat_split = false,
                            include1 = false,
                            include2 = false
                        }
                    ) {
                        //Private low level function for making a horizontal split.
                        function ll_define_as_horizontal_split_non_leafnode(
                            {
                                splitrows = [],
                                reverse_direction = false,
                                repeat_split = false,
                                include1 = false,
                                include2 = false
                            }
                        ) {
                            //Check some function argument attributes.
                            if (!(Array.isArray(splitrows))) {
                                throw Error("splitrows must be an array");
                            }
                            for (let raster_index of splitrows) {
                                if (raster_index >= raster.length) {
                                    throw Error("Invalid index into raster found in splitrows!");
                                }
                            }
                            if (splitrows.length === 0) {
                                throw Error("splitrows must be a non-empty array");
                            }
                            for (let i = 0; i < splitrows.length; i += 1) {
                                if (!(Number.isInteger(splitrows[i])) || splitrows[i] < 0) {
                                    throw Error("splitrows must be a non-empty array of non negative integers");
                                }
                            }
                            if (typeof (reverse_direction) !== typeof (true)) {
                                throw Error("reverse_direction must be a boolean");
                            }
                            if (typeof (repeat_split) !== typeof (true)) {
                                throw Error("repeat_split must be a boolean");
                            }
                            if (typeof (include1) !== typeof (true)) {
                                throw Error("include1 must be a boolean");
                            }
                            if (typeof (include2) !== typeof (true)) {
                                throw Error("include2 must be a boolean");
                            }
                            //remember reversedirection at node level.
                            reversedirection = reverse_direction;
                            //Get a proposed match using the designated raster and rows.
                            const match = ttp.propose_match(
                                {
                                    rasterarray: [raster],
                                    rcindexarray: [splitrows],
                                    regexcandidates: regexes,
                                    reversedirection: reversedirection
                                }
                            );
                            //Return an empty array if there is no proposal.
                            if (match === null) {
                                return [];
                            }
                            if (match.length === 0) {
                                return [];
                            }
                            //Remember some more stuff at node level.
                            if (include2) {
                                include = "part2";
                            }
                            if (include1) {
                                include = "part1";
                            }
                            if (repeat_split) {
                                repeat = "record";
                            }
                            //Adjust our template
                            template.horizontal_split(
                                {
                                    repeat: repeat,
                                    include: include,
                                    match: match,
                                    reversed: reversedirection
                                }
                            );
                            //Find all possible matches from our proposal match rule.
                            const allmatches = ttp.find_matches({
                                rasterarray: [raster],
                                match: match,
                                repeat: (repeat !== "none"),
                                reversedirection: reversedirection
                            });
                            //An other assertion, just in case.
                            if (reversedirection === false && allmatches[0][0] !== splitrows[0]) {
                                //console.log(allmatches,splitrows);
                                throw Error("THIS SHOULD NOT HAPPEN: BIG BUG IN TREETEMPLATE LIB! (A)");
                            }
                            if (reversedirection === true  && allmatches[0][allmatches[0].length -1] !== splitrows[splitrows.length - 1]) {
                                throw Error("THIS SHOULD NOT HAPPEN: BIG BUG IN TREETEMPLATE LIB! (B)");
                            }
                            //Return all found matches to the higher level function.
                            return allmatches;
                        }
                        //End of low level provate function
                        //
                        //Some assertions about the method arguments.
                        if (!(Array.isArray(splitrows))) {
                            throw Error("splitrows must be an array");
                        }
                        if (splitrows.length === 0) {
                            throw Error("splitrows must be a non-empty array");
                        }
                        for (let i = 0; i < splitrows.length; i += 1) {
                            if (!(Number.isInteger(splitrows[i])) || i < 0) {
                                throw Error("splitrows must be a non-empty array of non negative integers");
                            }
                        }
                        if (typeof (reverse_direction) !== typeof (true)) {
                            throw Error("reverse_direction must be a boolean");
                        }
                        if (typeof (repeat_split) !== typeof (true)) {
                            throw Error("repeat_split must be a boolean");
                        }
                        if (typeof (include1) !== typeof (true)) {
                            throw Error("include1 must be a boolean");
                        }
                        if (typeof (include2) !== typeof (true)) {
                            throw Error("include2 must be a boolean");
                        }
                        //Have the above low level function find us our matches.
                        const allmatches = ll_define_as_horizontal_split_non_leafnode(
                            {
                                splitrows: splitrows,
                                reverse_direction: reverse_direction,
                                repeat_split: repeat_split,
                                include1: include1,
                                include2: include2
                            }
                        );
                        //No matches, no rasters.
                        if (allmatches.length === 0) {
                            return [];
                        }
                        const rval = [];
                        //If the first row isn't designated as a splitting row, process the first section of the split result.
                        if (splitrows[0] !== 0) {
                            const args = {
                                p: page,
                                minxdiff: template.meta().minxdiff,
                                minydiff: template.meta().minydiff
                            };
                            if (include1) {
                                //Header with included seperator row
                                args.rlessorequal = splitrows[0];
                            } else {
                                //Header without included seperator row
                                args.rlessthan = splitrows[0];
                            }
                            //Don't let the the selection go past end of parent
                            if ((typeof args.rlessorequal === "undefined") &&
                                (typeof args.rlessthan === "undefined")) {
                                args.rlessorequal = raster.length - 1;
                            }
                            //Don't let the selection start before start of parent.
                            if ((typeof args.rgreaterorequal === "undefined") &&
                                (typeof args.rgreaterthan === "undefined")) {
                                args.rgreaterorequal = 0;
                            }
                            args.parentraster = raster;
                            //Add resulting raster to the return value representing all child rasters
                            rval.push(parseddocument(args));
                            if (rval[rval.length - 1].length === 0) {
                                throw Error("OOPSIE, this should not happen!");
                            }
                        }
                        //Process all sections after the first splitting row.
                        for (let i = 0; i < splitrows.length; i += 1) {
                            //Our current splitting row number
                            const d1 = splitrows[i];
                            if (d1 + 1 !== raster.length || include2 === true) {
                                const args = {
                                    p: page,
                                    minxdiff: template.meta().minxdiff,
                                    minydiff: template.meta().minydiff
                                };
                                if (d1 !== raster.length - 1) {
                                    //If the splitting row is not the last row in the parent raster:
                                    if (i < splitrows.length - 1) {
                                        //If there are more splitting rows to process:
                                        //Include the next splitting row in the proper raster.
                                        const d2 = splitrows[i + 1];
                                        if (include1) {
                                            args.rlessorequal = d2;
                                        } else {
                                            args.rlessthan = d2;
                                        }
                                    }
                                }
                                //Add the current splitting line to the proper raster if needed.
                                if (include2) {
                                    args.rgreaterorequal = d1;
                                } else {
                                    args.rgreaterthan = d1;
                                }
                                //Don't let the the selection go past end of parent
                                if ((typeof args.rlessorequal === "undefined") &&
                                    (typeof args.rlessthan === "undefined")) {
                                    args.rlessorequal = raster.length - 1;
                                }
                                //Don't let the selection start before start of parent
                                if ((typeof args.rgreaterorequal === "undefined") &&
                                    (typeof args.rgreaterthan === "undefined")) {
                                    args.rgreaterorequal = 0;
                                }
                                args.parentraster = raster;
                                //Add resulting raster to the return value representing all child rasters
                                rval.push(parseddocument(args));
                                if (rval[rval.length - 1].length === 0) {
                                    throw Error("OOPSIE, this should not happen!");
                                }
                            }
                        }
                        //Return our array of rasters.
                        return rval;
                    },
                    //The total number of concrete children of the current node.
                    "child_count": function () {
                        if (template.meta().nodetype !== "nonleaf") {
                            return 0;
                        }
                        //Non repeating splits always have two children. There are both concrete
                        //instances as they are samples of different template matching instances.
                        if (template.meta().repeat === "none") {
                            return 2;
                        }
                        //For a repeating split we first find all matches.
                        const allmatches = ttp.find_matches({
                            rasterarray: [raster],
                            match: template.meta().match,
                            repeat: true,
                            reversedirection: template.meta().reversed
                        });
                        if (allmatches[0].length === 0) {
                            return 0;
                        }
                        //The maximum number of children id neither the first nor the last row
                        //of the parent raster is designated as splitting row.
                        let rval = allmatches[0].length + 1;
                        //If the first row is a aplitting row, then there is no 'before first' child.
                        if (allmatches[0][0] === 0) {
                            if (template.meta().include !== "part1") {
                                rval -= 1;
                            }
                        }
                        //If the last row is a splitting row, then there is no 'after last' child.
                        if (allmatches[0][allmatches[0].length - 1] === raster.length - 1) {
                            if (template.meta().include !== "part2") {
                                rval -= 1;
                            }
                        }
                        return rval;
                    },
                    //Get a specific defignated child node. Not just the raster but the template section
                    //child raster pair.
                    "concrete_childnode": function (rasterno) {
                        //Validate validity of rasterno argument.
                        if (!(Number.isInteger(rasterno)) || rasterno < 0) {
                            throw Error("rasterno must be a non negative integer.");
                        }
                        //Get split info from template.
                        const repeat_split = (template.meta().repeat !== "none");
                        const reversed = template.meta().reversed;
                        const include1 = (template.meta().include === "part1");
                        const include2 = (template.meta().include === "part2");
                        const match = template.meta().match;
                        //An other basic assert.
                        if (repeat_split === false && rasterno > 1) {
                            throw Error("Non-repeated split has exactly two children, not more.");
                        }
                        let child_template = null;
                        if (repeat_split === false && rasterno === 1) {
                            //Only non-repeated splits use a second template child.
                            child_template = template.second_child();
                        } else {
                            //All concrete children of a repeated split use thesame child template.
                            child_template = template.first_child();
                        }
                        //Find all appropriate matching rows.
                        const allmatches = ttp.find_matches({
                            rasterarray: [raster],
                            match: match,
                            repeat: repeat_split,
                            reversedirection: reversed
                        });
                        //Initialize basic args object for invoking rasterize lib later on.
                        const args = {
                            p: page,
                            //Get minxdiff/minydiff from themplate
                            minxdiff: template.meta().minxdiff,
                            minydiff: template.meta().minydiff
                        };
                        let xtra = 0;
                        //If the first line itself matches, we need to look one further from
                        //a splitting perspective.
                        if (allmatches[0][0] === 0) {
                            xtra = 1;
                        }
                        //Include the first splitting line if needed.
                        if (include2) {
                            args.rgreaterorequal = allmatches[0][rasterno - 1 + xtra];
                        } else {
                            args.rgreaterthan = allmatches[0][rasterno - 1 + xtra];
                        }
                        //If there is a next splitting line, include it if needed.
                        if (allmatches[0].length > rasterno + xtra) {
                            //Up untill the next match with or without the matching
                            //row included.
                            if (include1) {
                                args.rlessorequal = allmatches[0][rasterno + xtra];
                            } else {
                                args.rlessthan = allmatches[0][rasterno + xtra];
                            }
                        }
                        //Make sure we stay within the confines of the parent raster at least.
                        if ((typeof args.rlessorequal === "undefined") &&
                                (typeof args.rlessthan === "undefined")) {
                            args.rlessorequal = raster.length - 1;
                        }
                        if ((typeof args.rgreaterorequal === "undefined") &&
                                (typeof args.rgreaterthan === "undefined")) {
                            args.rgreaterorequal = 0;
                        }
                        args.parentraster = raster;
                        //Return the proper child node.
                        const rv = create_node(parseddocument, args, child_template, page);
                        return rv;
                    },
                    //Return the raster part of the current node as text raster for
                    //designation purposes.
                    "as_text_raster": function (collapse = "none") {
                        //Assert our argument is a string.
                        if (typeof collapse !== 'string' && !(collapse instanceof String)) {
                            throw Error("collapse should be a string");
                        }
                        return ttp.as_text_raster(
                            {
                                raster: raster,
                                collapse: collapse
                            }
                        );
                    },
                    //Call set_as_leaf on the template part of the node.
                    "set_as_leafnode": function (collapse = "none", designations = []) {
                        if (typeof collapse !== 'string' && !(collapse instanceof String)) {
                            throw Error("collapse should be a string");
                        }
                        return template.set_as_leaf({
                            collapse: collapse,
                            designations: designations
                        });
                    },
                    //Convenience function. Set the template part of the node as an 'empty' leaf node.
                    //This means zero data fields will get defined for the leaf node.
                    "set_as_empty_leafnode": function () {
                        const designations = ttp.as_text_raster(
                            {
                                raster: raster,
                                collapse: "none"
                            }
                        );
                        return template.set_as_leaf({
                            collapse: "none",
                            designations: designations
                        });
                    },
                    "set_restorepoint": function() {
                        ttp.set_restorepoint();
                        template.set_restorepoint();
                    },
                    "restore": function() {
                        ttp.restore();
                        template.restore();
                    },
                    //Extract the meta info from the template part of the node.
                    "meta": function () {
                        return template.meta();
                    },
                    //Get the raster part of the node.
                    "get_raster": function () {
                        return raster;
                    },
                    "update_raster_granularity": function ({
                        minxdiff = args.minxdiff,
                        minydiff = args.minydiff
                    }) {
                        args.minxdiff = minxdiff;
                        args.minydiff = minydiff;
                        raster = parseddocument(args);
                        template.update_raster_granularity({
                            minxdiff: minxdiff,
                            minydiff: minydiff
                        });
                    },
                    //Extract all the data structures from the node.
                    "get_data_structures": function (pgnum) {
                        const meta = this.meta();
                        const rval = {};
                        if (meta.nodetype === 'nonleaf') {
                            if (meta.repeat === 'none') {
                                //Node designates a split into two parts.
                                for (let index = 0; index < 2; index += 1) {
                                    //Get the data from one of the two child nodes.
                                    const childdata = this.concrete_childnode(index).get_data_structures(pgnum);
                                    //Copy any page scope content of the child to our own rval.
                                    if (childdata !== null) {
                                        if (childdata.hasOwnProperty("page_scope")) {
                                            if (!(rval.hasOwnProperty("page_scope"))) {
                                                rval.page_scope = {};
                                            }
                                            const keys = Object.keys(childdata.page_scope);
                                            for (let i = 0; i < keys.length; i += 1) {
                                                rval.page_scope[keys[i]] = childdata.page_scope[keys[i]];
                                            }
                                        }
                                        //A two way split does NOT nest the lexical scope for variables.
                                        if (childdata.hasOwnProperty("lexical_scope")) {
                                            if (!(rval.hasOwnProperty("lexical_scope"))) {
                                                rval.lexical_scope = {};
                                            }
                                            const keys = Object.keys(childdata.lexical_scope);
                                            for (let i = 0; i < keys.length; i += 1) {
                                                rval.lexical_scope[keys[i]] = childdata.lexical_scope[keys[i]];
                                            }
                                        }
                                        //Copy all children data from our direct child.
                                        if (childdata.hasOwnProperty("children")) {
                                            if (!(rval.hasOwnProperty("children"))) {
                                                rval.children = [];
                                            }
                                            for (let ci = 0; ci < childdata.children.length; ci += 1) {
                                                rval.children.push(childdata.children[ci]);
                                            }
                                        }
                                    }
                                }
                            } else {
                                //Split into records.
                                //Only copy children data from our direct children.
                                const childcount = this.child_count();
                                for (let ix = 0; ix < childcount; ix += 1) {
                                    if (!(rval.hasOwnProperty("children"))) {
                                        rval.children = [];
                                    }
                                    const c = this.concrete_childnode(ix).get_data_structures(pgnum);
                                    if (c !== null) {
                                        rval.children.push(this.concrete_childnode(ix).get_data_structures(pgnum));
                                    }
                                }
                            }
                        } else {
                            //We have a leaf node.
                            const meta = template.meta();
                            //Get the current node its raster as text raster.
                            const tr = this.as_text_raster(meta.collapse);
                            //Get the designations as defined in the template.
                            const designations = meta.designations;
                            //Itterate over all cells in the designations matrix.
                            let hasvar = false;
                            for (let row = 0; row < designations.length; row += 1) {
                                for (let col = 0; col < designations[row].length; col += 1) {
                                    const cel = designations[row][col];
                                    if (cel !== null && cel.matchtype === 'var') {
                                        hasvar = true;
                                        //We only care for variables.
                                        if (row < tr.length && col < tr[row].length) {
                                            //The dimensions of the text raster allow
                                            //this cell to exist.
                                            const tcel = tr[row][col];
                                            if (tcel !== null) {
                                                //Get the variable name from the template info
                                                const key = cel.varname;
                                                //Get the variable value from the raster info.
                                                const val = decodeURIComponent(tcel.T);
                                                //Add the variable to either the lexical or the page scope.
                                                if (cel.lexical_scoping) {
                                                    if (!(rval.hasOwnProperty("lexical_scope"))) {
                                                        rval.lexical_scope = {};
                                                    }
                                                    rval.lexical_scope[key] = val;
                                                } else {
                                                    if (!(rval.hasOwnProperty("page_scope"))) {
                                                        rval.page_scope = {};
                                                    }
                                                    rval.page_scope[key] = val;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            //Link the return value to the proper page scope.
                            rval.page_ref = pgnum;
                        }
                        if (Object.keys(rval).length === 0) {
                            return null;
                        }
                        return rval;
                    },
                    "trimmed_child_count": function() {
                        let column_counts = [];
                        let lastcolcount = -1;
                        let still_looking = true;
                        const count=this.child_count();
                        for (let i=0; i<count && still_looking; i+=1) {
                            const child_raster = this.concrete_childnode(i).get_raster();
                            let rowcount = child_raster.length;
                            if (rowcount === 0) {
                                still_looking = false;
                            } else {
                                let colcount = child_raster[0].length;
                                if (lastcolcount === -1 || lastcolcount === colcount) {
                                    column_counts.push(colcount);
                                    lastcolcount = colcount;
                                } else {
                                    still_looking = false;
                                }
                            }
                        }
                        return column_counts.length;
                    },
                    "weight": function (assume_footer,
                        lowlevel_recordcount_use,
                        lowlevel_recordcount_b_factor,
                        lowlevel_recordcount_normalize,
                        lowlevel_recordsize_use,
                        lowlevel_recordsize_b_factor,
                        lowlevel_homogenity_use,
                        lowlevel_homogenity_strategy_residual,
                        lowlevel_homogenity_strategy_product,
                        lowlevel_homogenity_strategy_maxerror,
                        rlen,
                        index,
                        index2
                    ) {
                        const experimental_text_feature = true;
                        const experimental_column_feature = true;
                        let count = this.child_count();
                        let af_corrector = 1.0;
                        if (assume_footer) {
                            if (experimental_text_feature || experimental_column_feature){
                                count = this.trimmed_child_count();
                            } else {
                                count -= 1;
                            }
                            af_corrector = count/(count +1);
                        }
                        //Weighing factor one gives us better
                        //matches for smaller numbers of records.
                        let wf1 = 1.0;
                        let wf2 = 1.0;
                        let wf3 = 1.0;
                        let wf4 = 1.0;
                        let ncount = count;
                        if (lowlevel_recordcount_use) {
                            if (lowlevel_recordcount_normalize) {
                                ncount = count * 100 / rlen;
                            }
                            //wf1 = 30000.0/(lowlevel_recordcount_b_factor + count);
                            wf1 =(lowlevel_recordcount_b_factor + 1) / (lowlevel_recordcount_b_factor + ncount);
                        }
                        if (lowlevel_homogenity_use || lowlevel_recordsize_use) {
                            //Weighing factor two gives us better matching
                            //for more equally sized records.
                            let prod2 = 1.0;
                            let sum2 = 0.0;
                            for (let i=0; i<count; i+=1) {
                                const ln = this.concrete_childnode(i).get_raster().length;
                                prod2 *= ln;
                                sum2 += ln;
                            }
                            let haswf3 = false;
                            if (lowlevel_homogenity_strategy_product) {
                                wf3 *= prod2 / Math.pow(sum2/count,count);
                                haswf3 = true;
                            }
                            if (lowlevel_homogenity_strategy_residual) {
                                let total_residual = 0.0
                                for (let i=0; i<count; i+=1) {
                                    const res = Math.abs(avg - this.concrete_childnode(i).get_raster().length);
                                    total_residual += res;
                                }
                                const avg_residual = total_residual / ncount;
                                const relative_residual = avg_residual / avg;
                                if (relative_residual > 1.9) {
                                    relative_residual = 1.9;
                                }
                                wf3 *= 1.0 - relative_residual/2;
                                haswf3 = true;
                            }
                            if (lowlevel_homogenity_strategy_maxerror) {
                                let max_residual = 0.0
                                for (let i=0; i<count; i+=1) {
                                    const res = Math.abs(avg - this.concrete_childnode(i).get_raster().length);
                                    if (res > max_residual){
                                        max_residual = res;
                                    }
                                }
                                let relative_residual = max_residual / avg;
                                if (relative_residual > 1.9) {
                                    relative_residual = 1.9;
                                }
                                wf3 *= 1.0 - relative_residual/2;
                                haswf3 = true;
                            }
                            const avg = sum2 / ncount;
                            if (lowlevel_recordsize_use) {
                                wf2 = (1 + lowlevel_recordsize_b_factor) / (avg + lowlevel_recordsize_b_factor)
                            }
                            

                        }
                        let column_counts = [];
                        let text_column_counts = [];
                        if (experimental_text_feature || experimental_column_feature){
                            for (let i=0; i<count; i+=1) {
                                const child_raster = this.concrete_childnode(i).get_raster();
                                let rowcount = child_raster.length;
                                if (rowcount === 0) {
                                    column_counts.push(0);
                                    if (experimental_text_feature) {
                                        text_column_counts.push(0); 
                                    }
                                } else {
                                    let colcount = child_raster[0].length;
                                    column_counts.push(colcount);
                                    if (experimental_text_feature) {
                                        let txtcolcount = 0;
                                        for (let col = 0; col < colcount; col += 1) {
                                            let col_has_text = false;
                                            for (let row = 0; row < rowcount && col_has_text === false; row += 1) {
                                                const cel = child_raster[row][col];
                                                for (let element of cel) {
                                                    if (element.hasOwnProperty("elt") && element.elt === "Texts") {
                                                        col_has_text = true; 
                                                    } 
                                                }
                                            }
                                            if (col_has_text) {
                                                txtcolcount += 1;
                                            }
                                        }
                                        text_column_counts.push(txtcolcount);
                                    }

                                }
                            }

                            if (text_column_counts.length > 1) {
                                let t0c = text_column_counts[0];
                                for (let cnt of text_column_counts) {
                                    if (cnt !== t0c) {
                                        wf4 *= 0.5;
                                    }
                                }
                            }
                        }
                        const rval = Math.floor(wf1 * wf2 * wf3 * wf4 * af_corrector*1000000)/10000;
                        return rval;
                    },
                    "guestimate_records": function(
                        lowlevel_recordcount_use,
                        lowlevel_recordcount_b_factor, 
                        lowlevel_recordcount_normalize,
                        lowlevel_recordsize_use,
                        lowlevel_recordsize_b_factor,
                        lowlevel_homogenity_use,
                        lowlevel_homogenity_strategy_residual,
                        lowlevel_homogenity_strategy_product,
                        lowlevel_homogenity_strategy_maxerror,
                        assume_footer=false, 
                        unidirectional=false, 
                        backward=false,
                        expected_count=-1,
                    ) {
                        const rlen = raster.length;
                        let bestline = [-1,{},[],0];
                        let bestm = 0.0;
                        let best = null;
                        for (let index=1; index < rlen; index +=1) {
                            this.set_restorepoint();
                            if (unidirectional === false || backward === false) {
                                this.define_as_horizontal_split_non_leafnode({
                                    splitrows: [0, index],
                                    include2: true,
                                    repeat_split: true
                                });
                                let count = this.child_count();
                                if (assume_footer) {
                                    count = this.trimmed_child_count();
                                }
                                if (count > 1) {
                                    const m = this.weight(assume_footer,
                                        lowlevel_recordcount_use,
                                        lowlevel_recordcount_b_factor,
                                        lowlevel_recordcount_normalize,
                                        lowlevel_recordsize_use,
                                        lowlevel_recordsize_b_factor,
                                        lowlevel_homogenity_use,
                                        lowlevel_homogenity_strategy_residual,
                                        lowlevel_homogenity_strategy_product,
                                        lowlevel_homogenity_strategy_maxerror,
                                        rlen,
                                        0,
                                        index
                                    );
                                    if (m > bestm) {
                                        best = {
                                            splitrows: [0, index],
                                            include2: true,
                                            repeat_split: true
                                        };
                                        bestm = m;
                                        bestline = [m,best,this.meta().match,count];
                                    }
                                }
                            }
                            if (unidirectional === false || backward === true) {
                                this.define_as_horizontal_split_non_leafnode({
                                    splitrows: [index,rlen-1],
                                    include1: true,
                                    repeat_split: true,
                                    reverse_direction: true,
                                });
                                let count = this.child_count();
                                if (assume_footer) {
                                    count = this.trimmed_child_count();
                                }
                                if (count > 1 && (expected_count === -1 || count === expected_count)) {
                                    const m = this.weight(
                                        assume_footer,
                                        lowlevel_recordcount_use,
                                        lowlevel_recordcount_b_factor,
                                        lowlevel_recordcount_normalize,
                                        lowlevel_recordsize_use,
                                        lowlevel_recordsize_b_factor,
                                        lowlevel_homogenity_use,
                                        lowlevel_homogenity_strategy_residual,
                                        lowlevel_homogenity_strategy_product,
                                        lowlevel_homogenity_strategy_maxerror,
                                        rlen,
                                        index,
                                        rlen-1
                                    );
                                    if (m > bestm) {
                                        best = {
                                            splitrows: [index,rlen-1],
                                            include1: true,
                                            repeat_split: true,
                                            reverse_direction: true
                                        };
                                        bestm = m;
                                        bestline = [m,best,this.meta().match,count];
                                    }
                                }
                            }
                            this.restore();
                        }
                        return bestline;
                    },
                    "guestimate_header": function({
                        //Use record count as a low level weighing factor.
                        //Lower counts should yield a higher match number.
                        //The b factor is used as follows:
                        //  (lowlevel_recordcount_b_factor + 1) / (lowlevel_recordcount_b_factor + count)
                        //Optionally the record cound can be normalized to a fictional 100 line raster as follows:
                        //  count * 100 / rlen
                        lowlevel_recordcount_use = true,
                        lowlevel_recordcount_b_factor = 2.0, //Weight factor count offset:  C/(childcount + lowlevel_recordcount_b_factor)
                        lowlevel_recordcount_normalize = false, //Normalize to raster size:  count x 1000 / rasterlength
                        //Use the average record size as weighing factor.
                        //The b factor is used as follows:
                        // (1 + lowlevel_recordsize_b_factor) / (avg + lowlevel_recordsize_b_factor)
                        lowlevel_recordsize_use = false,
                        lowlevel_recordsize_b_factor = 1.0,
                        //Use the homogenity of the record length as weighing factor according to one of three strategies:
                        // * product: Product of all record lengths divided through the average record length to the power
                        //        of the number of records.
                        // * residual: Use the average residual with respect to the average record length.
                        // * maxerror: Use the worst fit record size as measure.
                        lowlevel_homogenity_use = true,
                        lowlevel_homogenity_strategy_residual = false,
                        lowlevel_homogenity_strategy_product = true,
                        lowlevel_homogenity_strategy_maxerror = true,
                        //Use the existance and/or count of text columns as weighing factor according to one of four strategies
                        // * Binary: If there are text columns in each record found: 1.0, if at least one record has 
                        //   no text column: 0.0
                        // * homogenity_* : As for record size (see above)
                        lowlevel_textcolumn_use = false,
                        lowlevel_textcolumn_strategy_binary = false,
                        lowlevel_textcolumn_strategy_homogenity_residual = false,
                        lowlevel_textcolumn_strategy_homogenity_product = false,
                        lowlevel_textcolumn_strategy_homogenity_maxerror = false,
                        //Use a confidence metric for header/body and footer/body match weight, less lines means 
                        //less confidence in the result. The confidence metric is calculated as follows:
                        //    1 - highlevel_confidence_base^(highlevel_confidence_exponent+bodystart)
                        highlevel_confidence_use = true,
                        highlevel_confidence_base=0.5, 
                        highlevel_confidence_exponent=1,
                        //Use degredation metric for keeping size of header and footer in check. Longer headers are less likely.
                        //This is done as follows:
                        //    (bodyfooterlen/parentlength)^highlevel_degradation_exponent
                        //    bodylen/bodyfooterlength^highlevel_degradation_exponent
                        highlevel_degradation_use = true,
                        highlevel_degradation_exponent= 2.0, // Degrade match with h/b split line number
                        //
                        //
                        highlevel_header_guidance_use = false,
                        highlevel_header_guidance_first_body_row = -1,
                        highlevel_footer_guidance_use = false,
                        highlevel_footer_guidance_first_body_row = -1,
                    }) {
                        this.set_restorepoint();
                        let best = null;
                        let bestline2 = -1;
                        let expected_count2 = -1;
                        let bestweight = -1;
                        let bestmatch = "{}";
                        if (highlevel_header_guidance_use == true &&
                            highlevel_header_guidance_first_body_row !== -1) {
                            this.define_as_horizontal_split_non_leafnode({
                                splitrows: [highlevel_header_guidance_first_body_row],
                                include2: true,
                                repeat_split: false
                            });
                            if (this.child_count() > 1) {
                                best = {
                                    splitrows: [highlevel_header_guidance_first_body_row],
                                    include2: true,
                                    repeat_split: false
                                }
                                bestline2 = highlevel_header_guidance_first_body_row;
                                bestweight = 100.0;
                            }
                        } else {
                            const maxheader = Math.floor((raster.length*3)/5);
                            for (let bodystart =1; bodystart <= maxheader; bodystart += 1 ) {
                                //We have less confidence in smaller sets of non-matching lines.
                                let confidence = 1.0
                                if (highlevel_confidence_use) {
                                    confidence = 1 - Math.pow(highlevel_confidence_base,highlevel_confidence_exponent+bodystart);
                                }
                                this.restore();
                                this.define_as_horizontal_split_non_leafnode({
                                    splitrows: [bodystart],
                                    include2: true,
                                    repeat_split: false
                                });
                                const match = JSON.stringify(this.meta().match);
                                //const candidate_meta = this.meta().match;
                                if (this.child_count() > 1) {
                                    const body = this.concrete_childnode(1);
                                    body.set_restorepoint();
                                    for (let assume_footer of [false,true]) {
                                        const bestline = body.guestimate_records(
                                            lowlevel_recordcount_use,
                                            lowlevel_recordcount_b_factor,
                                            lowlevel_recordcount_normalize,
                                            lowlevel_recordsize_use,
                                            lowlevel_recordsize_b_factor,
                                            lowlevel_homogenity_use,
                                            lowlevel_homogenity_strategy_residual,
                                            lowlevel_homogenity_strategy_product,
                                            lowlevel_homogenity_strategy_maxerror,
                                            assume_footer);
                                        if (bestline[0] !== -1) {
                                            console.log(bodystart,"FD CANDIDATE",JSON.stringify(bestline));
                                            const weight1 = bestline[0];
                                            const expected_count = bestline[3];
                                            //Shorter headers have a better match.
                                            let degradation = 1.0;
                                            if (highlevel_degradation_use) {
                                                degradation = Math.pow((raster.length - bodystart)/raster.length, highlevel_degradation_exponent);
                                            }
                                            const weight = weight1 * degradation * confidence;
                                            if (bestweight < weight) {
                                                bestweight = weight;
                                                bestline2 = bestline;
                                                expected_count2 = expected_count;
                                                best = {
                                                    splitrows: [bodystart],
                                                    include2: true,
                                                    repeat_split: false
                                                }
                                                bestmatch = match;
                                            } 
                                        } else {
                                            console.log(bodystart,"NO record result after reverse_direction SPLIT for assume_footer =", assume_footer);
                                        }
                                    }
                                } else {
                                    console.log(bodystart,"NO SPLIT POSSIBLE",JSON.stringify(this.meta()));
                                }
                                
                            }
                        }
                        if (best === null) {
                            console.log("NO BODY START COULD BE GUESTIMATED!");
                            return [];
                        }
                        console.log("GUESTIMATED BODY START:",JSON.stringify(best),bestmatch);
                        bestmatch = "";
                        let in_body_footer_highlevel_footer_guidance_first_body_row = highlevel_footer_guidance_first_body_row;
                        let bodyfooter = this;
                        this.restore();
                        if (bestline2 !== -1) {
                            this.restore();
                            this.define_as_horizontal_split_non_leafnode(best);
                            bodyfooter = this.concrete_childnode(1);
                            if (highlevel_footer_guidance_first_body_row !== -1) {
                                in_body_footer_highlevel_footer_guidance_first_body_row = highlevel_footer_guidance_first_body_row - bestline2;
                            }
                            bodyfooter.set_restorepoint();
                        }
                        const rlen = bodyfooter.get_raster().length;
                        const minfooter = Math.floor((rlen*2)/5);
                        bestline2 = -1;
                        bestweight = -1;
                        let best2 = null;
                        if (minfooter > 0) {
                            if (highlevel_footer_guidance_use === true &&
                                in_body_footer_highlevel_footer_guidance_first_body_row !== -1) {
                                    bodyfooter.restore();
                                    bodyfooter.define_as_horizontal_split_non_leafnode({
                                        splitrows: [in_body_footer_highlevel_footer_guidance_first_body_row],
                                        include1: true,
                                        repeat_split: false,
                                        reverse_direction: true
                                    });
                                    const match = JSON.stringify(this.meta().match);
                                    if (bodyfooter.child_count() > 1) {
                                        best2 = {
                                            splitrows: [in_body_footer_highlevel_footer_guidance_first_body_row],
                                            include1: true,
                                            repeat_split: false,
                                            reverse_direction: true
                                        }
                                        bestline2 = highlevel_header_guidance_first_body_row;
                                        bestweight = 100.0;
                                        bestmatch = match;
                                    }
                            } else {
                                for (let bodyend=minfooter-1; bodyend < rlen-1; bodyend += 1) {
                                    //We have less confidence in smaller sets of non-matching lines.
                                    let confidence = 1.0
                                    if (highlevel_confidence_use) {
                                        confidence = 1 - Math.pow(highlevel_confidence_base,rlen - bodyend -highlevel_confidence_exponent);
                                    }
                                    const args = {
                                        splitrows: [bodyend],
                                        include1: true,
                                        repeat_split: false,
                                        reverse_direction: true
                                    };
                                    bodyfooter.restore();
                                    bodyfooter.define_as_horizontal_split_non_leafnode(args);
                                    const match = JSON.stringify(bodyfooter.meta().match);
                                    if (bodyfooter.child_count() > 1) {
                                        const body = bodyfooter.concrete_childnode(0);
                                        body.set_restorepoint();
                                        const bestline = body.guestimate_records(
                                            lowlevel_recordcount_use,
                                            lowlevel_recordcount_b_factor,
                                            lowlevel_recordcount_normalize,
                                            lowlevel_recordsize_use,
                                            lowlevel_recordsize_b_factor,
                                            lowlevel_homogenity_use,
                                            lowlevel_homogenity_strategy_residual,
                                            lowlevel_homogenity_strategy_product,
                                            lowlevel_homogenity_strategy_maxerror,
                                            false,
                                            true,
                                            true,
                                            expected_count2
                                        );
                                        if (bestline[0] !== -1) {
                                            console.log(bodyend,"RD CANDIDATE",JSON.stringify(bestline));
                                            const weight1 = bestline[0];
                                            //Shorter headers have a better match.
                                            let degradation = 1.0
                                            if (highlevel_degradation_use) {
                                                degradation = Math.pow(bodyend/rlen, highlevel_degradation_exponent);
                                            }
                                            const weight = weight1 * degradation * confidence;
                                            if (bestweight < weight) {
                                                bestweight = weight;
                                                bestline2 = bestline;
                                                best2 = {
                                                    splitrows: [bodyend],
                                                    include1: true,
                                                    repeat_split: false,
                                                    reverse_direction: true
                                                }
                                                bestmatch = match;
                                            }
                                        } else {
                                            console.log(bodyend,"NO record result after reverse_direction SPLIT");
                                        }
                                    } else {
                                        console.log(bodyend,"NO reverse_direction SPLIT POSSIBLE");
                                    }
                                    bodyfooter.restore();
                                }
                            }
                            if (best2 === null) {
                                console.log("NO BODY END COULD BE GUESTIMATED!");
                                return [best];
                            }
                            console.log("GUESTIMATED BODY END:",JSON.stringify(best2),bestmatch);
                            let body = bodyfooter;
                            if (bestline2 !== -1) {;
                                body.restore();
                                body.define_as_horizontal_split_non_leafnode(best2);
                                body = bodyfooter.concrete_childnode(0)
                                body.set_restorepoint();
                            }
                            const bestline = body.guestimate_records(
                                lowlevel_recordcount_use,
                                lowlevel_recordcount_b_factor,
                                lowlevel_recordcount_normalize,
                                lowlevel_recordsize_use,
                                lowlevel_recordsize_b_factor,
                                lowlevel_homogenity_use,
                                lowlevel_homogenity_strategy_residual,
                                lowlevel_homogenity_strategy_product,
                                lowlevel_homogenity_strategy_maxerror,
                                false,
                                false,
                                false,
                                expected_count2
                            );
                            if (bestline[0] !== -1 && bestline[1] !== null) {
                                body.restore();
                                const bodylen = body.get_raster().length;
                                bodyfooter.restore();
                                this.restore();
                                console.log(best,best2,bestline[1]);
                                return [best,best2,bestline[1]];
                            } else {
                                return [best,best2];
                            }
                        }
                        else {
                            return [best];
                        }
                    }
                };
            }
            //End of closure-private create_node function.
            //A few assert like function argument validations
            if (!(Number.isInteger(pagecount)) || pagecount < 0) {
                throw Error("pagecounr must be a non negative integers");
            }
            if (!(ttp.hasOwnProperty('as_text_raster')) || !(ttp.hasOwnProperty('propose_match'))) {
                throw Error("ttp misses a method.");
            }
            if (typeof ttp.as_text_raster !== 'function') {
                throw Error("as_text_raster is not a method");
            }
            if (typeof parseddocument !== 'function') {
                throw Error("parseddocument should be a function.");
            }
            let templatecollection = null;
            let minxdiff = 0.0;
            let minydiff = 0.0;
            //Return object literal for the actual document/template pair.
            return {
                //Currently the document/template pair has a seperate init method.
                //FIXME: look at incorporating this init into the main construction method.
                "init": function (
                    {
                        template_json = null,
                        min_y_diff = null,
                        min_x_diff = null
                    }
                ) {
                    //Some assert like function argument validations.
                    if (min_y_diff === null || min_x_diff === null) {
                        throw Error("min_y_diff and min_x_diff should both be specified!");
                    }
                    if (isNaN(min_y_diff) || isNaN(min_x_diff)) {
                        throw Error("min_y_diff and min_x_diff must be numbers");
                    }
                    //Initialize the template collection.
                    if (template_json !== null) {
                        const template_object = json.parse(template_json);
                        templatecollection = ttp.collection(template_object);
                    } else {
                        templatecollection = ttp.collection({});
                    }
                    //Store minimum x/y dif values.
                    minxdiff = min_x_diff;
                    minydiff = min_y_diff;
                },
                //Request a page node from the document/template pair
                // for a specific page number. If mutable is set to false
                // the user promises not to change the node while working
                // with it.
                "page_node": function (pageno, mutable) {
                    //Some checks for function arguments.
                    if (!(Number.isInteger(pageno)) || pageno < 0) {
                        throw Error("page must be a non negative integer.");
                    }
                    if (typeof (mutable) !== typeof (true)) {
                        throw Error("mutable must be a boolean");
                    }
                    if (pageno >= pagecount) {
                        throw Error("Page number out of range");
                    }
                    //Get the raster for the page as a whole.
                    const args = {
                        p: pageno,
                        minxdiff: minxdiff,
                        minydiff: minydiff
                    };
                    //Get template page scope for this particular page.
                    const scope = templatecollection.get_template_page_scope();
                    let rootnode = null;
                    //If the collection is empty, we must create a new templete.
                    if (templatecollection.size() === 0) {
                        //We can't create a new template if we aren't suposed to mute (define) it.
                        if (mutable === false) {
                            throw Error("Can't ask an immutable page node on an empty collection");
                        }
                        //The root node is a newly added template
                        rootnode = scope.add_template(
                            {
                                minxdiff: minxdiff,
                                minydiff: minydiff
                            }
                        );
                    } else {
                        //Find the existing template that has the best match.
                        const bestmatch = templatecollection.best_match(parseddocument, pageno, ttp);
                        if (bestmatch.fullmatch === true || mutable === false) {
                            //If we have a full match OR the user requests
                            //a non mutable template, return the existing template.
                            rootnode = scope.get_template(bestmatch.index);
                            bestmatch.mutable = false;
                        } else {
                            //If the match isn't full AND the user requests an
                            //mutable template, create a copy and return a reference
                            //to that new copy.
                            rootnode = scope.copy_template(bestmatch.index);
                            bestmatch.mutable = true;
                        }
                    }
                    //Return the top level page/template pair node for the given page.
                    return create_node(parseddocument, args, rootnode, pageno);
                },
                //Get the top level raster for a page as a whole.
                "raster": function (page) {
                    //Assert that the page is a valid page number.
                    if (!(Number.isInteger(page)) || page < 0) {
                        throw Error("page must be a non negative integer.");
                    }
                    if (page >= pagecount) {
                        throw Error("Page number out of range");
                    }
                    //Return top level raster for page.
                    return parseddocument(
                        {
                            p: page,
                            minxdiff: minxdiff,
                            minydiff: minydiff
                        }
                    );
                },
                //Get a node that implements a node abstraction for a set of pages.
                "pageset_node": function (pageset, mutable) {
                    if (!(Array.isArray(pageset))) {
                        throw Error("pageset must be an array");
                    }
                    if (pageset.length === 0) {
                        throw Error("pageset must be a non-empty array");
                    }
                    for (let i = 0; i < pageset.length; i += 1) {
                        if (!(Number.isInteger(pageset[i])) || pageset[i] < 0) {
                            throw Error("pageset must be a non-empty array of non negative integers");
                        }
                    }
                    if (typeof (mutable) !== typeof (true)) {
                        throw Error("mutable must be a boolean");
                    }
                    const pgset = [];
                    for (let i = 0; i < pageset.length; i += 1) {
                        pgset.push(this.page_node(pageset[i], mutable));
                    }
                    //Return object litteral.
                    return {
                        "concrete_childnode": function (i) {
                            return pgset[i];
                        },
                        "child_count": function () {
                            return pgset.length;
                        }
                    };
                },
                //Apply the template to the document and return an intermidiate
                //data structure of extracted data.
                "apply": function () {
                    //Initialize empty return value object.
                    const rval = {};
                    rval.page_scope = [];
                    //Itterate over all the pages.
                    for (let page = 0; page < pagecount; page += 1) {
                        //Find the template that best matches this page.
                        const matching_template_info = templatecollection.best_match(parseddocument, page, ttp);
                        //Process page if a matching template has been found.
                        if (matching_template_info.found) {
                            //Fetch teh root raster for this page.
                            const args = {
                                p: page,
                                minxdiff: matching_template_info.minxdiff,
                                minydiff: matching_template_info.minydiff
                            };
                            //Get a template fetching scope for this page.
                            const scope = templatecollection.get_template_page_scope();
                            //Fetch our root node template.
                            const rootnode = scope.get_template(matching_template_info.index);
                            //Create a page/template pair node for us to start off with.
                            const page_level_node = create_node(parseddocument, args, rootnode, page);
                            //Request the complete data structure from our page level root node.
                            const datastruct = page_level_node.get_data_structures(page);
                            //Copy page scope to rval OR add empty object for page scope.
                            if (datastruct.hasOwnProperty("page_scope")) {
                                rval.page_scope.push(datastruct.page_scope);
                            } else {
                                rval.page_scope.push({});
                            }
                            //Copy each of the children to the rval, or just an empty array.
                            if (datastruct.hasOwnProperty("children")) {
                                if (!(rval.hasOwnProperty("children"))) {
                                    rval.children = [];
                                }
                                for (let cindex = 0; cindex < datastruct.children.length; cindex += 1) {
                                    rval.children.push(datastruct.children[cindex]);
                                }
                            }
                            //Copy all of the lexical scope to the rval, or an empty object.
                            if (datastruct.hasOwnProperty("lexical_scope")) {
                                if (!(rval.hasOwnProperty("lexical_scope"))) {
                                    rval.lexical_scope = {};
                                }
                                const keys = Object.keys(datastruct.lexical_scope);
                                for (let index = 0; index < keys.length; index += 1) {
                                    const key = keys[index];
                                    rval.lexical_scope[key] = datastruct.lexical_scope[key];
                                }
                            }
                        }
                    }
                    return rval;
                },
                //Get a JSON representation of the entire template collection.
                "as_json": function () {
                    return templatecollection.as_json();
                }
            };
        }
    };
};

