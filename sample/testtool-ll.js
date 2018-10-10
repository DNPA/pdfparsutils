#!/usr/bin/node
const fs = require('fs');
const pdfparsutils = require('pdfparsutils');

(function (fs, pdfparsutils, cons, json, process) {
    //Read the Regex config file
    fs.readFile("../etc/regex.json", function (error, regexConfBuffer) {
        if (!error) {
            const regexes = json.parse(regexConfBuffer);
            //Read the PDF into a buffer
            let pdffile = "";
            let pageno = -1;
            let expectedcount = -1;
            let firstrecstart = -1;
            let firstrecend = -1;
            let lastrecstart = -1;
            let lastrecend = -1;
            if (process.argv.length > 8) {
                pdffile = process.argv[2];
                pageno = parseInt(process.argv[3]);
                expectedcount = parseInt(process.argv[4]);
                firstrecstart = parseInt(process.argv[5]);
                firstrecend = parseInt(process.argv[6]);
                lastrecstart = parseInt(process.argv[7]);
                lastrecend = parseInt(process.argv[8]);
            } else {
				cons.log("To few arguments", process.argv.length,process.argv);
				cons.log("WARNING: DONT USE THIS SCRIPT DIRECTLY. USE testtool.py!");
                process.exit(1);
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
                        aggressive_regex: true,
                        strip_attributes_first: true,
                        drop_nonregex_text: true
                    };
                    const parser = pdfparsutils.get_parser();
                    parser.parse(pdfBuffer, function (errData) {
                        cons.log("Oops, file parse issue.");
                    }, function (pagecount, parseddocument) {
                        const ttp = pdfparsutils.get_treetemplate(corelib_settings);
                        const regexes = json.parse(regexConfBuffer);
                        const toolutil = pdfparsutils.get_toolutil(regexes);
                        const dtpair = toolutil.document_template_pair(parseddocument, ttp, pagecount);
                        dtpair.init(
                            {
                                min_x_diff: 1.0,
                                min_y_diff: 0.002
                            }
                        );
                        const page_set = dtpair.pageset_node([pageno], true);
                        const pageone = page_set.concrete_childnode(0);
                        const pagelength = pageone.get_raster().length;
                        const triplet = pageone.guestimate_header(guestimate_settings);
                        cons.log();
                        if (triplet.length > 0) {
                            pageone.define_as_horizontal_split_non_leafnode(triplet[0]);
                            pageone.concrete_childnode(0).set_as_empty_leafnode();
                            const headerlength = pageone.concrete_childnode(0).get_raster().length;
                            if (firstrecstart < headerlength) {
                                cons.log("MISMATCH 1: expected record 1 start mapped to header.");
                            }
                            if (firstrecend < headerlength) {
                                cons.log("MISMATCH 2: expected record 1 end mapped to header.");
                            }
                            if (lastrecstart < headerlength) {
                                cons.log("MISMATCH 3: expected last record start mapped to header.");
                            }
                            if (lastrecend < headerlength) {
                                cons.log("MISMATCH 4: expected last record end mapped to header.");
                            }
                            if (triplet.length > 1) {
                                const pageone_bodyfooter = pageone.concrete_childnode(1);
                                pageone_bodyfooter.define_as_horizontal_split_non_leafnode(triplet[1]);
                                const headerbodylength = pagelength - pageone_bodyfooter.concrete_childnode(1).get_raster().length;
                                if (firstrecstart > headerbodylength - 1) {
                                    cons.log("MISMATCH 5: expected record 1 start mapped to footer.");
                                }
                                if (firstrecend > headerbodylength - 1) {
                                    cons.log("MISMATCH 6: expected record 1 end mapped to footer.");
                                }
                                if (lastrecstart > headerbodylength - 1) {
                                    cons.log("MISMATCH 7: expected last record start mapped to footer.");
                                }
                                if (lastrecend > headerbodylength - 1) {
                                    cons.log("MISMATCH 8: expected last record end mapped to footer.");
                                }
                                pageone_bodyfooter.concrete_childnode(1).set_as_empty_leafnode();
                                if (triplet.length > 2) {
                                    const pageone_body = pageone_bodyfooter.concrete_childnode(0);
                                    pageone_body.define_as_horizontal_split_non_leafnode(triplet[2]);
                                    if (pageone_body.child_count() !== expectedcount) {
                                        cons.log("MISMATCH 9: WRONG RECORD COUNT,", pageone_body.child_count(), "INSTEAD OF", expectedcount);
                                    }
                                    const first_record_length = pageone_body.concrete_childnode(0).get_raster().length;
                                    const hb1rlen = headerlength + first_record_length;
                                    if (firstrecstart >= hb1rlen) {
                                        cons.log("MISMATCH 10: expected record 1 start mapped past record one.");
                                    }
                                    if (firstrecend >= hb1rlen) {
                                        cons.log("MISMATCH 11: expected record 1 end mapped past record one.");
                                    }
                                    if (lastrecstart < hb1rlen) {
                                        cons.log("MISMATCH 12: expected last record start mapped in or before first record.");
                                    }
                                    if (lastrecend < hb1rlen) {
                                        cons.log("MISMATCH 13: expected last record end mapped in or before first record.");
                                    }
                                    const lastrec_index = pageone_body.child_count() - 1;
                                    const lastrecord_length = pageone_body.concrete_childnode(lastrec_index).get_raster().length;
                                    const hbm1len = headerbodylength - lastrecord_length;
                                    if (firstrecstart > hbm1len - 1) {
                                        cons.log("MISMATCH 14: expected record 1 start mapped beyond last record start.");
                                    }
                                    if (firstrecend > hbm1len - 1) {
                                        cons.log("MISMATCH 15: expected record 1 end mapped beyond last record start.");
                                    }
                                    if (lastrecstart < hbm1len) {
                                        cons.log("MISMATCH 16: expected last record start mapped before last record.");
                                    }
                                    if (lastrecend < hbm1len) {
                                        cons.log("MISMATCH 17: expected last record end mapped before last record.");
                                    }
                                    pageone_body.concrete_childnode(0).set_as_empty_leafnode();
									cons.log("DONE");
                                } else {
                                    cons.log("PROBLEM WITH GUESTIMATE, NO RECORD SPLIT FOUND!");
                                    pageone_bodyfooter.concrete_childnode(0).set_as_empty_leafnode();
                                }
                            } else {
                                cons.log("PROBLEM WITH GUESTIMATE, NO BODY/FOOTER SPLIT FOUND!");
                                pageone.concrete_childnode(1).set_as_empty_leafnode();
                            }
                        } else {
                            cons.log("PROBLEM WITH GUESTIMATE, NO HEADER/BODY SPLIT FOUND!");
                        }
                        cons.log("+ Done");
                    }
                    );
                } else {
                    cons.log("Problem opening pdf file.");
                }
            });
        } else {
            cons.log("Unable to read regex.json");
		}
    });
}(fs,
    pdfparsutils(),
    console,
    JSON,
    process
));
