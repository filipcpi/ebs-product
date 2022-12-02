#!/usr/bin/env node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const axios = require('axios');
var fs = require('fs');
const { exit } = require('process');
var _ = require('underscore');
var jsonDataProducts = require('./dataProducts.json')

var config = JSON.parse(fs.readFileSync("./config.json"));

var products = ""

function getProductsFromEBS() {
    return axios.get(config["ebs"]["api"]+'Products', {
        headers: { 
        "x-api-key": config["ebs"]["apikey"]
    }}).then((response) => response.data);
    
}

function postEBSProducts(jsonData) {

    return axios({
        method: 'post',
        url: config["ebs"]["api"]+'Products',
        data: jsonData,
        headers: { 
            "x-api-key": config["ebs"]["apikey"],
            'Content-Type': 'application/json; charset=utf-8'
        }
    })
    .then((response) => response)
}

function deleteEBSProducts(jsonData) {
    if (jsonData) {

        return axios({
            method: 'delete',
            url: config["ebs"]["api"]+'Products',
            headers: { 
                "x-api-key": config["ebs"]["apikey"]
            },
            data: jsonData
        })
        .then((jsonData) => {
            console.log("delete ebs data: " +  JSON.stringify(jsonData.data))
        })
        .catch((error) => {
            console.log(error)
            if (jsonData.length != 0) {
                deleteEBSProducts()
            }
        });
    } else {
        console.log("no data to delete");
    }
}

function getExportJsonFridge(fridgeId) {
    
    return axios.get(config["esl"]["api"]+'exportJSON/'+fridgeId, {
        auth: {
            username: config["esl"]["username"],
            password: config["esl"]["password"]
        }
        
    })
    .then((response) => JSON.stringify(response.data));

}

function getFridgeId() {
    let file = config["rfridge"]["config"];
    var configRfridge = JSON.parse(fs.readFileSync(file));
    

    return axios.get(config["rfridge"]["api"]+'fridges', {
        headers: { 
            "x-api-key": configRfridge["apiKey"]
        },
    })
    .then((response) => response.data);
}

async function main() {

    let resultOfExportJson;
    let fridgeId;
    let resultEBS;
    let resultFridge;
    let resultPost;
    
    let file = config["rfridge"]["config"];
    var configRfridge = JSON.parse(fs.readFileSync(file));

    try {
        resultFridge = await getFridgeId();
        fridgeId = resultFridge[0]["id"];
    } catch (error) {
        console.log(error);
        exit(1);
    }

    resultEBS = await getProductsFromEBS()
    
    /*
    1) getProductsFromEBS recup products from EBS (fridge) https://192.168.1.210/api/
    1.a) vérif données de getProductsFromEBS et du json local
    2) deleteEBSProducts delete les produits recup juste avant
    3) postEBSProducts créer les nouveaux produits présent dans l'ESL exportJSON 
    */

    try {
        resultOfExportJson = await getExportJsonFridge(fridgeId);
    } catch (error) {
        exit(1)
    }
    
    fs.writeFileSync("./dataProducts.json", resultOfExportJson);
    jsonDataProducts = JSON.parse(fs.readFileSync("./dataProducts.json"));
    
    console.log(JSON.stringify(jsonDataProducts));
    console.log(JSON.stringify(resultEBS));

    if (!_.isEqual(jsonDataProducts, resultEBS)) {

        let i = 0;
        let arraytmp = []

        while (typeof resultEBS !== 'undefined' && resultEBS.length > 0) { // en cas de bug de l'api delete 
            for (const result of resultEBS) {
                arraytmp[0] = result
                
                try {
                    resultPost = await deleteEBSProducts(arraytmp)
                } catch (error) {
                    exit(1)
                }
            }
            resultEBS = await getProductsFromEBS()
        }
        try {
            resultPost = await postEBSProducts(resultOfExportJson)
        } catch (error) {
            exit(1)
        }
    } else {
        console.log("json équivalent pas besoin de mettre à jour");
    }
}

main()
