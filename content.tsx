import type { PlasmoCSConfig, PlasmoGetInlineAnchorList } from "plasmo";
import { usePort } from "@plasmohq/messaging/hook";
import { useState } from "react";

export const config: PlasmoCSConfig = {
    matches: ["https://www.zillow.com/*"],
}

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () =>
    document.querySelectorAll(`address`)

// Use this to optimize unmount lookups
export const getShadowHostId = ({element}) => `mvptl-uid`

const ZillowOverlay = ({anchor}) => {
    const anchorKey = anchor.element.innerText;
    // Note: data port and background worker are required becase storage is not persisted per-anchor within content scripts
    const dataPort = usePort("data");
    const [anchorData, setAnchorData] = useState(undefined);
    dataPort.listen((msg) => {
        console.log(anchorKey, "msg received: ", msg);
        if (anchorKey == msg.data.key) {
            setAnchorData(msg.data);
        }
    });
    // TODO: Why is the timeout needed here? Receiving the following error without it:
    // uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'postMessage') at Object.send
    setTimeout(() => {
        if (!anchorData) {
            dataPort.send({
                key: anchorKey,
                address: anchor.element.innerText,
            });
        }
    }, 1);

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