import { Storage } from "@plasmohq/storage";
import Bottleneck from "bottleneck";
// TODO: rename STORAGE_KEY to be more specific to this project
import { STORAGE_KEY } from "~popup";

export {}
 
const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1000
});

const getGeocodedData = async (address) => {
    console.log(`geocoding ${address}`);
    try {
        const url = encodeURI(`https://geocode.maps.co/search?q=${address}`);
        const response = await fetch(url);
        console.log("geocoding response", response);
        const data = await response.json().then(json => {
            // TODO: filter JSON down to lat/lon only and single entry
            return json;
        });
        return data;
    } catch (err) {
        console.error(err);
        return undefined;
    }
}

const evaluateNodes = (nodes, targetLat, targetLon) => {
    let query = "";
    nodes.forEach((node) => {
        if (node.type === "ConditionalNode") {
            if (node.children.length > 1) {
                query += "(";
                query += evaluateNodes(node.children, targetLat, targetLon);
                query += ")";
            } else {
                query += evaluateNodes(node.children, targetLat, targetLon);
            }
        } else if (node.type === "ValueNode") {
            // TODO: elements have 2 tags, not just 1, need to map "name" to user input rather than hardcoding
            // Tags are searched case insensitive via the "~"" and ",i" parameters
            query += `nwr["${node.tagKey}"~"${node.tagValue}",i](around:${node.value}, ${targetLat}, ${targetLon});`
        }
    });
    return query;
}

const buildOverpassQuery = (anchorData, treeData) => {
    let query = "[out:json];";
    query += evaluateNodes(treeData.data, anchorData.lat, anchorData.lon);
    query += ";out count;";
    console.log("overpass query", query);
    return query;
}

const evaluate = async (anchorData, treeData) => {
    console.log(`evaluating ${anchorData.address}`);
    const query = buildOverpassQuery(anchorData, treeData);
    const url = 'https://www.overpass-api.de/api/interpreter';
    // TODO debounce or throttle these requests
    const response = await fetch(url, {
        "body": `data=${encodeURIComponent(query)}`,
        "method": "POST",
    });
    const count = await response.json().then(json => {
        if (json && json.elements && json.elements.length > 0) {
            return json.elements[0].tags["total"];
        } else {
            return 0;
        }
    });
    console.log("evalution result/count", count);
    return count > 0;
}

const needsGeocodingAndEvaluation = (anchorData) => {
    console.log(`checking for geocoding need: ${JSON.stringify(anchorData)}`);
    return !anchorData ||
        (anchorData && !(anchorData.lat || anchorData.lon));
}

const needsEvaluation = (anchorData, treeData) => {
    console.log(`checking for evaluation need: ${JSON.stringify(anchorData)}`);
    return anchorData &&
        anchorData.geocodeData &&
        (!anchorData.evalResult ||
            anchorData.lastEvalTime < treeData.lastModified);
}

const process = async (anchorData) => {
    console.log("processing", anchorData)
    const storage = new Storage();
    const treeData: any = await storage.get(STORAGE_KEY);
    console.log("treeData", treeData)
    const limitedGeocodedData = limiter.wrap(getGeocodedData);
    const limitedEval = limiter.wrap(evaluate);
    if (needsGeocodingAndEvaluation(anchorData)) {
        console.log("geocoding required", anchorData);
        const geocodedData = await limitedGeocodedData(anchorData.address)
            .then(x => { return x; });
        console.log("geocoding result", geocodedData);
        if (geocodedData && geocodedData.length > 0) {
            anchorData.lat = geocodedData[0].lat;
            anchorData.lon = geocodedData[0].lon;
            const evalResult = await limitedEval(anchorData, treeData)
                .then(x => { return x; });
            console.log("eval result after geocoding", evalResult);
            anchorData.evalResult = evalResult;
            anchorData.lastEvalTime = Date.now();
        }
    } else if (needsEvaluation(anchorData, treeData)) {
        const evalResult = await limitedEval(anchorData, treeData)
            .then(x => { return x; });
        console.log("eval result without geocoding", evalResult);
        anchorData.evalResult = evalResult;
        anchorData.lastEvalTime = Date.now();
    }
    console.log("anchorData prior to return", anchorData);
    return anchorData;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("message received", message);
    if (message && message.anchorData) {
        process(message.anchorData).then(sendResponse);
        // This return indicates the response will be async
        return true;
    }
    return false;
});