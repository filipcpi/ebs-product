#!/usr/bin/env node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const axios = require('axios');
var fs = require('fs');
const { exit } = require('process');
var _ = require('underscore');
var jsonDataProducts = require('./dataProducts.json')

var config = JSON.parse(fs.readFileSync("./config.json"));

var products = ""

function equals( x, y ) {
    // If both x and y are null or undefined and exactly the same
    if ( x === y ) {
        return true;
    }

    // If they are not strictly equal, they both need to be Objects
    if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) {
        return false;
    }

    // They must have the exact same prototype chain, the closest we can do is
    // test the constructor.
    if ( x.constructor !== y.constructor ) {
        return false;
    }

    for ( var p in x ) {
        // Inherited properties were tested using x.constructor === y.constructor
        if ( x.hasOwnProperty( p ) ) {
            // Allows comparing x[ p ] and y[ p ] when set to undefined
            if ( ! y.hasOwnProperty( p ) ) {
                return false;
            }

            // If they have the same strict value or identity then they are equal
            if ( x[ p ] === y[ p ] ) {
                continue;
            }

            // Numbers, Strings, Functions, Booleans must be strictly equal
            if ( typeof( x[ p ] ) !== "object" ) {
                return false;
            }

            // Objects and Arrays must be tested recursively
            if ( !equals( x[ p ],  y[ p ] ) ) {
                return false;
            }
        }
    }

    for ( p in y ) {
        // allows x[ p ] to be set to undefined
        if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) {
            return false;
        }
    }
    return true;
}

async function getTest() {
    console.log("getTest")

    const res = await axios.get(config["esl"]["api"]+"/esls", {
        auth: {
            username: config["esl"]["username"],
            password: config["esl"]["password"]
        }
    })
    .then(function ok(jsonData) {
        console.log("getTest: test esls");
        console.log(jsonData.data);
        console.log("getTest: end test esls");
        })
    .catch(function fail(error) {
        console.log("getTest:  error ////");
        console.log(error)
    });
}

//getTest()

async function getFridges() {
    console.log("get fridges")

    let file = config["rfridge"]["config"]
    var configRfridge = JSON.parse(fs.readFileSync(file));
    console.log(configRfridge["apiKey"]);

    const fridge = axios({
        method: 'get',
        url: config["rfridge"]["api"]+'/fridges',
        headers: { 
            "x-api-key": configRfridge["apiKey"]
        }
    })
    .then(function ok(jsonFridge) {
        console.log("getFridges: get fridge data: " +  JSON.stringify(jsonFridge.data))
        let idFridge = jsonFridge.data[0]["id"]
        console.log("getFridges: get id: " +  JSON.stringify(idFridge))

        })
    .catch(function fail(error) {
        console.log(error)
    });
}

 function getProductsFromEBS() {

    let result;
    
    console.log("getProductsFromEBS")
    //console.log(config["ebs"]["api"]+'Products');

    return  axios({
        method: 'get',
        url: config["ebs"]["api"]+'Products',
        headers: { 
            "x-api-key": config["ebs"]["apikey"]
        }
    })
    .then(function ok(jsonData) {
        console.log("getProductsFromEBS: get ebs data: " +  JSON.stringify(jsonData.data))
        
        result = jsonData.data
        return result

    })
    .catch(function fail(error) {
        console.log("getProductsFromEBS error: " + error)
    });
}

async function postEBSProducts() {

    console.log("getProductsFromEBS")

    let file = config["rfridge"]["config"]
    var configRfridge = JSON.parse(fs.readFileSync(file));
    console.log(configRfridge["apiKey"]);

    const fridge = axios({
        method: 'get',
        url: config["rfridge"]["api"]+'fridges',
        headers: { 
            "x-api-key": configRfridge["apiKey"]
        }
    })
    .then(function ok(jsonFridge) {
        console.log("get fridge data: " +  JSON.stringify(jsonFridge.data))
        let idFridge = jsonFridge.data[0]["id"]
        console.log("get id: " +  JSON.stringify(idFridge))

        const res = axios.get(config["esl"]["api"]+'exportJSON/'+idFridge, {
        auth: {
            username: config["esl"]["username"],
            password: config["esl"]["password"]
        }
        })
        .then(function ok(jsonData) {
            console.log("get products: " +  JSON.stringify(jsonData.data))
            console.log("postEBSProducts");
            const res2 = axios({
                method: 'post',
                url: config["ebs"]["api"]+'Products',
                data: jsonData.data,
                headers: { 
                    "x-api-key": config["ebs"]["apikey"]
                }
            })
            .then(function ok(jsonData2) {
                console.log("post ebs data: " +  JSON.stringify(jsonData2.data))
                
            })
            .catch(function fail(error) {
                console.log("error post ebs products")
            });
        })
        .catch(function fail(error) {
            console.log("bad export json (get planograms id n'a pas fonctionné) ///// " + error + " ///// ")
        });
        })
    .catch(function fail(error) {
        console.log(error)
    });

    
}

