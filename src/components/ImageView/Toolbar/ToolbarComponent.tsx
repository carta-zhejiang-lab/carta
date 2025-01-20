import * as React from "react";
import {CSSProperties} from "react";
import {AnchorButton, Button, ButtonGroup, Classes, Collapse, FormGroup, Icon, IconName, Menu, MenuDivider, MenuItem, Popover, PopoverInteractionKind, PopoverPosition, Position, Radio, RadioGroup, Switch, Tooltip} from "@blueprintjs/core";
import {CARTA} from "carta-protobuf";
import classNames from "classnames";
import {observer} from "mobx-react";

import {ImageViewComponent, ImageViewLayer} from "components";
import {AnnotationMenuComponent, ExportImageMenuComponent} from "components/Shared";
import {CustomIcon, CustomIconName} from "icons/CustomIcons";
import {AppStore} from "stores";
import {FrameScaling, FrameStore, RegionMode, RegionStore, RenderConfigStore} from "stores/Frame";
import {OverlayStore, SystemType} from "stores/OverlayStore/OverlayStore";
import {toFixed} from "utilities";
import {NewCustomIcon} from "icons/NewCustomIcons";

import "./ToolbarComponent.scss";
import {makeObservable, observable} from "mobx";

export class ToolbarComponentProps {
    docked: boolean;
    visible: boolean;
    frame: FrameStore;
    activeLayer: ImageViewLayer;
    onActiveLayerChange: (layer: ImageViewLayer) => void;
    onRegionViewZoom: (zoom: number) => void;
    onZoomToFit: () => void;
}

@observer
export class ToolbarComponent extends React.Component<ToolbarComponentProps> {
    private static readonly CoordinateSystemName = new Map<SystemType, string>([
        [SystemType.Auto, "WCS"],
        [SystemType.FK5, "FK5"],
        [SystemType.FK4, "FK4"],
        [SystemType.Galactic, "GAL"],
        [SystemType.Ecliptic, "ECL"],
        [SystemType.ICRS, "ICRS"]
    ]);

    private static readonly CoordinateSystemTooltip = new Map<SystemType, string>([
        [SystemType.Auto, "Automatically select the coordinate system based on file headers"],
        [SystemType.FK5, "FK5 coordinates, J2000.0 equinox"],
        [SystemType.FK4, "FK4 coordinates, B1950.0 equinox"],
        [SystemType.Galactic, "Galactic coordinates"],
        [SystemType.Ecliptic, "Ecliptic coordinates, J2000.0 equinox"],
        [SystemType.ICRS, "International Celestial Reference System"]
    ]);

    handleZoomToActualSizeClicked = () => {
        const zoom = 1.0;
        this.props.frame.setZoom(zoom);
        this.props.onRegionViewZoom(zoom);
    };

    handleZoomInClicked = () => {
        const frame = this.props.frame.spatialReference || this.props.frame;
        const zoom = frame.zoomLevel * 2.0;
        frame.setZoom(zoom, true);
        this.props.onRegionViewZoom(zoom);
    };

    handleZoomOutClicked = () => {
        const frame = this.props.frame.spatialReference || this.props.frame;
        const zoom = frame.zoomLevel / 2.0;
        frame.setZoom(zoom, true);
        this.props.onRegionViewZoom(zoom);
    };

    handleRegionTypeClicked = (type: CARTA.RegionType) => {
        this.props.frame.regionSet.setNewRegionType(type);
        this.props.frame.regionSet.setMode(RegionMode.CREATING);
    };

    handleCoordinateSystemClicked = (coordinateSystem: SystemType) => {
        OverlayStore.Instance.global.setSystem(coordinateSystem);
        this.props.frame.updateOffsetCenter();
    };

    private handleActiveLayerClicked = (layer: ImageViewLayer) => {
        this.props.onActiveLayerChange(layer);
        if (layer === ImageViewLayer.RegionCreating) {
            this.props.frame.regionSet.setMode(RegionMode.CREATING);
        } else {
            this.props.frame.regionSet.setMode(RegionMode.MOVING);
        }
    };

    private handlePanZoomShortCutClicked = () => {
        const widgetsStore = AppStore.Instance.widgetsStore;
        const parentType = ImageViewComponent.WIDGET_CONFIG.type;
        const settingsWidget = widgetsStore.floatingWidgets?.find(w => w.parentType === parentType);
        if (settingsWidget) {
            widgetsStore.removeFloatingWidget(settingsWidget.id);
        }
        // delay to wait for the settings widget tab status to reset
        setTimeout(() => {
            widgetsStore.createFloatingSettingsWidget("Image View", parentType, parentType);
        }, 0);
    };

