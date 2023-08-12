import type { PlasmoCSConfig, PlasmoGetInlineAnchorList } from "plasmo";
import { useStorage } from "@plasmohq/storage/hook";

export const config: PlasmoCSConfig = {
    // matches: ["https://nobleator.github.io/"],
    matches: ["https://www.zillow.com/*"],
}

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () =>
    document.querySelectorAll(`address`)
    // document.querySelectorAll(`.post-title`)

// Use this to optimize unmount lookups
export const getShadowHostId = ({element}) => `mvptl-uid`

const hashCode = (str) => [...str].reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);

const process = async (anchorData) => {
    // Send to background script for processing
    const resp = await chrome.runtime.sendMessage({ anchorData: anchorData });
    return resp;
}

// Processing queue to mark anchors and prevent duplicate executions
const queue = new Set();

const ZillowOverlay = ({anchor}) => {
    const address = anchor.element.innerText;
    const anchorKey = hashCode(address);
    const [anchorData, setAnchorData] = useStorage(anchorKey,
        (v) => !v || v === undefined ? {
            'key': anchorKey,
            'address': address,
            // 'address': anchorKey > 0 ? "1600 Pennsylvania Avenue NW, Washington, DC" : "701 Constitution Ave. NW, Washington, DC",
            'lat': null,
            'lon': null,
            'evalResult': null,
            'lastEvalTime': null,
        } : v);
    
    console.log("anchorData", anchorData);

    if (!queue.has(anchorKey) && anchorData && anchorData.evalResult === null) {
        queue.add(anchorKey);
        (async () => process(anchorData).then(setAnchorData))();
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