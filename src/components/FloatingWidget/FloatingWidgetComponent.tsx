import * as React from "react";
import {Rnd} from "react-rnd";
import {Classes, Icon, Position, Tooltip} from "@blueprintjs/core";
import classNames from "classnames";
import * as GoldenLayout from "golden-layout";
import {observer} from "mobx-react";

import {PlaceholderComponent, PvPreviewComponent} from "components";
import {AppStore, CatalogStore, HelpStore, LayoutStore, WidgetConfig} from "stores";

import "./FloatingWidgetComponent.scss";

class FloatingWidgetComponentProps {
    widgetConfig: WidgetConfig;
    showPinButton: boolean;
    showFloatingSettingsButton?: boolean;
    children?: any;
    zIndex?: number;
    isSelected?: boolean;
    onSelected?: () => void;
    onClosed?: () => void;
    floatingWidgets?: number;
}

@observer
export class FloatingWidgetComponent extends React.Component<FloatingWidgetComponentProps> {
    private pinElementRef: HTMLElement;
    private rnd: Rnd;

    componentDidMount() {
        this.updateDragSource();
        this.rnd.updateSize({width: this.props.widgetConfig.defaultWidth, height: this.props.widgetConfig.defaultHeight});
        this.rnd.updatePosition({x: this.props.widgetConfig.defaultX, y: this.props.widgetConfig.defaultY});
    }

    componentDidUpdate() {
        this.updateDragSource();
        this.rnd.updateSize({width: this.props.widgetConfig.defaultWidth, height: this.props.widgetConfig.defaultHeight});
        this.rnd.updatePosition({x: this.props.widgetConfig.defaultX, y: this.props.widgetConfig.defaultY});
    }

    updateDragSource() {
        const layoutStore = LayoutStore.Instance;
        if (layoutStore.dockedLayout && this.pinElementRef) {
            // Check for existing drag sources
            const layout = layoutStore.dockedLayout;
            const matchingSources = layout["_dragSources"].filter(d => d._itemConfig.id === this.props.widgetConfig.id);
            const existingSource = matchingSources.find(d => d._element[0] === this.pinElementRef);
            if (existingSource) {
                return;
            }

            // Render config widget
            let itemConfig: GoldenLayout.ItemConfigType;

            itemConfig = {
                type: "react-component",
                component: this.props.widgetConfig.type,
                title: this.props.widgetConfig.title,
                id: this.props.widgetConfig.id,
                isClosable: this.props.widgetConfig.isCloseable,
                props: {id: this.props.widgetConfig.type === PvPreviewComponent.WIDGET_CONFIG.type ? this.props.widgetConfig.parentId : this.props.widgetConfig.id, docked: true}
            };

            if (this.props.widgetConfig.type === PlaceholderComponent.WIDGET_CONFIG.type) {
                itemConfig.props.label = this.props.widgetConfig.title;
            }

            if (this.pinElementRef && itemConfig) {
                layout.createDragSource(this.pinElementRef, itemConfig);
            }
        }
    }

    private onClickHelpButton = () => {
        const centerX = (this.rnd.draggable.state as any).x + this.rnd.resizable.size.width * 0.5;
        if (Array.isArray(this.props.widgetConfig.helpType)) {
            const widgetsStore = AppStore.Instance.widgetsStore;
            const widgetParentType = this.props.widgetConfig.parentType;
            const parentId = widgetsStore.floatingSettingsWidgets.get(this.props.widgetConfig.id);
            let settingsTab: number;
            switch (widgetParentType) {
                case "spatial-profiler":
                    settingsTab = widgetsStore.spatialProfileWidgets.get(parentId).settingsTabId;
                    break;
                case "spectral-profiler":
                    settingsTab = widgetsStore.spectralProfileWidgets.get(parentId).settingsTabId;
                    break;
                case "catalog-overlay":
                    const catalogStore = CatalogStore.Instance;
                    const catalogFileId = catalogStore.catalogProfiles.get(parentId);
                    if (catalogFileId) {
                        const catalogWidgetStoreId = catalogStore.catalogWidgets.get(catalogFileId);
                        settingsTab = widgetsStore.catalogWidgets.get(catalogWidgetStoreId).settingsTabId;
                    }
                    break;
                case "stokes":
                default:
                    settingsTab = widgetsStore.stokesAnalysisWidgets.get(parentId).settingsTabId;
                    break;
            }
            HelpStore.Instance.showHelpDrawer(this.props.widgetConfig.helpType[settingsTab], centerX);
        } else {
            HelpStore.Instance.showHelpDrawer(this.props.widgetConfig.helpType, centerX);
        }
    };

