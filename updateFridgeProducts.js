#!/usr/bin/env node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const axios = require('axios');
var fs = require('fs');

var user = "admin_CPI"
var password = "adminCPI"
var products = ""

async function getTest() {
    console.log("getTest")

    const res = await axios.get('https://debian.local:18443/esls', {
        auth: {
            username: user,
            password: password
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

    var config = JSON.parse(fs.readFileSync("/home/"+require("os").userInfo().username+"/.config/rfridge.fridge/config.json"));
    console.log(config["apiKey"]);

    const fridge = axios({
        method: 'get',
        url: 'https://staging.rfridge.fr:8443/fridges',
        headers: { 
            "x-api-key": config["apiKey"]
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

async function getESLProductsOfPlano() {

    //var base64encodedData = Buffer.from(user + ':' + password).toString('base64');

    console.log("getESLProductsOfPlano")

    const res = await axios({
        method: 'get',
        url: 'https://192.168.1.210/api/Products',
        headers: { 
            "x-api-key": "DDDB29C5-3DD0-4F71-8E1B-C737D9328BF6"
        }
    })
    .then(function ok(jsonData) {
        console.log("getESLProductsOfPlano: get ebs data: " +  JSON.stringify(jsonData.data))
        let i = 0;
        let arraytmp = []
        /*jsonData.data.forEach(element => {
            arraytmp[0] = element
            console.log(i)
            console.log(JSON.stringify(element))
            
            deleteEBSProducts(arraytmp, i)
            i++
        });*/
    })
    .catch(function fail(error) {
        console.log("getESLProductsOfPlano error: " + error)
    });
}


async function postEBSProducts() {

    var base64encodedData = Buffer.from(user + ':' + password).toString('base64');

    console.log("getESLProductsOfPlano")

    var config = JSON.parse(fs.readFileSync("/home/"+require("os").userInfo().username+"/.config/rfridge.fridge/config.json"));
    console.log(config["apiKey"]);

    const fridge = axios({
        method: 'get',
        url: 'https://staging.rfridge.fr:8443/fridges',
        headers: { 
            "x-api-key": config["apiKey"]
        }
    })
    .then(function ok(jsonFridge) {
        console.log("get fridge data: " +  JSON.stringify(jsonFridge.data))
        let idFridge = jsonFridge.data[0]["id"]
        console.log("get id: " +  JSON.stringify(idFridge))

        const res = axios.get('https://debian.local:18443/exportJSON/'+idFridge, {
        auth: {
            username: user,
            password: password
        }
        })
        .then(function ok(jsonData) {
            console.log("get products: " +  JSON.stringify(jsonData.data))
            console.log("postEBSProducts");
            const res2 = axios({
                method: 'post',
                url: 'https://192.168.1.210/api/Products',
                data: jsonData.data,
                headers: { 
                    "x-api-key": "DDDB29C5-3DD0-4F71-8E1B-C737D9328BF6"
                }
            })
            .then(function ok(jsonData2) {
                console.log("post ebs data: " +  JSON.stringify(jsonData2.data))
                
            })
            .catch(function fail(error) {
                console.log(error)
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

    if (jsonData)
    console.log("deleteEBSProducts");
    const res = await axios({
        method: 'delete',
        url: 'https://192.168.1.210/api/Products',
        headers: { 
            "x-api-key": "DDDB29C5-3DD0-4F71-8E1B-C737D9328BF6"
        },
        data: jsonData
    })
    .then(function ok(jsonData) {
        console.log(i + " / delete ebs data: " +  JSON.stringify(jsonData.data))
    })
    .catch(function fail(error) {
        console.log(error)
        if (jsonData.length != 0) {
            getESLProductsOfPlano()
        }
    });
}

/*
async function test() {

    const res = await axios.get('https://httpbin.org/basic-auth/foo/bar', {
        // Axios looks for the `auth` option, and, if it is set, formats a
        // basic auth header for you automatically.
        auth: {
            username: 'foo',
            password: 'bar'
        }
    })
    .then(function ok(jsonData) {
        console.log("test: test esls");
        console.log(jsonData.data);
        console.log("test: end test esls");
        })
    .catch(function fail(error) {
        console.log("test:  error ////");
        console.log(error)
    });
}
*/
//test()

getTest()
getESLProductsOfPlano()
getFridges()
postEBSProducts()
