# pdfparsutils module

pdfparsutils is a node.js module that aids in processing PDF reports and in eventually converting them from binary PDF to excel spreadsheet format, it's built with pdf2json and xlsx-populate.

The goal is to enable most of the hooks needed to aid in extracting the, possibly nested, data structures from a PDF report and to allow exporting the results to an excell spreadsheet.

##  Install

    npm install pdfparsutils


Or install it globally:

    sudo npm install pdfparsutils -g

To update with latest version:

    sudo npm update pdfparsutils -g

## Code Example

#### Using the modules and getting the top API's

```javascript
  const utils = require('pdfparsutils');
  const corelib_settings = {
      aggressive_regex : true,
      strip_attributes_first: true,
      drop_nonregex_text: true
  };
  const tree_template = utils.get_treetemplate(corelib_settings);
  const pdf_parser = utils.get_parser();
  const regexes = json.parse(regexConfBuffer);
  const tool_util = utils.get_toolutil(regexes);
```

#### Tree Template

The API documentation for the Tree Template API can be found [here](treetemplate.md).


#### PDF Tool Util

The API documentation for the Tool Util API  can be found [here](pdftoolutil.md)

#### PDF Parser

The PDF Parser and Tree Template APIs are two sub-APIs that are normally accesses through the 
PDF Tool Util abstraction layer. 

At the start of processing though, they need to be invoked to make the PDF Tool Util available.

To start processing of the PDF file, the file needs to be loaded into a buffer and with 
this buffer, the code to parse the PDF file and make it available through the 
PDF Tool Util library looks something like this.

```javascript
  const parser = utils.get_parser();
      parser.parse(pdfBuffer, function (errData) {
      cons.log("Oops, file parse issue.");
  }, function (pagecount, parseddocument) {
      const dtpair = toolutil.document_template_pair(parseddocument, tree_template, pagecount);
	  ...
  }
```


