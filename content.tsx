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

const getGeocodedDataCallback = (address, setGeocodedData) => {
    const limitedGeocodedData = limiter.wrap(getGeocodedData);
    limitedGeocodedData(address)
        .then((data) => {
            return setGeocodedData(data);
        });
}

const evaluateTree = (anchorData) => {
    const [treeData, _] = useStorage(STORAGE_KEY);
    if (anchorData) {
        const lat = anchorData[0].lat;
        const lon = anchorData[0].lon;
        return `${lat} | ${lon} | ${treeData[0].operator}`;
    }
    return "...";
}

const ZillowOverlay = ({anchor}) => {
    const anchorKey = anchor.element.innerText;
    const [anchorData, setAnchorData] = useStorage(anchorKey);
    if (!anchorData) {
        getGeocodedDataCallback(anchorKey, setAnchorData);
    }

    return (
        <span
        className="hw-top"
        style={{
            borderRadius: 4,
            padding: 4,
            background: "pink"
        }}>
        { evaluateTree(anchorData) }
        </span>
    )
}

export default ZillowOverlay