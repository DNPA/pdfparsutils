#!/usr/bin/python
import json
import sys
import subprocess
print "Tool for testing currently highly experimental header/body/record/footer finding code"
print "Only use this tool if you are working on making that highly experimental code work!"
print
with open("testset.json") as f:
    config = json.load(f)

files = dict()
for fil in config:
    if fil["ok"] == True:
        files[fil["file"]] = dict()
        for page in fil["pages"]:
            files[fil["file"]][str(page["page"])] = page

if len(sys.argv) == 1:
    print "Available test documents:"
    for k in sorted(files.keys()):
        print "* ", k
else:
    if len(sys.argv) == 2:
        filename = sys.argv[1]
        if filename in files.keys():
            print "Available pages in '"+filename+"':"
            for page in sorted(files[filename].keys()):
                print "* ", page
        else:
            print "ERROR: The file '"+filename+"' is not currently a valid testset file."
    else:
        filename = sys.argv[1]
        pageno = sys.argv[2]
        if filename in files.keys():
            if pageno in files[filename].keys():
                conf = files[filename][pageno];
                page = str(int(pageno) - 1)
                count = str(conf["rcount"])
                f_start = str(conf["first"]["start"])
                f_end = str(conf["first"]["end"])
                l_start = str(conf["last"]["start"])
                l_end = str(conf["last"]["end"])
                cmd = ["/usr/bin/node","testtool-ll.js",filename,page,count,f_start,f_end,l_start,l_end]
                print cmd
                proc = subprocess.Popen(cmd,stdout=subprocess.PIPE)
                for line in iter(proc.stdout.readline,''):
                    print line.rstrip()
            else:
                print "ERROR: No config found for page '"+pageno+"' of '"+filename+"'."
                print files[filename].keys()
        else:
            print "ERROR: The file '"+filename+"' is not currently a valid testset file."
