import React from "react";
import { useSelector } from "react-redux";

import { IReduxState } from "../../../app/types";

export default function SharedIframe() {
    const { active, url } = useSelector((state: IReduxState) => state["features/shared-iframe"] || { active: false });

    if (!active || !url) {
        return null;
    }

    return (
        <div id="shared-iframe-container" style={{ position: "absolute", inset: 0, zIndex: 5 }}>
            <iframe
                id="shared-iframe"
                src={url}
                style={{ width: "100%", height: "100%", border: "none" }}
                sandbox="allow-scripts allow-forms allow-popups allow-pointer-lock allow-same-origin"
                allow="fullscreen *; autoplay *"
            />
        </div>
    );
}
