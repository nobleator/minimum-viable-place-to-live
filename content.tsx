import type { PlasmoCSConfig, PlasmoGetInlineAnchorList } from "plasmo";
import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";
import { process } from "~data";

export const config: PlasmoCSConfig = {
    matches: ["https://www.zillow.com/*"],
    // TODO: test these
    all_frames: false,
    world: "MAIN",
}

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () =>
    document.querySelectorAll(`address`)

// Use this to optimize unmount lookups
export const getShadowHostId = ({element}) => `mvptl-uid`

const hashCode = (str) => [...str].reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);

const ZillowOverlay = ({anchor}) => {
    const address = anchor.element.innerText;
    const anchorKey = `mvptl-${hashCode(address)}`;
    const [anchorData, setAnchorData] = useStorage({
        key: anchorKey,
        instance: new Storage({
            area: "local"
        })
    }, (v) => !v || v === undefined ? {
        'key': anchorKey,
        'address': address,
        'lat': null,
        'lon': null,
        'evalResult': null,
        'lastEvalTime': null,
    } : v);
    
    // chrome.storage.local does not persist but window.localStorage does
    // However, localStorage is not a valid option for Plasmo Storage area
    const result = JSON.parse(window.localStorage.getItem(anchorKey));
    if (!result && address) {
        console.log(`anchorData is missing for ${address}: ${result}`);
        process(anchorData)
            .then((result) => {
                window.localStorage.setItem(anchorKey, JSON.stringify(result));
                setAnchorData(result);
            });
    } else { // TODO: only conditionally call this set func?
        setAnchorData(result);
    }

    return (
        <span
        className="hw-top"
        style={{
            borderRadius: 4,
            padding: 4,
            background: (anchorData && anchorData.evalResult) ? "palegreen" : "pink"
            // background: "palegreen"
        }}>
        { (!anchorData || anchorData.evalResult == null) ? "?" : anchorData.evalResult ? "✓" : "x" }
        {/* { `${anchorKey} @ ${hailingFrequency.a}` } */}
        {/* { `${anchorKey}` } */}
        </span>
    )
}

export default ZillowOverlay