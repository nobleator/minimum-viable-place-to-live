import type { PlasmoMessaging } from "@plasmohq/messaging";
import { Storage } from "@plasmohq/storage";
import Bottleneck from "bottleneck";
// TODO: rename STORAGE_KEY to be more specific
import { STORAGE_KEY } from "~options";

const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1500
});

const getGeocodedData = async (address) => {
    console.log(`geocoding ${address}`);
    try {
        const url = encodeURI(`https://geocode.maps.co/search?q=${address}`);
        const response = await fetch(url);
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
            query += "(";
            query += evaluateNodes(node.children, targetLat, targetLon);
            query += ")";
        } else if (node.type === "ValueNode") {
            // TODO: elements have 2 tags, not just 1, need to map "name" to user input rather than hardcoding
            query += `nwr["name"="${node.tag}"](around:${node.value}, ${targetLat}, ${targetLon});`
        }
    });
    return query;
}

const buildOverpassQuery = (anchorData, treeData) => {
    let query = "[out:json];";
    query += evaluateNodes(treeData.data, anchorData.data[0].lat, anchorData.data[0].lon);
    query += ";out count;";
    return query;
}

const evaluate = async (anchorData, treeData) => {
    const query = buildOverpassQuery(anchorData, treeData);
    const url = 'https://www.overpass-api.de/api/interpreter';
    // TODO debounce or throttle these requests
    const response = await fetch(url, {
        "body": `data=${encodeURIComponent(query)}`,
        "method": "POST",
    });
    const count = await response.json().then(json => {
        return json.elements[0].tags["total"];
    });
    return count > 0;
}

const needsGeocodingAndEvaluation = (anchorData) => {
    return !anchorData ||
        (anchorData && !anchorData.geocodeData);
}

const needsEvaluation = (anchorData, treeData) => {
    return anchorData &&
        anchorData.geocodeData &&
        (!anchorData.evalResult ||
            anchorData.lastEvalTime < treeData.lastModified);
}

const handler: PlasmoMessaging.PortHandler = async (req, res) => {
    // Note: Can't use hooks within background worker as it is not a React component
    const storage = new Storage();
    const treeData: any = await storage.get(STORAGE_KEY);
    const anchorKey = req.body.key;
    const address = req.body.address;
    let anchorData: any = await storage.get(anchorKey);
    const limitedGeocodedData = limiter.wrap(getGeocodedData);
    const limitedEval = limiter.wrap(evaluate);
    if (needsGeocodingAndEvaluation(anchorData)) {
        anchorData = {
            key: anchorKey,
            address: address,
            geocodedData: null,
            evalResult: null,
            lastEvalTime: null,
        };
        const geocodedData = await limitedGeocodedData(anchorData.address)
            .then(x => { return x; });
        anchorData.geocodedData = geocodedData;
        const evalResult = await limitedEval(anchorData, treeData)
            .then(x => { return x; });
        anchorData.evalResult = evalResult;
        anchorData.lastEvalTime = Date.now();
        await storage.set(anchorKey, anchorData);
    } else if (needsEvaluation(anchorData, treeData)) {
        const evalResult = await limitedEval(anchorData, treeData)
            .then(x => { return x; });
        anchorData.evalResult = evalResult;
        anchorData.lastEvalTime = Date.now();
        await storage.set(anchorKey, anchorData);
    }

    res.send({
        data: anchorData
    });
}
 
export default handler