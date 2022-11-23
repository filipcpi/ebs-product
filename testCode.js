const fs = require('fs');

/*fs.writeFile("./dataProducts.js", "Hey there!", function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
}); */

// Or
fs.writeFileSync("./dataProducts.json", '[{"some": "thing"}]');