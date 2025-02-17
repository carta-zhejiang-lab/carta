import * as React from "react";
import {FormGroup, HTMLSelect, Switch, Tab, Tabs} from "@blueprintjs/core";
import {autorun, computed} from "mobx";
import {observer} from "mobx-react";

import {LinePlotSettingsPanelComponent, LinePlotSettingsPanelComponentProps, SmoothingSettingsComponent, SpectralSettingsComponent} from "components/Shared";
import {AppStore, DefaultWidgetConfig, HelpType, WidgetProps, WidgetsStore} from "stores";
import {MultiProfileCategory, SpectralProfileWidgetStore} from "stores/Widgets";
import {parseNumber} from "utilities";

import {MomentGeneratorComponent} from "../MomentGeneratorComponent/MomentGeneratorComponent";
import {ProfileFittingComponent} from "../ProfileFittingComponent/ProfileFittingComponent";

import "./SpectralProfilerSettingsPanelComponent.scss";

const KEYCODE_ENTER = 13;

export enum SpectralProfilerSettingsTabs {
    CONVERSION,
    STYLING,
    SMOOTHING,
    MOMENTS,
    FITTING
}

@observer
export class SpectralProfilerSettingsPanelComponent extends React.Component<WidgetProps> {
    public static get WIDGET_CONFIG(): DefaultWidgetConfig {
        return {
            id: "spectral-profiler-floating-settings",
            type: "floating-settings",
            minWidth: 450,
            minHeight: 400,
            defaultWidth: 575,
            defaultHeight: 650,
            title: "spectral-profiler-settings",
            isCloseable: true,
            parentId: "spectal-profiler",
            parentType: "spectral-profiler",
            helpType: [
                HelpType.SPECTRAL_PROFILER_SETTINGS_CONVERSION,
                HelpType.SPECTRAL_PROFILER_SETTINGS_STYLING,
                HelpType.SPECTRAL_PROFILER_SETTINGS_SMOOTHING,
                HelpType.SPECTRAL_PROFILER_SETTINGS_MOMENTS,
                HelpType.SPECTRAL_PROFILER_SETTINGS_FITTING
            ]
        };
    }

    @computed get widgetStore(): SpectralProfileWidgetStore {
        const widgetsStore = WidgetsStore.Instance;
        if (widgetsStore.spectralProfileWidgets) {
            const widgetStore = widgetsStore.spectralProfileWidgets.get(this.props.id);
            if (widgetStore) {
                return widgetStore;
            }
        }
        console.log("can't find store for widget");
        return null;
    }

    constructor(props: WidgetProps) {
        super(props);
        const appStore = AppStore.Instance;
        autorun(() => {
            if (this.widgetStore) {
                const frame = this.widgetStore.effectiveFrame;
                if (frame) {
                    const regionId = this.widgetStore.effectiveRegionId;
                    const regionString = regionId === 0 ? "Cursor" : `Region #${regionId}`;
                    const selectedString = this.widgetStore.matchesSelectedRegion ? "(Active)" : "";
                    appStore.widgetsStore.setWidgetTitle(this.props.floatingSettingsId, `Z Profile Settings: ${regionString} ${selectedString}`);
                }
            }
        });
    }

    handleMeanRmsChanged = (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
        this.widgetStore.setMeanRmsVisible(changeEvent.target.checked);
    };

    handleXMinChange = (ev: React.KeyboardEvent<HTMLInputElement>) => {
        if (ev.type === "keydown" && ev.keyCode !== KEYCODE_ENTER) {
            return;
        }

        const val = parseFloat(ev.currentTarget.value);
        const widgetStore = this.widgetStore;
        const minX = parseNumber(widgetStore.minX, widgetStore.linePlotInitXYBoundaries.minXVal);
        const maxX = parseNumber(widgetStore.maxX, widgetStore.linePlotInitXYBoundaries.maxXVal);
        if (isFinite(val) && val !== minX && val < maxX) {
            widgetStore.setXBounds(val, maxX);
        } else {
            ev.currentTarget.value = minX.toString();
        }
    };

    handleXMaxChange = (ev: React.KeyboardEvent<HTMLInputElement>) => {
        if (ev.type === "keydown" && ev.keyCode !== KEYCODE_ENTER) {
            return;
        }

        const val = parseFloat(ev.currentTarget.value);
        const widgetStore = this.widgetStore;
        const minX = parseNumber(widgetStore.minX, widgetStore.linePlotInitXYBoundaries.minXVal);
        const maxX = parseNumber(widgetStore.maxX, widgetStore.linePlotInitXYBoundaries.maxXVal);
        if (isFinite(val) && val !== maxX && val > minX) {
            widgetStore.setXBounds(minX, val);
        } else {
            ev.currentTarget.value = maxX.toString();
        }
    };

    handleYMinChange = (ev: React.KeyboardEvent<HTMLInputElement>) => {
        if (ev.type === "keydown" && ev.keyCode !== KEYCODE_ENTER) {
            return;
        }

        const val = parseFloat(ev.currentTarget.value);
        const widgetStore = this.widgetStore;
        const minY = parseNumber(widgetStore.minY, widgetStore.linePlotInitXYBoundaries.minYVal);
        const maxY = parseNumber(widgetStore.maxY, widgetStore.linePlotInitXYBoundaries.maxYVal);
        if (isFinite(val) && val !== minY && val < maxY) {
            widgetStore.setYBounds(val, maxY);
        } else {
            ev.currentTarget.value = minY.toString();
        }
    };

