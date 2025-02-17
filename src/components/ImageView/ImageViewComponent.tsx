import * as React from "react";
import ReactResizeDetector from "react-resize-detector";
import {NonIdealState, Spinner} from "@blueprintjs/core";
import $ from "jquery";
import {action, autorun, computed, makeObservable, observable} from "mobx";
import {observer} from "mobx-react";

import {Point2D, Zoom} from "models";
import {AppStore, DefaultWidgetConfig, HelpType, Padding, WidgetProps} from "stores";
import {toFixed} from "utilities";

import {ImagePanelComponent} from "./ImagePanel/ImagePanelComponent";

import "./ImageViewComponent.scss";

export enum ImageViewLayer {
    RegionCreating = "regionCreating",
    Catalog = "catalog",
    RegionMoving = "regionMoving"
}

export function getImageViewCanvas(padding: Padding, colorbarPosition: string, backgroundColor: string = "rgba(255, 255, 255, 0)") {
    const appStore = AppStore.Instance;
    const config = appStore.imageViewConfigStore;
    const overlay = appStore.overlayStore;

    const imageViewCanvas = document.createElement("canvas") as HTMLCanvasElement;
    imageViewCanvas.width = overlay.fullViewWidth * appStore.pixelRatio;
    imageViewCanvas.height = overlay.fullViewHeight * appStore.pixelRatio;
    const ctx = imageViewCanvas.getContext("2d");
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, imageViewCanvas.width, imageViewCanvas.height);
    config.visibleImages.forEach((frame, index) => {
        const column = index % config.numImageColumns;
        const row = Math.floor(index / config.numImageColumns);
        const panelCanvas = getPanelCanvas(column, row, padding, colorbarPosition, backgroundColor);
        if (panelCanvas) {
            ctx.drawImage(panelCanvas, overlay.viewWidth * column * appStore.pixelRatio, overlay.viewHeight * row * appStore.pixelRatio);
        }
    });

    return imageViewCanvas;
}

export function getPanelCanvas(column: number, row: number, padding: Padding, colorbarPosition: string, backgroundColor: string = "rgba(255, 255, 255, 0)") {
    const panelElement = $(`#image-panel-${column}-${row}`)?.first();
    if (!panelElement?.length) {
        return null;
    }
    const rasterCanvas = panelElement.find(".raster-canvas")?.[0] as HTMLCanvasElement;
    const contourCanvas = panelElement.find(".contour-canvas")?.[0] as HTMLCanvasElement;
    const overlayCanvas = panelElement.find(".overlay-canvas")?.[0] as HTMLCanvasElement;
    const catalogCanvas = panelElement.find(".catalog-canvas")?.[0] as HTMLCanvasElement;
    const vectorOverlayCanvas = panelElement.find(".vector-overlay-canvas")?.[0] as HTMLCanvasElement;

    if (!rasterCanvas || !contourCanvas || !overlayCanvas || !vectorOverlayCanvas) {
        return null;
    }

    const colorbarCanvas = panelElement.find(".colorbar-stage")?.children()?.children("canvas")?.[0] as HTMLCanvasElement;
    const beamProfileCanvas = panelElement.find(".beam-profile-stage")?.children()?.children("canvas")?.[0] as HTMLCanvasElement;
    const regionCanvas = panelElement.find(".region-stage")?.children()?.children("canvas")?.[0] as HTMLCanvasElement;

    const appStore = AppStore.Instance;
    const composedCanvas = document.createElement("canvas") as HTMLCanvasElement;
    composedCanvas.width = overlayCanvas.width;
    composedCanvas.height = overlayCanvas.height;

    const ctx = composedCanvas.getContext("2d");
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, composedCanvas.width, composedCanvas.height);
    ctx.drawImage(rasterCanvas, padding.left * appStore.pixelRatio, padding.top * appStore.pixelRatio);
    ctx.drawImage(contourCanvas, padding.left * appStore.pixelRatio, padding.top * appStore.pixelRatio);
    ctx.drawImage(vectorOverlayCanvas, padding.left * appStore.pixelRatio, padding.top * appStore.pixelRatio);
    if (colorbarCanvas) {
        let xPos, yPos;
        switch (colorbarPosition) {
            case "top":
                xPos = 0;
                yPos = padding.top * appStore.pixelRatio - colorbarCanvas.height;
                break;
            case "bottom":
                xPos = 0;
                yPos = overlayCanvas.height - colorbarCanvas.height - AppStore.Instance.overlayStore.colorbarHoverInfoHeight * appStore.pixelRatio;
                break;
            case "right":
            default:
                xPos = padding.left * appStore.pixelRatio + rasterCanvas.width;
                yPos = 0;
                break;
        }
        ctx.drawImage(colorbarCanvas, xPos, yPos);
    }

    if (beamProfileCanvas) {
        ctx.drawImage(beamProfileCanvas, padding.left * appStore.pixelRatio, padding.top * appStore.pixelRatio);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(overlayCanvas, 0, 0);

    if (catalogCanvas) {
        ctx.drawImage(catalogCanvas, padding.left * appStore.pixelRatio, padding.top * appStore.pixelRatio);
    }

    if (regionCanvas) {
        ctx.drawImage(regionCanvas, padding.left * appStore.pixelRatio, padding.top * appStore.pixelRatio);
    }

    return composedCanvas;
}