    exportImageTooltip = () => {
        return (
            <span>
                <br />
                <i>
                    <small>
                        Background color is {AppStore.Instance.preferenceStore.transparentImageBackground ? "transparent" : "filled"}.<br />
                        {AppStore.Instance.preferenceStore.transparentImageBackground ? "Disable" : "Enable"} transparent image background in Preferences.
                        <br />
                    </small>
                </i>
            </span>
        );
    };

    componentDidMount(): void {
        AppStore.Instance.overlayStore.toggleLabels();
    }

    render() {
        const appStore = AppStore.Instance;
        const overlay = appStore.overlayStore;
        const frame = this.props.frame;
        const grid = overlay.grid;
        const styleProps: CSSProperties = {
            bottom: overlay.padding.bottom,
            right: "40px",
            top: "40px",
            height: "fit-content",
            // right: overlay.padding.right,
            // left: overlay.padding.left,
            opacity: this.props.visible ? 1 : 0,
            backgroundColor: "transparent",
            flexDirection: "column"
        };

        const className = classNames("image-toolbar", {docked: this.props.docked, [Classes.DARK]: appStore.darkTheme});

        const zoomLevel = frame.spatialReference && frame.spatialTransform ? frame.spatialReference.zoomLevel * frame.spatialTransform.scale : frame.zoomLevel;
        const currentZoomSpan = (
            <span>
                <br />
                <i>
                    <small>Current: {toFixed(zoomLevel, 2)}x</small>
                </i>
            </span>
        );
        const tooltipPosition: PopoverPosition = "left";

        const annotationMenu = (
            <Menu style={{padding: 0}}>
                <AnnotationMenuComponent handleRegionTypeClicked={this.handleRegionTypeClicked} />
            </Menu>
        );

        const popoverProps = {
            position: Position.RIGHT_BOTTOM,
            interactionKind: PopoverInteractionKind.CLICK
        };

        const regionMenu = (
            <Menu>
                {Array.from(RegionStore.AVAILABLE_REGION_TYPES).map(([type, text], index) => {
                    const regionIconString: IconName | CustomIconName = RegionStore.RegionIconString(type);
                    const regionIcon = RegionStore.IsRegionCustomIcon(type) ? <CustomIcon icon={regionIconString as CustomIconName} /> : (regionIconString as IconName);
                    return <MenuItem icon={regionIcon} text={text} onClick={() => this.handleRegionTypeClicked(type)} key={index} />;
                })}
                <MenuDivider></MenuDivider>
                <MenuItem icon={"annotation"} text={"Annotations"} popoverProps={popoverProps}>
                    {annotationMenu}
                </MenuItem>
            </Menu>
        );

        let coordinateSystem = overlay.global.system;

        const coordinateSystemMenu = (
            <Menu>
                <MenuItem text={ToolbarComponent.CoordinateSystemName.get(SystemType.Auto)} onClick={() => this.handleCoordinateSystemClicked(SystemType.Auto)} />
                <MenuItem text={ToolbarComponent.CoordinateSystemName.get(SystemType.FK5)} onClick={() => this.handleCoordinateSystemClicked(SystemType.FK5)} />
                <MenuItem text={ToolbarComponent.CoordinateSystemName.get(SystemType.FK4)} onClick={() => this.handleCoordinateSystemClicked(SystemType.FK4)} />
                <MenuItem text={ToolbarComponent.CoordinateSystemName.get(SystemType.Galactic)} onClick={() => this.handleCoordinateSystemClicked(SystemType.Galactic)} />
                <MenuItem text={ToolbarComponent.CoordinateSystemName.get(SystemType.Ecliptic)} onClick={() => this.handleCoordinateSystemClicked(SystemType.Ecliptic)} />
                <MenuItem text={ToolbarComponent.CoordinateSystemName.get(SystemType.ICRS)} onClick={() => this.handleCoordinateSystemClicked(SystemType.ICRS)} />
                <FormGroup inline={false} className="offset-group">
                    <Switch className="offset-switch" disabled={frame.isPVImage || frame.isSwappedZ || frame.isUVImage} checked={frame.isOffsetCoord} onChange={frame.toggleOffsetCoord} label="Offset" />
                    <Collapse isOpen={frame.isOffsetCoord}>
                        <Tooltip content="Set origin to current view center" position={Position.BOTTOM} hoverOpenDelay={300}>
                            <Button icon="locate" disabled={!frame.isOffsetCoord} onClick={() => frame.updateOffsetCenter()} />
                        </Tooltip>
                    </Collapse>
                </FormGroup>
            </Menu>
        );

        const regionIconString: IconName | CustomIconName = RegionStore.RegionIconString(frame.regionSet.newRegionType);
        const regionIcon = RegionStore.IsRegionCustomIcon(frame.regionSet.newRegionType) ? <CustomIcon icon={regionIconString as CustomIconName} /> : (regionIconString as IconName);

        const spatialMatchingEnabled = !!frame.spatialReference;
        const spectralMatchingEnabled = !!frame.spectralReference;
        const canEnableSpatialMatching = appStore.spatialReference !== frame;
        const canEnableSpectralMatching = appStore.spectralReference && appStore.spectralReference !== frame && frame.frameInfo.fileInfoExtended.depth > 1;
        const wcsButtonSuperscript = (spatialMatchingEnabled ? "x" : "") + (spectralMatchingEnabled ? "z" : "");
        const wcsButtonTooltipEntries = [];
        if (spectralMatchingEnabled) {
            wcsButtonTooltipEntries.push(`Spectral (${appStore.spectralMatchingType})`);
        }
        if (spatialMatchingEnabled) {
            wcsButtonTooltipEntries.push("Spatial");
        }
        const wcsButtonTooltip = wcsButtonTooltipEntries.join(" and ") || "None";

        const wcsMatchingMenu = (
            <Menu>
                <MenuItem
                    text={`Spectral (${appStore.spectralMatchingType}) and spatial`}
                    disabled={!canEnableSpatialMatching || !canEnableSpectralMatching}
                    active={spectralMatchingEnabled && spatialMatchingEnabled}
                    onClick={() => appStore.setMatchingEnabled(true, true)}
                />
                <MenuItem
                    text={`Spectral (${appStore.spectralMatchingType})  only`}
                    disabled={!canEnableSpectralMatching}
                    active={spectralMatchingEnabled && !spatialMatchingEnabled}
                    onClick={() => appStore.setMatchingEnabled(false, true)}
                />
                <MenuItem text="Spatial only" disabled={!canEnableSpatialMatching} active={!spectralMatchingEnabled && spatialMatchingEnabled} onClick={() => appStore.setMatchingEnabled(true, false)} />
                <MenuItem text="None" disabled={!canEnableSpatialMatching} active={!spectralMatchingEnabled && !spatialMatchingEnabled} onClick={() => appStore.setMatchingEnabled(false, false)} />
            </Menu>
        );
        const scalingMenu = (
            <RadioGroup
                className="scaling-radio-group"
                selectedValue={frame.renderConfig.scaling}
                onChange={(e: any) => {
                    frame.renderConfig.setScaling(+e.target.value);
                }}
            >
                <Radio label={RenderConfigStore.SCALING_TYPES.get(FrameScaling.LINEAR)} value={FrameScaling.LINEAR}></Radio>
                <Radio label={RenderConfigStore.SCALING_TYPES.get(FrameScaling.LOG)} value={FrameScaling.LOG}></Radio>
                <Radio label={RenderConfigStore.SCALING_TYPES.get(FrameScaling.SQRT)} value={FrameScaling.SQRT}></Radio>
                <Radio label={RenderConfigStore.SCALING_TYPES.get(FrameScaling.SQUARE)} value={FrameScaling.SQUARE}></Radio>
                <Radio label={RenderConfigStore.SCALING_TYPES.get(FrameScaling.GAMMA)} value={FrameScaling.GAMMA}></Radio>
                <Radio label={RenderConfigStore.SCALING_TYPES.get(FrameScaling.POWER)} value={FrameScaling.POWER}></Radio>
            </RadioGroup>
        );

        const baseFrame = this.props.frame;
        const numSourcesArray = appStore.catalogStore.visibleCatalogFiles.get(baseFrame)?.map(fileId => appStore.catalogStore.catalogCounts.get(fileId));
        const numSourcesIsZero = numSourcesArray?.every(element => element === 0);

        const catalogOverlayEnabled = appStore.activeLayer === ImageViewLayer.Catalog;
        const catalogSelectionDisabled = appStore.catalogNum === 0 || numSourcesIsZero === true;

        const handleDistanceMeasuringClicked = () => {
            this.handleActiveLayerClicked(ImageViewLayer.RegionCreating);
            appStore.activeFrame.regionSet.setNewRegionType(CARTA.RegionType.ANNRULER);
            appStore.activeFrame.regionSet.setMode(RegionMode.CREATING);
        };

        return (
            <ButtonGroup className={className} style={styleProps}>
                {appStore.toolbarExpanded && (
                    <React.Fragment>
                        {!frame.isPreview && (
                            <>
                                {/* <Tooltip
                                    position={tooltipPosition}
                                    content={
                                        <span>
                                            Ruler annotation
                                            <br />
                                            <i>
                                                <small>Click-and-drag to create geodesic curves.</small>
                                            </i>
                                        </span>
                                    }
                                >
                                    <AnchorButton icon={<CustomIcon icon="distanceMeasuring" />} active={appStore.activeLayer === ImageViewLayer.RegionCreating} onClick={handleDistanceMeasuringClicked} />
                                </Tooltip>
                                <Tooltip
                                    position={tooltipPosition}
                                    content={
                                        <span>
                                            Catalog selection
                                            <br />
                                            <i>
                                                <small>Click to select single catalog source</small>
                                            </i>
                                        </span>
                                    }
                                >
                                    <AnchorButton icon={"locate"} active={catalogOverlayEnabled} onClick={() => this.handleActiveLayerClicked(ImageViewLayer.Catalog)} disabled={catalogSelectionDisabled} />
                                </Tooltip>
                                {frame.regionSet.mode === RegionMode.CREATING && (
                                    <Popover popoverClassName="region-menu" content={regionMenu} position={Position.TOP} minimal={true}>
                                        <Tooltip
                                            position={tooltipPosition}
                                            content={
                                                <span>
                                                    Create{" "}
                                                    {frame.regionSet.isNewRegionAnnotation
                                                        ? `${RegionStore.AVAILABLE_ANNOTATION_TYPES.get(frame.regionSet.newRegionType).toLowerCase()} annotation`
                                                        : `${RegionStore.AVAILABLE_REGION_TYPES.get(frame.regionSet.newRegionType).toLowerCase()} region`}
                                                    <br />
                                                    <i>
                                                        <small>Click to select region or annotation type</small>
                                                    </i>
                                                </span>
                                            }
                                        >
                                            <AnchorButton
                                                icon={frame.regionSet.isNewRegionAnnotation ? "annotation" : regionIcon}
                                                active={appStore.activeLayer === ImageViewLayer.RegionCreating || appStore.activeFrame.regionSet.mode === RegionMode.CREATING}
                                                onClick={() => this.handleActiveLayerClicked(ImageViewLayer.RegionCreating)}
                                            />
                                        </Tooltip>
                                    </Popover>
                                )}
                                {frame.regionSet.mode === RegionMode.MOVING && (
                                    <Tooltip
                                        position={tooltipPosition}
                                        content={
                                            <span>
                                                Create{" "}
                                                {frame.regionSet.isNewRegionAnnotation
                                                    ? `${RegionStore.AVAILABLE_ANNOTATION_TYPES.get(frame.regionSet.newRegionType).toLowerCase()} annotation`
                                                    : `${RegionStore.AVAILABLE_REGION_TYPES.get(frame.regionSet.newRegionType).toLowerCase()} region`}
                                                <br />
                                                <i>
                                                    <small>
                                                        Double-click to select region or annotation type.
                                                        <br />
                                                        Press C to enter creation mode.
                                                    </small>
                                                </i>
                                            </span>
                                        }
                                    >
                                        <AnchorButton icon={frame.regionSet.isNewRegionAnnotation ? "annotation" : regionIcon} onClick={() => this.handleActiveLayerClicked(ImageViewLayer.RegionCreating)} />
                                    </Tooltip>
                                )} */}
                                <Tooltip
                                    position={tooltipPosition}
                                    content={
                                        <span>
                                            Select and pan mode
                                            <span>
                                                <br />
                                                <i>
                                                    <small>Double Click to open the settings.</small>
                                                </i>
                                            </span>
                                        </span>
                                    }
                                >
                                    <div
                                        className={`toolbar-icon toolbar-icon-${frame.regionSet.mode === RegionMode.MOVING && appStore.activeLayer === ImageViewLayer.RegionMoving ? "active" : ""}`}
                                        onClick={() => this.handleActiveLayerClicked(ImageViewLayer.RegionMoving)}
                                        onDoubleClick={this.handlePanZoomShortCutClicked}
                                    >
                                        <NewCustomIcon icon="pointer" size={26} />
                                    </div>
                                </Tooltip>
                            </>
                        )}

                        <Tooltip position={tooltipPosition} content={<span>Create line region</span>}>
                            <div className={`toolbar-icon`} onClick={() => this.handleRegionTypeClicked(CARTA.RegionType.LINE)}>
                                <NewCustomIcon icon="line" size={26} />
                            </div>
                        </Tooltip>
                        <Tooltip position={tooltipPosition} content={<span>Zoom in (scroll wheel up){currentZoomSpan}</span>}>
                            <div className="toolbar-icon" onClick={this.handleZoomInClicked} data-testid="zoom-in-button">
                                <NewCustomIcon icon="zoom" size={26} />
                            </div>
                        </Tooltip>
                        <Tooltip position={tooltipPosition} content={<span>Zoom out (scroll wheel down){currentZoomSpan}</span>}>
                            <div className="toolbar-icon" onClick={this.handleZoomOutClicked}>
                                <NewCustomIcon icon="zoomIn" size={26} />
                            </div>
                        </Tooltip>
                        {!frame.isPreview && (
                            <Tooltip position={tooltipPosition} content={<span>Zoom to 1.0x{currentZoomSpan}</span>}>
                                <div className="toolbar-icon" onClick={this.props.onZoomToFit}>
                                    <NewCustomIcon icon="fullscreen" size={26} />
                                </div>
                            </Tooltip>
                        )}
                        <Tooltip position={tooltipPosition} content={<span>Zoom to fit{currentZoomSpan}</span>}>
                            <div className="toolbar-icon" onClick={this.handleZoomToActualSizeClicked}>
                                <NewCustomIcon icon="fit" size={26} />
                            </div>
                        </Tooltip>
                        {/* {!frame.isPreview && (
                            <>
                                <Popover content={wcsMatchingMenu} position={Position.TOP} minimal={true}>
                                    <Tooltip
                                        position={tooltipPosition}
                                        content={
                                            <span>
                                                WCS Matching <br />
                                                <small>
                                                    <i>Current: {wcsButtonTooltip}</i>
                                                </small>
                                            </span>
                                        }
                                    >
                                        <AnchorButton icon="link" className="link-button" data-testid="match-button">
                                            {wcsButtonSuperscript}
                                        </AnchorButton>
                                    </Tooltip>
                                </Popover>
                                <Popover content={coordinateSystemMenu} position={Position.TOP} minimal={true}>
                                    <Tooltip
                                        position={tooltipPosition}
                                        content={
                                            <span>
                                                Overlay Coordinate <br />
                                                <small>
                                                    <i>Current: {ToolbarComponent.CoordinateSystemTooltip.get(coordinateSystem)}</i>
                                                </small>
                                            </span>
                                        }
                                    >
                                        <AnchorButton disabled={!frame.validWcs} text={ToolbarComponent.CoordinateSystemName.get(coordinateSystem)} data-testid="overlay-coordinate-button" />
                                    </Tooltip>
                                </Popover>
                            </>
                        )} */}
                        <Tooltip position={tooltipPosition} content="Toggle grid">
                            <div className={`toolbar-icon toolbar-icon-${grid.visible ? "active" : ""}`} onClick={() => grid.setVisible(!grid.visible)}>
                                <NewCustomIcon icon="grid" size={26} />
                            </div>
                        </Tooltip>
                        <Popover content={scalingMenu} position={Position.LEFT} minimal={true}>
                            <div className="toolbar-icon">
                                <NewCustomIcon icon="linear" size={26} />
                            </div>
                        </Popover>
                    </React.Fragment>
                )}
                {/* <Tooltip position={tooltipPosition} content={appStore.toolbarExpanded ? "Hide toolbar" : "Show toolbar"}>
                    <AnchorButton active={appStore.toolbarExpanded} icon={appStore.toolbarExpanded ? "double-chevron-right" : "double-chevron-left"} onClick={appStore.toggleToolbarExpanded} />
                </Tooltip> */}
            </ButtonGroup>
        );
    }
}