    handleYMaxChange = (ev: React.KeyboardEvent<HTMLInputElement>) => {
        if (ev.type === "keydown" && ev.keyCode !== KEYCODE_ENTER) {
            return;
        }

        const val = parseFloat(ev.currentTarget.value);
        const widgetStore = this.widgetStore;
        const minY = parseNumber(widgetStore.minY, widgetStore.linePlotInitXYBoundaries.minYVal);
        const maxY = parseNumber(widgetStore.maxY, widgetStore.linePlotInitXYBoundaries.maxYVal);
        if (isFinite(val) && val !== maxY && val > minY) {
            widgetStore.setYBounds(minY, val);
        } else {
            ev.currentTarget.value = maxY.toString();
        }
    };

    handleSelectedTabChanged = (newTabId: React.ReactText) => {
        this.widgetStore.setSettingsTabId(Number.parseInt(newTabId.toString()));
    };

    render() {
        const widgetStore = this.widgetStore;
        const lineSettingsProps: LinePlotSettingsPanelComponentProps = {
            lineColorMap: widgetStore.lineColorMap,
            lineOrderedKeys: widgetStore.profileSelectionStore.profileOrderedKeys,
            lineOptions: widgetStore.profileSelectionStore.profileOptions,
            lineWidth: widgetStore.lineWidth,
            plotType: widgetStore.plotType,
            linePlotPointSize: widgetStore.linePlotPointSize,
            setLineColor: widgetStore.setProfileColor,
            setLineWidth: widgetStore.setLineWidth,
            setLinePlotPointSize: widgetStore.setLinePlotPointSize,
            setPlotType: widgetStore.setPlotType,
            meanRmsVisible: widgetStore.meanRmsVisible,
            handleMeanRmsChanged: this.handleMeanRmsChanged,
            isAutoScaledX: widgetStore.isAutoScaledX,
            isAutoScaledY: widgetStore.isAutoScaledY,
            clearXYBounds: widgetStore.clearXYBounds,
            xMinVal: parseNumber(widgetStore.minX, widgetStore.linePlotInitXYBoundaries.minXVal),
            handleXMinChange: this.handleXMinChange,
            xMaxVal: parseNumber(widgetStore.maxX, widgetStore.linePlotInitXYBoundaries.maxXVal),
            handleXMaxChange: this.handleXMaxChange,
            yMinVal: parseNumber(widgetStore.minY, widgetStore.linePlotInitXYBoundaries.minYVal),
            handleYMinChange: this.handleYMinChange,
            yMaxVal: parseNumber(widgetStore.maxY, widgetStore.linePlotInitXYBoundaries.maxYVal),
            handleYMaxChange: this.handleYMaxChange
        };

        const isMultiProfileActive = widgetStore.profileSelectionStore.activeProfileCategory === MultiProfileCategory.IMAGE;
        return (
            <div className="spectral-settings">
                <Tabs id="spectralSettingTabs" selectedTabId={widgetStore.settingsTabId} onChange={this.handleSelectedTabChanged}>
                    <Tab
                        id={SpectralProfilerSettingsTabs.CONVERSION}
                        panelClassName="conversion-tab-panel"
                        title="Conversion"
                        panel={
                            <React.Fragment>
                                <SpectralSettingsComponent
                                    frame={widgetStore.effectiveFrame}
                                    onSpectralCoordinateChange={widgetStore.setSpectralCoordinate}
                                    onSpectralCoordinateChangeSecondary={widgetStore.setSpectralCoordinateSecondary}
                                    onSpectralSystemChange={widgetStore.setSpectralSystem}
                                    secondaryAxisCursorInfoVisible={widgetStore.secondaryAxisCursorInfoVisible}
                                    disable={widgetStore.effectiveFrame?.isPVImage}
                                />
                                <FormGroup label={"Intensity unit"} inline={true}>
                                    <HTMLSelect
                                        value={isMultiProfileActive ? widgetStore.intensityUnit : widgetStore.effectiveFrame?.intensityUnit}
                                        options={widgetStore.isIntensityConvertible ? widgetStore.intensityOptions : [widgetStore.effectiveFrame?.headerUnit]}
                                        onChange={ev => (isMultiProfileActive ? widgetStore.setMultiProfileIntensityUnit(ev.currentTarget.value) : widgetStore.effectiveFrame.setIntensityUnit(ev.currentTarget.value))}
                                        data-testid="spectral-profiler-settings-intensity-unit-dropdown"
                                    />
                                </FormGroup>
                                <FormGroup inline={true} label={"Secondary info"}>
                                    <Switch checked={widgetStore.secondaryAxisCursorInfoVisible} onChange={event => widgetStore.setSecondaryAxisCursorInfoVisible(event.currentTarget.checked as boolean)} />
                                </FormGroup>
                            </React.Fragment>
                        }
                    />
                    <Tab id={SpectralProfilerSettingsTabs.STYLING} panelClassName="styling-tab-panel" title="Styling" panel={<LinePlotSettingsPanelComponent {...lineSettingsProps} />} />
                    <Tab id={SpectralProfilerSettingsTabs.SMOOTHING} title="Smoothing" panel={<SmoothingSettingsComponent smoothingStore={widgetStore.smoothingStore} disableColorAndLineWidth={widgetStore.profileNum > 1} />} />
                    <Tab id={SpectralProfilerSettingsTabs.MOMENTS} panelClassName="moment-tab-panel" title="Moments" panel={<MomentGeneratorComponent widgetStore={widgetStore} />} />
                    <Tab id={SpectralProfilerSettingsTabs.FITTING} panelClassName="fitting-tab-panel" title="Fitting" panel={<ProfileFittingComponent fittingStore={widgetStore.fittingStore} widgetStore={widgetStore} />} />
                </Tabs>
            </div>
        );
    }
}