async function deleteEBSProducts(jsonData) {

    if (jsonData) {
        console.log("deleteEBSProducts");

        const res = await axios({
            method: 'delete',
            url: config["ebs"]["api"]+'Products',
            headers: { 
                "x-api-key": config["ebs"]["apikey"]
            },
            data: jsonData
        })
        .then(function ok(jsonData) {
            console.log("delete ebs data: " +  JSON.stringify(jsonData.data))
        })
        .catch(function fail(error) {
            console.log(error)
            if (jsonData.length != 0) {
                deleteEBSProducts()
            }
        });
    } else {
        console.log("no data to delete");
    }
}

async function getExportJsonFridge(fridgeId) {
    try {
        const res = await axios.get(config["esl"]["api"]+'exportJSON/'+fridgeId, {
            auth: {
                username: config["esl"]["username"],
                password: config["esl"]["password"]
            }
            
            })
            return JSON.stringify(res.data);
    } catch (error) {
        console.log("erro export: " + error);
        exit(1);
    }
}

function getPlanogramDataActiveForThisFridge() {
    let file = config["rfridge"]["config"];
    var configRfridge = JSON.parse(fs.readFileSync(file));

    const fridge = axios({
        method: 'get',
        url: config["rfridge"]["api"]+'fridges',
        headers: { 
            "x-api-key": configRfridge["apiKey"]
        }
    })
    .then((jsonFridge) => {
        console.log("fonctionne");
        //return "fonctionne"
        return getExportJsonFridge(jsonFridge)
    })
    .catch(function fail(error) {
        console.log("error")
        return "error";
    });
    return "error";
}

function getFridgeId() {
    let file = config["rfridge"]["config"];
    var configRfridge = JSON.parse(fs.readFileSync(file));

    console.log("getFridgeId");

    return axios.get(config["rfridge"]["api"]+'fridges', {
        headers: { 
            "x-api-key": configRfridge["apiKey"]
        },
    })
    .then((response) => response.data);
}

//return result.data[0]["id"];
async function main() {

    let results;
    let fridgeId;
    let resultEBS;
    let result;
    try {
        result = await getFridgeId();
        fridgeId = result[0]["id"];
    } catch (error) {
        exit(1);
    }
    console.log("fridgeId: " + fridgeId);
    //exit(0)

    resultEBS = await getProductsFromEBS()
    //resultEBS = JSON.stringify(resultEBS)
    
    /*
    1) getProductsFromEBS recup products from EBS (fridge) https://192.168.1.210/api/
    1.a) vérif données de getProductsFromEBS et du json local
    2) deleteEBSProducts delete les produits recup juste avant
    3) postEBSProducts créer les nouveaux produits présent dans l'ESL exportJSON 
    */

    console.log("--- partie 1 ---");
    results = await getExportJsonFridge(fridgeId);
    console.log("--- partie 2 ---");

    //console.log("resultat export json : " + results);
    //console.log("--------------------------");
    //console.log("result EBS: " + resultEBS);

    //if (results == "problem") return;
    
    fs.writeFileSync("./dataProducts.json", results);
    jsonDataProducts = JSON.parse(fs.readFileSync("./dataProducts.json"));
    
    console.log("--- partie 3 ---");
    //console.log("data products");
    console.log(JSON.stringify(jsonDataProducts));
    console.log(JSON.stringify(resultEBS));

    //exit(0)
    
    //console.log(_.isEqual(JSON.stringify(jsonDataProducts), JSON.stringify(resultEBS)));
    

    if (!_.isEqual(jsonDataProducts, resultEBS)) {
        console.log("json différent donc mise à jour");

        
        let i = 0;
        let arraytmp = []

        if(typeof resultEBS !== 'undefined' && resultEBS.length > 0) {
            console.log("va etre supprimer");
        } else {
            console.log("pas supprimer");
        }

        // vérifier si il y a des produits apres suppression
        while (typeof resultEBS !== 'undefined' && resultEBS.length > 0) { // en cas de bug de l'api delete 
            i = 0;
            for (const result of resultEBS) {
                arraytmp[0] = result
                console.log("result: " + JSON.stringify(result))

                console.log("tour: " + i);
                
                await deleteEBSProducts(arraytmp)
                i++
            }
            resultEBS = await getProductsFromEBS()
            console.log("resultEBS: ", resultEBS);
        }

        console.log("--- partie 4 ---");
        postEBSProducts()
        
        
    } else {
        console.log("json équivalent pas besoin de mettre à jour");
    }
}

main()
