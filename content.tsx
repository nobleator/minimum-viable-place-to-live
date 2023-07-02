import type { PlasmoCSConfig, PlasmoGetInlineAnchorList } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: ["https://www.zillow.com/*"],
}

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () =>
  document.querySelectorAll(`address`)

// Use this to optimize unmount lookups
export const getShadowHostId = ({e}) => `${e.tagName}-mvptl-uid`

const ZillowOverlay = ({anchor}) => {
    const address = anchor.element.innerText; 

    return (
        <span
        className="hw-top"
        style={{
            borderRadius: 4,
            padding: 4,
            background: "pink"
        }}>
        { address }
        </span>
    )
}

export default ZillowOverlay