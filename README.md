## pdfparseutils

JavaScript utility library for breaking down the structure of a PDF report and exporting the decomposition data to an excell spreadsheet file.

The library has the following functionality:

* Rasterizing a PDF report document
* Creating a template for structure based processing of specific types of PDF reports.		
* Template based conversion of PDF to lexiaclly scoped data structures.
* Exporting of lexiaclly scoped data structures to a flat Excell sheet.
* Experimental support for template building hints.

To install, use 'npm install pdfparseutils'

#### Parsing the document and binding a template.
Before we can get to the real work, we need to parse the PDF document and bind it to a template. 
In the simplest form we will use a brand new template for our PDF document. To initialize part of our library we should need to read in a JSON file with regular expressions. There is a sample regex file in the repo, but it it sugested you as a user create your own domain specific regex file for your own purposes.
```javascript
//Load the pdfparseutils module
const utils = require('pdfparseutils');
//Get a parser from the module so we can parse PDF content.
const parser = utils.get_parser();
//Set some config parameters for our module.
const corelib_settings = {
    aggressive_regex : true,
    strip_attributes_first: true,
    drop_nonregex_text: true
};
//Create a brand new empty tree template
const tree_template = utils.get_treetemplate(corelib_settings);
//Read in a regex collection for grouping types of text content with.
fs.readFile("../etc/regex.json", function (error, regexConfBuffer) {
    if (!error) {
	    //The toolutil needs our regex info
	    const toolutil = utils.get_toolutil(regexes);
        fs.readFile("variant5b.pdf", function (err, pdfBuffer) {
		    if (!err) {
			    //The PDF binary data is in our buffer, call parse and process the results.
                parser.parse(pdfBuffer, 
                    function (errData) {
					    throw Error("PDF file parse issues");
                    },
	                function (pagecount, parseddocument) {
					    //We successfully parsed the document. 
                        const document_template_pair = toolutil.document_template_pair(parseddocument, tree_template, pagecount);
						document_template_pair.init({
                            min_x_diff: 1.0,
                            min_y_diff: 0.002
                        });
                        ...
                    }
                );
			} else {
                throw Error("Problem reading PDF file");
			}
        });
	} else {
        throw Error("Problem reading regexes file");
	}
});
```
If at some point in time we are done with this PDF but are anticipating an other PDF might use the exact same document structure as the one we found using this document, it is possible to get a JSON dump of the whole document template to use for this purpose.

```javascript
template_json = document_template_pair.as_json();
```
Then, if/when we want to use the same template once more, we can add it as extra parameter to the init function.

```javascript
document_template_pair.init({
    min_x_diff: 1.0,
    min_y_diff: 0.002
});
```


#### About rasters