@observer
export class ImageViewComponent extends React.Component<WidgetProps> {
    public static get WIDGET_CONFIG(): DefaultWidgetConfig {
        return {
            id: "image-view",
            type: "image-view",
            minWidth: 500,
            minHeight: 500,
            defaultWidth: 600,
            defaultHeight: 600,
            title: "Image view",
            isCloseable: false,
            helpType: HelpType.IMAGE_VIEW
        };
    }

    private imagePanelRefs: any[];
    private ratioIndicatorTimeoutHandle;
    private cachedImageSize: Point2D;
    private cachedGridSize: Point2D;

    @observable showRatioIndicator: boolean = false;

    onResize = (width: number, height: number) => {
        if (width > 0 && height > 0) {
            const appStore = AppStore.Instance;
            const requiresAutoFit = appStore.preferenceStore.zoomMode === Zoom.FIT && appStore.overlayStore.fullViewWidth <= 1 && appStore.overlayStore.fullViewHeight <= 1;
            appStore.setImageViewDimensions(width, height);
            if (requiresAutoFit) {
                this.imagePanelRefs?.forEach(imagePanelRef => imagePanelRef?.fitZoomFrameAndRegion());
            }
        }
    };

    @action setRatioIndicatorVisible = (val: boolean) => {
        this.showRatioIndicator = val;
    };

    constructor(props: WidgetProps) {
        super(props);
        makeObservable(this);

        this.imagePanelRefs = [];
        const appStore = AppStore.Instance;

        autorun(() => {
            const imageSize = {x: appStore.overlayStore.renderWidth, y: appStore.overlayStore.renderHeight};
            const imageGridSize = {x: appStore.imageViewConfigStore.numImageColumns, y: appStore.imageViewConfigStore.numImageRows};
            // Compare to cached image size to prevent duplicate events when changing frames
            const imageSizeChanged = !this.cachedImageSize || this.cachedImageSize.x !== imageSize.x || this.cachedImageSize.y !== imageSize.y;
            const gridSizeChanged = !this.cachedGridSize || this.cachedGridSize.x !== imageGridSize.x || this.cachedGridSize.y !== imageGridSize.y;
            if (imageSizeChanged || gridSizeChanged) {
                this.cachedImageSize = imageSize;
                this.cachedGridSize = imageGridSize;
                clearTimeout(this.ratioIndicatorTimeoutHandle);
                this.setRatioIndicatorVisible(true);
                this.ratioIndicatorTimeoutHandle = setTimeout(() => this.setRatioIndicatorVisible(false), 1000);
            }
        });
    }

    private collectImagePanelRef = ref => {
        this.imagePanelRefs.push(ref);
    };

    @computed get panels() {
        const appStore = AppStore.Instance;
        const config = appStore.imageViewConfigStore;
        const visibleImages = config.visibleImages;
        this.imagePanelRefs = [];
        if (!visibleImages) {
            return [];
        }
        return visibleImages.map((image, index) => {
            const column = index % config.numImageColumns;
            const row = Math.floor(index / config.numImageColumns);

            return <ImagePanelComponent ref={this.collectImagePanelRef} key={`${image?.type}-${image?.store?.id}`} docked={this.props.docked} image={image} row={row} column={column} />;
        });
    }

    render() {
        const appStore = AppStore.Instance;
        const config = appStore.imageViewConfigStore;

        let divContents: React.ReactNode | React.ReactNode[];
        if (!this.panels.length) {
            divContents = <NonIdealState icon={"folder-open"} title={"No file loaded"} description={"Load a file using the menu"} />;
        } else if (!appStore.astReady) {
            divContents = <NonIdealState icon={<Spinner className="astLoadingSpinner" />} title={"Loading AST Library"} />;
        } else {
            const effectiveImageSize = {x: Math.floor(appStore.overlayStore.renderWidth), y: Math.floor(appStore.overlayStore.renderHeight)};
            const ratio = effectiveImageSize.x / effectiveImageSize.y;
            const gridSize = {x: config.numImageColumns, y: config.numImageRows};

            let gridSizeNode: React.ReactNode;
            if (gridSize.x * gridSize.y > 1) {
                gridSizeNode = (
                    <p>
                        {gridSize.x} &times; {gridSize.y}
                    </p>
                );
            }
            divContents = (
                <React.Fragment>
                    {this.panels}
                    <div style={{opacity: this.showRatioIndicator ? 1 : 0}} className={"image-ratio-popup"}>
                        <p>
                            {effectiveImageSize.x} &times; {effectiveImageSize.y} ({toFixed(ratio, 2)})
                        </p>
                        {gridSizeNode}
                    </div>
                </React.Fragment>
            );
        }

        return (
            <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} refreshMode={"throttle"} refreshRate={33}>
                <div className="image-view-div" style={{gridTemplateColumns: `repeat(${config.numImageColumns}, auto)`, gridTemplateRows: `repeat(${config.numImageRows}, 1fr)`}} data-testid="viewer-div">
                    {divContents}
                </div>
            </ReactResizeDetector>
        );
    }
}
