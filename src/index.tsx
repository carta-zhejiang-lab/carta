import * as React from "react";
import {createRoot} from "react-dom/client";
import {FocusStyleManager, OverlaysProvider} from "@blueprintjs/core";
import axios from "axios";

import {ApiService} from "services";

// Pre-load static assets
import allMaps from "./static/allmaps.png";
import gammaPng from "./static/equations/gamma.png";
import linearPng from "./static/equations/linear.png";
import logPng from "./static/equations/log.png";
import powerPng from "./static/equations/power.png";
import sqrtPng from "./static/equations/sqrt.png";
import squaredPng from "./static/equations/squared.png";
import {App} from "./App";

import "./index.scss";

for (const val of [allMaps, linearPng, logPng, sqrtPng, squaredPng, gammaPng, powerPng]) {
    new Image().src = val;
}

// Remove focus on tabs
FocusStyleManager.onlyShowFocusOnTabs();

// GoldenLayout requires these in the global namespace
window["React"] = React; // tslint:disable-line
window["createRoot"] = createRoot; // tslint:disable-line

async function fetchConfig() {
    const baseUrl = window.location.href.replace(window.location.search, "").replace("index.html", "");
    const configUrl = baseUrl + (baseUrl.endsWith("/") ? "" : "/") + "config";
    try {
        const res = await axios.get(configUrl);
        ApiService.SetRuntimeConfig(res?.data);
    } catch (e) {
        console.log("No runtime config provided. Using default configuration");
        ApiService.SetRuntimeConfig({});
    }

    const container = document.getElementById("root") as HTMLElement;
    const root = createRoot(container);
    root.render(
        <OverlaysProvider>
            <App />
        </OverlaysProvider>
    );
}

fetchConfig().then(() => {
    console.log("Configuration complete. Rendering frontend");
});
