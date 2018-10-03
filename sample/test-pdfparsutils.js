#!/usr/bin/node
const fs = require('fs');
const utils = require('pdfparsutils');

(function (fs, utils, cons, json, process) {
    "use strict";
	fs.readFile("../etc/regex.json", function (error, regexConfBuffer) {
        if (!error) {
            const regexes = json.parse(regexConfBuffer);
            const re_len = regexes.length;
            //Read the PDF into a buffer
            const pdffile = process.argv[2];
            let pageno = 0;
            if (process.argv.length > 3) {
                pageno = parseInt(process.argv[3]);
            }
            fs.readFile(pdffile, function (err, pdfBuffer) {
				if (!err) {
                    const guestimate_settings = { 
                        lowlevel_recordcount_use: true,
                        lowlevel_recordcount_b_factor: 2.0,
                        lowlevel_recordcount_normalize: true,
                        //
                        lowlevel_recordsize_use: true,
                        lowlevel_recordsize_bfactor: 1.0,
                        //
                        lowlevel_homogenity_use: true,
                        lowlevel_homogenity_strategy_product: true,
                        lowlevel_homogenity_strategy_residual: false,
                        lowlevel_homogenity_strategy_maxerror: false,
                        //
                        lowlevel_textcolumn_use: false,
                        lowlevel_textcolumn_strategy_binary: false,
                        lowlevel_textcolumn_strategy_homogenity_residual: false,
                        lowlevel_textcolumn_strategy_homogenity_product: true,
                        lowlevel_textcolumn_strategy_homogenity_maxerror: false,
                        //
                        highlevel_confidence_use: true,
                        highlevel_confidence_base: 0.5, 
                        highlevel_confidence_exponent: 0.0,
                        //
                        highlevel_degradation_use: true,
                        highlevel_degradation_exponent: 2.0
                    };
                    const corelib_settings = {
                        aggressive_regex : true,
                        strip_attributes_first: true,
                        drop_nonregex_text: true
                    };
					const parser = utils.get_parser();
					parser.parse(pdfBuffer, function (errData) {
                        cons.log("Oops, file parse issue.");
                    }, function (pagecount, parseddocument) {
                        const ttp = utils.get_treetemplate(corelib_settings);
						const regexes = json.parse(regexConfBuffer);
						const toolutil = utils.get_toolutil(regexes);
						const dtpair = toolutil.document_template_pair(parseddocument, ttp, pagecount);
                        dtpair.init(
                            {
                                min_x_diff: 1.0,
                                min_y_diff: 0.002
                            }
                        );
                        const page_set = dtpair.pageset_node([pageno], true);
                        const pageone = page_set.concrete_childnode(0);
                        console.log("Looking for top level LS structure.")
                        const triplet = pageone.guestimate_header(guestimate_settings);
                        console.log();
                        if (triplet.length > 0) {
                            console.log("+ First split (H/B)", triplet[0]);
                            pageone.define_as_horizontal_split_non_leafnode(triplet[0]);
                            console.log("+ Discarding header");
                            pageone.concrete_childnode(0).set_as_empty_leafnode();
                            if (triplet.length > 1) {
                                console.log("+ Continue with body/footer");
                                const pageone_bodyfooter = pageone.concrete_childnode(1);
                                console.log("+ Second split (B/F)", triplet[1]);
                                pageone_bodyfooter.define_as_horizontal_split_non_leafnode(triplet[1]);
                                console.log(pageone_bodyfooter.child_count())
                                console.log("+ Discarding footer");
                                pageone_bodyfooter.concrete_childnode(1).set_as_empty_leafnode();
                                if (triplet.length > 2) {
                                    console.log("+ Continue with body");
                                    const pageone_body = pageone_bodyfooter.concrete_childnode(0);
                                    console.log("+ Third split (records)",triplet[2]);
                                    pageone_body.define_as_horizontal_split_non_leafnode(triplet[2]);
                                    console.log("Record count:",pageone_body.child_count());
                                    console.log("+ Discarding records");
                                    pageone_body.concrete_childnode(1).set_as_empty_leafnode();
                                } else {
                                    console.log("+ Discarding body");
                                    pageone_bodyfooter.concrete_childnode(0).set_as_empty_leafnode();
                                }
                            } else {
                                console.log("+ Discarding body-footer");
                                pageone.concrete_childnode(1).set_as_empty_leafnode();
                            }
                        }
                        else {
                            console.log("PROBLEM WITH GUESTIMATE");
                        }
						console.log("+ Done");
					});
				} else {
                    cons.log("Problem opening pdf file.");
				}
			})
		} else {
            cons.log("Problem reading regex json")
		}
	});
}(fs,
	utils(),
    console,
    JSON,
    process
));