The pdfparseutils library is built on top of [pdf2json](https://github.com/modesty/pdf2json) and is meant as a utility library to help in the semi-automated decomposition of report-type PDF documents. At the core of pdfparseutils is the concept of rasterization. Using a simple measure for the granularity with what to rasterize, the first step the library takes in aiding the decomposition of the document is converting the output of pdf2json to a two-dimentional matrix (or raster) of cells. Each cell, that may contain zero or more PDF elements, must be seen as a collection of elements that are aproximately at the same location in the grit. 

```javascript
//After parsing, bind the new (or remembered) template to the parsed document.
const document_template_pair = toolutil.document_template_pair(parseddocument, tree_template, pagecount);
//Set rasterization parameters.
document_template_pair.init({
    min_x_diff: 1.0,
    min_y_diff: 0.002
});
//Get the full page raster for the first page (page 0)
bigraster = document_template_pair.raster(0);
```
If at any point the page level raster is found to consist of an upper and a lower part, for example a page header as upper part and a combination of a body and a footer as lower part, than one of the parts may have its rasterization parameters updated if that yields better decomposition results.

```javascript
//Create a page set of one page, assuming the first page is special.
const page_set = document_template_pair.pageset_node([0], true);
//Get a document+template representation of the first page
const pageone = page_set.concrete_childnode(0);
//Indicate to the templating system that the page body starts at the 9th line.
pageone.define_as_horizontal_split_non_leafnode({
    splitrows: [8],
    include2: true,
});
if (pageone.child_count() > 1) {
  //Get the header doc+template node.
  header = pageone.concrete_childnode(0);
  //Update the minxdiff for rasterization of the header.
  header.update_raster_granularity({minxdiff: 0.015})
  //Get the raster for just the header part.
  header_raster = header.get_raster();
} else {
  throw Error("We can not find any match rule that would allow us to define a template for splitting on line 8");
}

```

#### About templates
So far we have shown a bit of the usage of template related functions without going into the template concept.
A template for pdfparseutils is a tree. At the top level of the tree there is a collection of pageset templates. A pageset template as the name implies is a single template that should apply to a set of one or more pages. A pageset template in term should be seen as a root level node template. A node template, at root level or any other level can have one of three distinct types:

* A leaf-node
* A non-leaf non-repeating structure node
* A non-leaf repeating structure node

A leaf-node has no children and may or may not contain data fields. A non-leaf non-repeating structure node has exactly two children. The children are two records of the same type, but instead are distinctly different structures, like for example a page header and a page body+footer, or for example a page body and a page footer. Finaly a non-leaf repeating structure node has exactly one child in the template, but this child represents a repeating structure. An example of a simple pageset template structure clould look something like this:

* Page level non-leaf non-repeating structure node
  * header leaf-node
  * body+footer non-leaf non-repeating structure node
    * body non-leaf repeating structure node
	  * record level leaf-node
	* footer level leaf-node

Remember this line?
```javascript
//Create a page set of one page, assuming the first page is special.
const page_set = document_template_pair.pageset_node([0], true);
```

We didn't discuss the boolean true value of this call yet, but basically, the true indicates we intend to
change the underlying template, if there is any. In our first case, there isn't any, but if we used an earlier
template JSON as discussed above, then there would have been one, and we could have said we didn't want to mutate the template. Non mutable page sets are meant to be applied to only. Note that nothing in the API currently prevents you from calling mutating API calls on a pageset template that was defined as non-mutable, it is up to you to do what you promise when you indicate non mutability. When you indicate non-mutability you get a template back that SHOULD NOT be mutated (and that should save you time defining templates), you DON'T get a template that CAN NOT be mutated. Only if you do mutate it, you WILL break things. To complicate things further, there is one situation where you ask for a mutable template but get back a template that shouldn't be mutated. But enough of seeding fear for now, let us continue by ecplaining what you get back when you set the mutable flag to true, and what you get when you set the mutable flag to false. Hopefully it will all start to make sense.

* If the template collection is empty and mutable is set to false, the pageset\_node function will throw an exception
* If the template collection is empty and mutable is set to true, you will get a brand new empty pageset template
* If the template collection is non-empty and mutable is false, you get back a REFERENCE to the currently best matching existing pageset template. The reason why you shouldn't mutate the template is because you will be mutating the template for multiple pagesets if you do.
* If the template collection is non-empty and mutable is true, but there is a perfect match between the pageset and the template, than, non-intuitively, you get back a REFERENCE to the currently best matching existing pageset template. The reason why you shouldn't mutate the template is because you will be mut
ating the template for multiple pagesets if you do. But given that the template already is a perfect match you should normally have no reason to mutate.
* If the template collection is non-empty and mutable is true and the match with the best matching template isn't perfect, you will get back an exact COPY of currently best matching existing pageset template. You can and should mute this copy to match your needs.

Let us move on to mutating actions. The first one of the mutating actions we saw already

```javascript
//Indicate to the templating system that the page body starts at the 9th line.
pageone.define_as_horizontal_split_non_leafnode({
    splitrows: [8],
    include2: true,
});
```
You can point out a seperator line, or in the case of repeating structures, multiple, and ask the library to try and figute out if it can derive a matchline for this line and add it to the template. There are multiple attributes that can be used, and please look at the API docs for a complete description, but you can have the designated line be part of the upper structure, or the lower structure, you can look for a match top to bottom or bottom to top, you can indicate the children are a repeating  structure or two distinct parts, etc. So basically this one call will help you define both types of non-leaf nodes. In order to define a leaf node in the template a pair of two calls is used.

```javascript
//Get a stripped down version of the header raster containing only text element object
const header_txt_raster = header.as_text_raster("vertical");
//Define fields that should be transfered to the eventual output file.
header_txt_raster[0][0].designate_as("date");
header_txt_raster[0][1].designate_as("sender");
header_txt_raster[0][2].designate_as("receiver");
//Define the 6th element as a constant text needed for this record to match.
header_txt_raster[0][5].const()
//Write the field definitions to the template and define as leaf node.
header.set_as_leafnode("vertical", header_txt_raster);
```

If there is absolutely no interesting data in a leaf node, you may also use the convenience method:
```javascript
footer.set_as_empty_leafnode();
```
Once you are completely done defining your template for each of the page sets in your document, you can
extract the data in one big object:

```javascript
const datastructure = document_template_pair.apply();
```

#### About lexical scopes
To understand how the data from the leaf nodes maps to the apply results, we need to discuss lexical scoping and how it is implemented in pdfparseutils. The pdfparseutils library has two ways to scope data fields:

* Page scope
* Lexical scope

Page scope speaks for itself. These are variables that are bound to the specific page they are found on and these aren't in any way lexically scoped. For lexical scoping there is one simple rule:

* A child node of a non-leaf repeating structure node defines a lexical scope. 

An important reason to keep pages outside of lexical scoping is the idea that in the future, pdfparseutils. might want to support recorsd that start on one page and continue on the next.

You can have repeating structures within repeating structures and the whole of these defines a tree of lexical scopes for variables. So a nested structure PDF page coulkd for example have the following lexical scopes:

* Document scope
* Page scope
* Outer record scope containing for example customer meta
* Inner record scope containing for example transaction meta

#### About excel exports

Once apply has given us the lexically scoped data structure, what is left is smassing the whole tree and flattening things so they fit into our excel results sheet.

```javascript
const xlsx =  pdfparseutils.get_xslxutil();
xlsx.export(datastructure, "./our-results.xlsx");
```
The mapping from lexically scoped structures to a flat two dimensional excell sheet is a bit limited, but
for most purposes it should proof usefull. The output will use a bit of color coding to distinguish between lexical scope, but a lot of higher level data WILL get duplicated on many many lines. That is simply the price we pay for mapping a complex tree shaped nested structure to a simple matrix.
#### API documentation

For a reference style API documentation, look [here](doc/index.md).
