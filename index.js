//Convenience thingy for those who prefer to not inject all dependencies.
const xlsxpop = require('xlsx-populate');
const pdf2json = require("pdf2json");
const rasterize = require("./rasterize.js");
const xlsxutil = require("./xlsxutil.js");
const corelib = require("./treetemplate-corelib.js");
const treetemplate = require("./treetemplate.js");
const pdftoolutil = require("./pdftoolutil.js");

//Module level function takes only module dependencies
module.exports = function () {
    "use strict";
    //Return module level object.
    return {
		"get_parser": function() {
			return rasterize(pdf2json);
		},
		"get_treetemplate": function(corelibsettings={}) {
            const core = corelib(JSON,corelibsettings);
			return treetemplate(JSON,core);
		},
		"get_toolutil": function(regexes) {
            return pdftoolutil(JSON,regexes);
		},
		"get_xslxutil": function() {
            return xlsxutil(xlsxpop);
		}
	};
};
