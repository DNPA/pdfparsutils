Pdftoolutil.js
===============
This describes the functions and datastructures of the Pdftoolutil module: pdftoolutil.js  
The module exports it functionality as a function called: pdftoolutil
The Pdftoolutil module has the following dependencies:
- json library
- regexes library


## Module description

### pdftoolutil (module)
- Function: `pdftoolutil()`    
  This is the starting point (initialization) of the pdftoolutil module.
    - Param1:  json - A library to convert a JSON string to an object
    - Param2:  regex - An object containing regular expressions used for the matching process  
               See [regex.md](regex.md) for the format of the regex rules
    - Returns: an anonymous function object, contaning the functions described hereafter

- Function: `document_template_pair (parseddocument, ttp, pagecount)`  
    Couples a template to a parsed document
    - Param1:  parseddocument - function that returns the raster of a parsed document
    - Param2:  ttp - template in JSON format describing the pdf layout
    - Param3:  pagecount - number of pages in parsed document
    - Returns: an anonymous document/template pair object, containing the functions described hereafter  

### document_template_pair functions
- Function: `init ({template_json = null, min_y_diff = null, min_x_diff = null})`  
    Intializes a document/template pair  
    - Param1: Object containing:    
              template_json - optional, existing template  
              min_y_diff - number specifying the y margin used during rasterize   
              min_x_diff - number specifying the x margin used during rasterize
    - Returns: - 

- Function: `page_node (pageno, mutable)`  
    Creates a page node
    - Param1: pageno - number of page to create node for
    - Param2: mutable - boolean, true if you want to update the page node
    - Returns: node object, containing the functions described later

- Function: `raster (page)`  
    Returns the raster (grid array) of a certain page a document   
    - Param1: page - number of page
    - Returns: raster

- Function: `pageset_node (pageset, mutable)`  
    Returns TODO: FILL IN A NICE DESCRIPTION ..such as : "Creates a node for one or more pages" ?? ................
    - Param1: pageset - array of pagenumbers
    - Param2: mutable - boolean, true if you want to update the pageset node
    - Returns: an anonymous object, containing the concrete_childnode function described hereafter  

    - Function: `concrete_childnode (i)`  
        Returns a concrete child node from a page set node  
        - Param1: i - number of node requested  
        - Returns: page node object, containing the functions described later

- Function: `apply ()`  
    Returns all the data extracted from the PDF document
    - Returns: an anonymous datastructure object, containing the extracted data  
    - Datastructure fields:  
        - page_scope
        - children  
        - lexical_scope  

- Function: `as_json ()`  
    Returns alle templates in the template collection in JSON format
    - Returns: JSON data  

### node functions  

- Function: `ll_define_as_horizontal_split_non_leafnode ({splitrows = [], reverse_direction = false, repeat_split = false, include1 = false, include2 = false, useparentcols = false})`  
    Using the splitrow(s) this funtion tries to deduce a match rule.
    Then it uses this match rule to find rows in the raster that match this rule.
    - Param1: Object containing:  
              splitrows - Array of one or more rownumbers to split on  
              reverse_direction - boolean, true for backwards searching  
              repeat_split - boolean, true for spliting in a recordsection  
              include1 - boolean, true for inclusion of splitrow in first part  
              include2 - boolean, true for inclusion of splitrow in second part   
              useparentcols - boolean, true if column settings of parent raster must be used  
    - Returns: Array of matching rows  

- Function: `define_as_horizontal_split_non_leafnode ({splitrows = [], reverse_direction = false, repeat_split = false, include1 = false, include2 = false, useparentcols = false})`  
    Using the splitrow(s) this function splits a raster in one or more sub-rasters.
    The outcome of the split operation(s) depends on the matching proces that uses the splitrow(s) and the reverse_direction and repeat_split input paramaters.
    - Param1: Object containing:    
              splitrows - Array of rownumbers to split on  
              reverse_direction - boolean, true for backwards searching  
              repeat_split - boolean, true for spliting in a recordsection  
              include1 - boolean, true for inclusion of splitrow in first part  
              include2 - boolean, true for inclusion of splitrow in second part  
              useparentcols - boolean, true if column settings of parent raster must be used  
    - Returns: Array of rasters

- Function: `child_count ()`  
    - Returns: number of child nodes  

- Function: `concrete_childnode (rasterno)`  
    Retrieves the node from a certain raster.
    Note that this function can be used recursively to walk the tree of nodes.
    - Param1: rasterno - number of raster
    - Returns: node object

- Function: `as_text_raster (collapse = "none")`  
    This function can be used to extract the text fields of a node.
    The collapse parameter controls what to do with fields that contain multiple lines.
    The output also contains META information (such as type) of the text fields.
    - Param1: collapse - string containing: "none", "vertical" or "horizontal"     
    - Returns: a textraster (Array containing a raster with text elements)

- Function: `set_as_leafnode (collapse = "none", designations = [])`  
    Marks a node as leaf node.
    Sets the type of fields in the node depending on the designations input parameter
    The collapse parameter controls what to do with fields that contain multiple lines.
    - Param1: collapse - string containing: "none", "vertical" or "horizontal"      
    - Param2: designations - textraster with text fields and META info
    - Returns: -

- Function: `update_raster_granularity ({})`
    Updates raster granularity in x and/or y direction. Note that this is done for one node only.
	If there are already child nodes, these nodes will still have the granularity settings
	initially inherited from the node.
	- Param1: Object containing:
              minydiff - number specifying the y margin used during rasterize, if unspecified, 
			             the existing setting for minydiff is used.
              minxdiff - number specifying the x margin used during rasterize, if unspecified,
			             the existing setting for minydiff is used.
    - Returns: -


- Function: `set_as_empty_leafnode ()`  
    Marks a node as leaf node without extra META information assigned to the text fields.
    - Returns: -

- Function: `meta ()`  
    Returns meta formation of the template node such as, node type, x/y margins, etc
    - Returns: Object containing the META information

- Function: `get_raster ()`  
    - Returns: raster

- Function: `get_data_structures (pgnum)`  
    Retrieves all intermediate data (including scope information) for a certain page of the document
    - Param1: pgnum - number of page  
    - Returns: json formatted node data 