    public render() {
        const headerHeight = 25;
        const appStore = AppStore.Instance;
        const className = classNames("floating-widget", {[Classes.DARK]: appStore.darkTheme});
        const titleClass = classNames("floating-header", {selected: this.props.isSelected, [Classes.DARK]: appStore.darkTheme});
        const buttonClass = classNames("floating-header-button", {[Classes.DARK]: appStore.darkTheme});
        const floatingContentClassName = classNames("floating-content", {[Classes.DARK]: appStore.darkTheme, "floating-settings-content": !this.props.showPinButton});

        const widgetConfig = this.props.widgetConfig;

        return (
            <Rnd
                ref={c => (this.rnd = c)}
                className={className}
                style={{zIndex: this.props.zIndex}}
                default={{
                    x: widgetConfig.defaultX,
                    y: widgetConfig.defaultY,
                    width: widgetConfig.defaultWidth,
                    height: widgetConfig.defaultHeight + headerHeight
                }}
                resizeGrid={[25, 25]}
                dragGrid={[25, 25]}
                minWidth={widgetConfig.minWidth}
                minHeight={widgetConfig.minHeight + headerHeight}
                bounds={".gl-container-app"}
                dragHandleClassName={"floating-title"}
                onMouseDown={this.props.onSelected}
                onDragStop={(e, data) => {
                    widgetConfig.setDefaultPosition(data.lastX, data.lastY);
                }}
                onResizeStop={(e, direction, element, delta, position) => {
                    // manually add the height of the root-menu div to position y
                    // work-around for the change of the position definition from react-rnd v9 (absolute position) to v10 (relative position from the bounds)
                    const rootMenuHeight = 40;
                    const absPosition = {x: position.x, y: position.y + rootMenuHeight};
                    widgetConfig.setDefaultPosition(absPosition.x, absPosition.y);
                    widgetConfig.setDefaultSize(widgetConfig.defaultWidth + delta.width, widgetConfig.defaultHeight + delta.height);
                }}
            >
                <div className={titleClass}>
                    <div className={"floating-title"} data-testid={this.props.widgetConfig?.id + "-header-title"}>
                        {widgetConfig.title}
                    </div>
                    {this.props.showFloatingSettingsButton && (
                        <div
                            className={buttonClass}
                            onClick={() => appStore.widgetsStore.createFloatingSettingsWidget(widgetConfig.title, widgetConfig.id, widgetConfig.type)}
                            data-testid={this.props.widgetConfig?.id + "-header-settings-button"}
                        >
                            <Tooltip content="Settings" position={Position.BOTTOM_RIGHT}>
                                <Icon icon={"cog"} />
                            </Tooltip>
                        </div>
                    )}
                    {widgetConfig.helpType && (
                        <div className={buttonClass} onClick={this.onClickHelpButton}>
                            <Tooltip content="Help" position={Position.BOTTOM_RIGHT}>
                                <Icon icon={"help"} />
                            </Tooltip>
                        </div>
                    )}
                    {this.props.showPinButton && (
                        <div className={buttonClass} ref={ref => (this.pinElementRef = ref)} onClick={() => console.log("pin!")} data-testid={this.props.widgetConfig?.id + "-header-dock-button"}>
                            <Tooltip content="Drag pin to dock this widget" position={Position.BOTTOM_RIGHT}>
                                <Icon icon={"pin"} />
                            </Tooltip>
                        </div>
                    )}
                    {widgetConfig.isCloseable && (
                        <div onMouseDown={this.props.onClosed} className={buttonClass} data-testid={this.props.widgetConfig?.id + "-header-close-button"}>
                            <Icon icon={"cross"} />
                        </div>
                    )}
                </div>
                <div className={floatingContentClassName} data-testid={this.props.widgetConfig?.id + "-content"}>
                    {this.props.children}
                </div>
            </Rnd>
        );
    }
}
