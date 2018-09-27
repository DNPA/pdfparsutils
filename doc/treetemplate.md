Treetemplate.js
===============
This describes the functions and datastructures of the Treetemplate module: treetemplate.js  
It matches the picture in [treetemplate_photo.jpg](treetemplate_photo.jpg)  
The Treetemplate module can be used to create or restore a template collection.  
The Treetemplate module has the following dependencies:
- json library
- treetemplate-corelib library

## Module description

### treetemplate (module)
- Function: `collection({collection = "[]"})`    
    Can be used to create or restore a template collection.  
    - Param1:  new(empty) OR existing collection  
    - Returns: collection (object literal)
    - Throws:  ERROR exceptions in case of invalid input
- Function: `propose_match({rasterarray = null, rcindexarray = null, splitoncols = false, reversedirection = false, regexcandidates = []})`  
    Can be used to find a match proposal based on rasters and designated seperator(s) for use in a template.  
    - Param1:  rasterarray - array of rasters  
    - Param2:  rcindexarray - array of indices of rows to do the matching  
    - Param3:  splitoncols - boolean, true for a vertical split  
    - Param4:  reversedirection  - boolean, true for match search for bottom to top  
    - Param5:  regexcandidates - array of regex-es  
    - Returns: matchrecord  
    - Throws:  ERROR exceptions in case of invalid input  
- Function: `find_matches({rasterarray = null, match = null, repeat = true, splitoncols = false, reversedirection = false})`  
    Can be used to find mathing rows (or cols) based on a match rule as found in template or returned from propose_match.  
    - Param1:  rasterarray - array of rasters  
    - Param2:  match - record to find matches  
    - Param3:  repeat - boolean, true if .....  
    - Param4:  splitoncols - boolean, true for a vertical split  
    - Param5:  reversedirection  - boolean, true for match search for bottom to top  
    - Returns: 2 dimensional array, with for each raster a list of matchrecords (rows or cols)  
    - Throws:  ERROR exceptions in case of invalid input  
- Function: `as_text_raster({raster = [], collapse = "none", seperator = null})`  
    Can be used to extract the text fields of a (leaf)node.  
    The collapse parameter controls what to do with fields that contain multiple lines.  
    - Param1:  raster
    - Param2:  collapse - string containing: "none", "vertical" or "horizontal"     
    - Param3:  seperator - seperator character to use in case of collapsing
    - Returns: text_leaf_node_raster (array containing a raster with text elements)  
               See description later in this document
    - Throws:  ERROR exceptions in case of invalid input
  
### collection (object literal)
- Function: `get_template_page_scope()` 
    Can be used to get your hands on a template  
    - Returns: templatepagescope (object literal)   
               See description later in this document  
- Function: `as_json()`   
    Can be used to get a JSON version of a template collection  
    - Returns: json string
- Function: `size()` 
    Can be used to get the number of templates in the collection  
    - Returns: number of templates
- Function: `best_match(document, pageno, ttp)` 
    Can be used to get the best matching template  
    - Param1:  document - function that returns the raster of a parsed document
    - Param2:  pageno - page number
    - Param3:  ttp - treetemplate
    - Returns: pagetemplate
    - Throws:  ERROR exceptions in case of invalid input

### templatepagescope (object literal)
- Function: `add_template({minxdiff = 0.001, minydiff = 0.001})`    
    Can be used to get a new fresh template  
    - Param1:  x diff
    - Param2:  y diff
    - Returns: templatenode (object literal)
    - Throws:  ERROR exceptions in case of invalid input
- Function: `get_template(index)`  
    Can be used to get access to an existing template  
    - Param1:  index
    - Returns: templatenode (object literal)
    - Throws:  ERROR exceptions in case of invalid input
- Function: `copy_template(parentindex)`  
    Can be used to create a brand new copy of an existing template  
    - Param1:  parentindex
    - Returns: templatenode (object literal)
    - Throws:  ERROR exceptions in case of invalid input

    
## Datastructures description
    
### text_leaf_node_raster  
- This is a data structure to hold only the text from leafnodes (text_leafnode_cell's)

### text_leafnode_cell
- Function: `designate_as(name, lexical_scoping = true, hoist_level = 0)`   
    For matchtype = "var"
    - Param1:  name
    - Param2:  lexical_scoping - boolean, true for .......
    - Param3:  hoist_level (0 for , x for .......) 
    - Returns: -
    - Throws:  ERROR exceptions in case of invalid input
- Function: `skip()`   
    For matchtype = "skip"
    - Returns: -
- Function: `const()`  
    For matchtype = "const"
    - Returns: -

### templatenode (= object literal)

- Function: `horizontal_split(repeat = "none", include = "none", match = [], reversed = false, useparentcols = false)`   
    Can be used to make a template node into a non-leaf node that defines a horizontal split.  
    With the include param you can define if the splitrow itself must be included in the upper part, the bottom part or not included at all.       
    - Param1:  repeat - "none" OR "record"
    - Param2:  include - "none" OR "part1" OR "part2"  
    - Param3:  match - Array of one or more match rows
    - Param4:  reversed - boolean, true for search direction from bottom to top
    - Param5:  useparentcols - boolean, true if column settings of parent raster must be used  
    - Returns: -
    - Throws:  ERROR exceptions in case of invalid input
- Function: `vertical_split(repeat = "none", include = "none", match = [], reversed = false, useparentrows = false)`  
    Can be used to make a template node into a non-leaf node that defines a vertical split.  
    With the include param you can define if the splitrow itself must be included in the left part, the right part or not included at all.       
    - Param1:  repeat - "none" OR "record"
    - Param2:  include - "none" OR "part1" OR "part2"  
    - Param3:  match - Array of one or more match rows
    - Param4:  reversed - boolean, true for search direction from bottom to top
    - Param5:  useparentrows - boolean, true if row settings of parent raster must be used  
    - Returns: -
    - Throws:  ERROR exceptions in case of invalid input
- Function: `first_child()`  
    - Returns: templatenode
- Function: `second_child()`  
    - Returns: templatenode
- Function: `set_as_leaf(collapse = "none", designations = [])`  
    Marks a node as leaf node.
    Sets the type of fields in the node depending on the designations input parameter.   
    The collapse parameter controls what to do with fields that contain multiple lines.
    - Param1: collapse - string containing: "none", "vertical" or "horizontal"     
    - Param2: designations - textraster with text fields and META info
    - Returns: -
    - Throws:  ERROR exceptions in case of invalid input
- Function: `meta()`  
    - Returns:  
      for non-leaf nodes: nodetype, splittype, repeat, include, match, reversed, minxdiff, minydiff   
      for leaf nodes:     nodetype, collapse, designations, minxdiff, minydiff  
