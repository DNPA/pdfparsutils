Beschrijving regex.json
===========================
This decribes the format of the regex.json file, including some example records.

### regex.json (example)

```javascript
[{
        "ftype": "bedrag",
        "notes": "example: € 1.788,99",
        "weight": 10,
        "regex": "^([$€£¥؋₼៛₡₱₪₩₭₮₦₱₴₫]\\s+)?[0-9]{0,3}(\\.?[0-9]{3})*,[0-9]{2}$"
 }, {  
        "ftype": "bedrag",
        "notes": "example: $ 1,788.99",
        "weight": 10,
        "regex": "^([$€£¥؋₼៛₡₱₪₩₭₮₦₱₴₫]\\s+)?[0-9]{0,3}(,?[0-9]{3})*\\.[0-9]{2}$"
 }, {
        "ftype": "datum",
        "notes": "example: 31-08-1970",
        "weight": 6,
        "regex": "^(0?[0-9]|1[0-9]|2[0-9]|3[01])-(0?[1-9]|1[012])-(19|20|21)[0-9]{2}$"
 }, {
        "ftype": "datum",
        "weight": 5,
        "example": "example: 12-25-2018",
        "regex": "^(0?[1-9]|1[012])-(0?[0-9]|1[0-9]|2[0-9]|3[01])-(19|20|21)[0-9]{2}$"
 }, {
        "ftype": "bugustest",
        "weight": 1,
        "example": "Hoewel het overzicht op zorgvuldige wijze is samengesteld",
        "regex": ".*zorgvuldige +wijze.*"
 }
]
