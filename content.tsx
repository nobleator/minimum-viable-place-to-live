import type { PlasmoCSConfig, PlasmoGetInlineAnchorList } from "plasmo";
import axios from 'axios';
import Bottleneck from "bottleneck";
import { useStorage } from "@plasmohq/storage/hook";
import { STORAGE_KEY } from './options';

const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1500
});

export const config: PlasmoCSConfig = {
    matches: ["https://www.zillow.com/*"],
}

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () =>
    document.querySelectorAll(`address`)

// Use this to optimize unmount lookups
export const getShadowHostId = ({element}) => `mvptl-uid`

const getGeocodedData = async (address) => {
    const url = encodeURI(`https://geocode.maps.co/search?q=${address}`);
    const response = await axios.get(url);
    return response.data;
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
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    const {value, done} = await reader.read();
    const jsonValue = JSON.parse(value);
    const count = jsonValue.elements[0].tags["total"];
    return count > 0;
}

const getGeocodedDataCallback = (anchorData, setAnchorData) => {
    const limitedGeocodedData = limiter.wrap(getGeocodedData);
    limitedGeocodedData(anchorData.address)
        .then((data) => {
            const state = { ...anchorData };
            // TODO: only store required fields (lat, lon)
            state.data =  { lat: data[0].lat, lon: data[0].lon };
            return setAnchorData(state);
        });
}

const evaluateCallback = (treeData, anchorData, setAnchorData) => {
    const limitedEval = limiter.wrap(evaluate);
    if (anchorData && anchorData.data && anchorData.data.length > 0) {
        limitedEval(anchorData, treeData)
            .then((evalResult) => {
                const state = { ...anchorData };
                state.lastEvalTime = Date.now();
                state.evalResult = evalResult;
                return setAnchorData(state);
            });
    }
}

const ZillowOverlay = ({anchor}) => {
    const [treeData, _] = useStorage(STORAGE_KEY);
    const anchorKey = anchor.element.innerText;
    const [anchorData, setAnchorData] = useStorage(anchorKey, {
        key: anchorKey,
        address: anchor.element.innerText,
        data: null,
        evalResult: null,
        lastEvalTime: null,
    });
    // TODO: anchorData is not being persisted properly between page loads
    if (anchorKey && !anchorData.data) {
        getGeocodedDataCallback(anchorData, setAnchorData);
    } 
    if (anchorData.data && (anchorData.evalResult == null || anchorData.lastEvalTime < treeData.lastModified)) {
        evaluateCallback(treeData, anchorData, setAnchorData);
    }

    return (
        <span
        className="hw-top"
        style={{
            borderRadius: 4,
            padding: 4,
            background: (anchorData && anchorData.evalResult) ? "palegreen" : "pink"
        }}>
        { (!anchorData || anchorData.evalResult == null) ? "?" : anchorData.evalResult ? "✓" : "x" }
        </span>
    )
}

export default ZillowOverlay