#!/usr/bin/node
const fs = require('fs');
const pdfparsutils = require('pdfparsutils');

(function (fs, pdfparsutils, cons, json) {
    "use strict";
    //Read the Regex config file
    fs.readFile("../etc/regex.json", function (error, regexConfBuffer) {
        if (!error) {
            const regexes = json.parse(regexConfBuffer);
            //Read the PDF into a buffer
            fs.readFile("nested.pdf", function (err, pdfBuffer) {
                if (!err) {
                    const parser = pdfparsutils.get_parser();
                    parser.parse(pdfBuffer, function (errData) {
                        cons.log("Oops, file parse issue.");
                    }, function (pagecount, parseddocument) {
                        const corelib_settings = {
                            aggressive_regex : true,
                            strip_attributes_first: true,
                            drop_nonregex_text: true
                        };
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
                        const page_set = dtpair.pageset_node([0], true);
                        const pageone = page_set.concrete_childnode(0);
                        //Split on first higher level record header line, include in #2
                        //This is the Pietje->Jantje Text line.
                        const l0_rasters = pageone.define_as_horizontal_split_non_leafnode({
                            splitrows: [8],
                            include2: true
                        });
                        const pageone_header = pageone.concrete_childnode(0);
                        const  headertxtraster = pageone_header.as_text_raster("none");
                        headertxtraster[2][1].designate_as("hdr_line", false);
                        pageone_header.set_as_leafnode("none", headertxtraster);
                        const pageone_bodyfooter = pageone.concrete_childnode(1);
                        //Split on bottom intermediate level record footer, look bottum up
                        //This is the final "Totaal" Text line.
                        const pageone_body_footer_raster = pageone_bodyfooter.define_as_horizontal_split_non_leafnode({
                            splitrows: [48],
                            include1: true,
                            reverse_direction: true
                        });
                        pageone_bodyfooter.concrete_childnode(1).set_as_empty_leafnode();
                        //The body runs from the Pietje->Jantje till the last "Totaal", inclusive.
                        const pageone_body = pageone_bodyfooter.concrete_childnode(0);
                        //Again split on higher level record header line
                        //These are the Pietje->Jantje and the Jantje->Klaasje lines
                        const high_level_records = pageone_body.define_as_horizontal_split_non_leafnode({
                            splitrows: [0, 18],
                            include2: true,
                            repeat_split: true
                        });
                        //The second_high_level_record starts at Jantje->Klaasje and ends at
                        // the final "Totaal"
                        const second_high_level_record = pageone_body.concrete_childnode(1);
                        //Split on the first line of the first sub record.
                        //This is the "vrachtwgn" line
                        second_high_level_record.define_as_horizontal_split_non_leafnode({
                            splitrows: [3],
                            include2: true
                        });
                        const high_level_header = second_high_level_record.concrete_childnode(0);
                        const high_level_header_txt_raster = high_level_header.as_text_raster("vertical");
                        high_level_header_txt_raster[0][0].designate_as("datum");
                        high_level_header_txt_raster[0][1].designate_as("van");
                        high_level_header_txt_raster[0][2].designate_as("naar");
                        high_level_header.set_as_leafnode("vertical", high_level_header_txt_raster);
                        //The body starts at the "vrachtwgn" line and ends at the last "Totaal"
                        const high_level_body = second_high_level_record.concrete_childnode(1);
                        //Split on both "Totaal" lines in the record body as subrec seperator.
                        high_level_body.define_as_horizontal_split_non_leafnode({
                            splitrows: [12, 27],
                            include1: true,
                            reverse_direction: true,
                            repeat_split: true
                        });
                        //The mid level record starts at the "vrachtwgn" line and ends at the first "Totaal"
                        const mid_level_record = high_level_body.concrete_childnode(0);
                        //Split on first low level record.
                        //This is the "BMW" line.
                        mid_level_record.define_as_horizontal_split_non_leafnode({
                            splitrows: [3],
                            include2: true
                        });
                        const midlevel_header = mid_level_record.concrete_childnode(0);
                        const midlevel_header_txt_raster = midlevel_header.as_text_raster("vertical");
                        midlevel_header_txt_raster[0][1].designate_as("middel");
                        midlevel_header.set_as_leafnode("vertical", midlevel_header_txt_raster);
                        const midlevel_bodyfooter = mid_level_record.concrete_childnode(1);
                        midlevel_bodyfooter.define_as_horizontal_split_non_leafnode({
                            splitrows: [9],
                            include2: true
                        });
                        const mid_level_footer = midlevel_bodyfooter.concrete_childnode(1);
                        const mid_level_footer_text_raster = mid_level_footer.as_text_raster("vertical");
                        mid_level_footer_text_raster[0][1].designate_as("totaal");
                        mid_level_footer.set_as_leafnode("vertical", mid_level_footer_text_raster);
                        //mid level body starts at BMW line and ends at Truck line.
                        const mid_level_body = midlevel_bodyfooter.concrete_childnode(0);
                        mid_level_body.define_as_horizontal_split_non_leafnode({
                            splitrows: [0, 3, 6],
                            include2: true,
                            repeat_split: true
                        });
                        //Low level record is the BMW line pluss some trailing stuff without Text
                        const low_level_record = mid_level_body.concrete_childnode(0);
                        const  lowleveltxtraster = low_level_record.as_text_raster("vertical");
                        lowleveltxtraster[0][3].designate_as("item");
                        lowleveltxtraster[0][4].designate_as("opm");
                        lowleveltxtraster[0][5].designate_as("incl");
                        lowleveltxtraster[0][6].designate_as("excl");
                        lowleveltxtraster[0][7].designate_as("kosten");
                        low_level_record.set_as_leafnode("vertical", lowleveltxtraster);
                        const page_set_2 = dtpair.pageset_node([1], true);
                        const page2 = page_set_2.concrete_childnode(0);
                        const template = dtpair.as_json();
                        console.log(template);
                        //Ab wants there to be a non-XLSX result for UI purposes.
                        const recordstructure = dtpair.apply();
                        //Write the result to an excell sheet.
                        const xlsx = pdfparsutils.get_xslxutil();
                        xlsx.export(recordstructure, "./nested.xlsx");
                    }
                    );
                }
            });
        }
    });
}(fs,
    pdfparsutils(),
    console,
    JSON
));
