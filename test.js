#!/usr/bin/env node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const axios = require('axios');
var fs = require('fs');

var user = "admin_CPI"
var password = "adminCPI"

var products = ""

async function getEBSProducts() {
    console.log("ebs get");

    var url = 'https://ebs50.local/api/Products';

    const res = await axios({
        method: 'get',
        url: url,
        headers: {
            "x-api-key": "DDDB29C5-3DD0-4F71-8E1B-C737D9328BF6"
        }
    })
    .then(function ok(json) {
        console.log("get ebs data: " + JSON.stringify(json.data))
        let i = 0;
        let arraytmp = []
        json.data.forEach(element => {
            arraytmp[0] = element
            console.log(i);
            console.log(JSON.stringify(element));
            i++
        });
    })
    .catch(function fail(error) {
        console.log(error + " /  probleme get ebs");
    });
}

getEBSProducts()