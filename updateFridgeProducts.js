#!/usr/bin/env node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const axios = require('axios');
var fs = require('fs');

var config = JSON.parse(fs.readFileSync("./config.json"));

//var user = "admin_CPI"
//var password = "adminCPI"
var products = ""

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
    console.log(config["ebs"]["api"]+'Products');

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

        /*
        
        jsonData.data.forEach(element => {
            arraytmp[0] = element
            console.log(i)
            console.log(JSON.stringify(element))
            
            deleteEBSProducts(arraytmp, i)
            i++
        });
        */
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

async function deleteEBSProducts(jsonData, i) {

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
            console.log(i + " / delete ebs data: " +  JSON.stringify(jsonData.data))
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


//getTest()
async function main() {
    let results;
    console.log("--- partie 1 ---");

    results = await getProductsFromEBS()
    console.log("--- partie 2 ---");

    console.log("resultat : " + JSON.stringify(results));
    console.log("--- partie 3 ---");

    let i = 0;
    let arraytmp = []
    let j = 0;

    // vérifier si il y a des produits apres suppression

    while (typeof results !== 'undefined' && results.length > 0) { // en cas de bug de l'api delete
        
        i=0;
        for (const result of results) {
            arraytmp[0] = result
            console.log(i)
            console.log(JSON.stringify(result))
            
            await deleteEBSProducts(arraytmp, i)
            i++
        }
        results = await getProductsFromEBS()
        j++;

    }
    console.log("combien de tour: " + j);

    console.log("--- partie 4 ---");

    postEBSProducts()
}

main()
