#!/usr/bin/env node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const axios = require('axios');
const fs = require('fs');
const { exit } = require('process');
const _ = require('underscore');
const config = JSON.parse(fs.readFileSync("./config.json"));
const configRfridge = JSON.parse(fs.readFileSync('/home/pi/.config/rfridge.fridge/config.json'));

async function main() {
    const urlRfridgeApi = config["rfridge"]["api"];
    const aPiKeyRfridge = { "x-api-key": configRfridge["apiKey"] };

    const urlProtoApi = config["esl"]["api"] + 'currentPlanogram/';
    const authProtoApi = { username: config["esl"]["username"], password: config["esl"]["password"] };

    const urlEbsApi = config["ebs"]["api"] + 'Products/';
    const aPiKeyEbs = { "x-api-key": config["ebs"]["apikey"] };

    let currentPlanogram;
    let fridgeId;
    let resultEBS;
    let resultFridge;

    try {
        resultFridge = await httpRequest(urlRfridgeApi + 'fridges', 'get', null, aPiKeyRfridge, null);
        fridgeId = resultFridge[0]["id"];

        resultEBS = await httpRequest(urlEbsApi, 'get', null, aPiKeyEbs, null);
        currentPlanogram = await httpRequest(urlProtoApi + fridgeId, 'get', null, null, authProtoApi);
    } catch (error) {
        console.log(error);
        exit(1);
    }

    if(!currentPlanogram) {
        exit(1);
    }

    currentPlanogram.sort((a,b) => (a.ProductId > b.ProductId) ? 1 : ((b.ProductId > a.ProductId) ? -1 : 0));
    resultEBS.sort((a,b) => (a.ProductId > b.ProductId) ? 1 : ((b.ProductId > a.ProductId) ? -1 : 0));

    if (!_.isEqual(currentPlanogram, resultEBS)) {
        const itemsAction = setAction(currentPlanogram, resultEBS);

        for (const item of itemsAction[0]) {
            try {
                await sleep(2000);
                await httpRequest(urlEbsApi + item.ProductId, 'delete', null, aPiKeyEbs, null);
            } catch (error) {
                exit(1);
            }
        }

        for (const item of itemsAction[1] ) {
            try {
                await sleep(2000);
                await httpRequest(urlEbsApi, 'post', [item], aPiKeyEbs, null);
            } catch (error) {
                exit(1);
            }
        }
    } else {
        console.log("json équivalent pas besoin de mettre à jour");
    }
}

main();

function httpRequest(url, method, data, headers, auth) {
    return axios({
        method: method,
        url: url,
        data: data,
        headers: headers,
        auth: auth,
    })
        .then((response) => response.data)
        .catch((error) => console.log(error));
}

function setAction(currentPlanogram, resultEBS) {
    let itemsAction = [];

    //To delete
    itemsAction[0] = resultEBS.filter((itemEbs) => {
       const found = currentPlanogram.filter((itemPlano) => itemPlano.ProductId === itemEbs.ProductId);
       return !found[0];
    });

    //TO post
    itemsAction[1] = currentPlanogram.filter((itemPlano) => {
        const found = resultEBS.filter((itemEbs) => itemPlano.ProductId === itemEbs.ProductId);

        if(!found[0]) {
            return true;
        }

        return !_.isEqual(itemPlano, found[0]);
    });

    return itemsAction;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}