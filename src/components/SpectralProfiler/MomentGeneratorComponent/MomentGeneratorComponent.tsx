import * as React from "react";
import {AnchorButton, Button, Classes, Divider, FormGroup, HTMLSelect, MenuItem, Position, Switch, Tooltip} from "@blueprintjs/core";
import {ItemPredicate, ItemRenderer, MultiSelect} from "@blueprintjs/select";
import {CARTA} from "carta-protobuf";
import classNames from "classnames";
import {observer} from "mobx-react";

import {TaskProgressDialogComponent} from "components/Dialogs";
import {ClearableNumericInputComponent, SafeNumericInput, SpectralSettingsComponent} from "components/Shared";
import {FrequencyUnit, MOMENT_TEXT} from "models";
import {AppStore, FrameStore} from "stores";
import {MomentSelectingMode, SpectralProfileWidgetStore} from "stores/Widgets";

import "./MomentGeneratorComponent.scss";

const MomentMultiSelect = MultiSelect<CARTA.Moment>;

@observer
export class MomentGeneratorComponent extends React.Component<{widgetStore: SpectralProfileWidgetStore}> {
    private onChannelFromChanged = (from: number) => {
        const widgetStore = this.props.widgetStore;
        const frame = widgetStore.effectiveFrame;
        if (frame && isFinite(from)) {
            widgetStore.setSelectedChannelRange(from, widgetStore.channelValueRange[1]);
        }
    };

    private onChannelToChanged = (to: number) => {
        const widgetStore = this.props.widgetStore;
        const frame = widgetStore.effectiveFrame;
        if (frame && isFinite(to)) {
            widgetStore.setSelectedChannelRange(widgetStore.channelValueRange[0], to);
        }
    };

    private handleChannelSelectionClicked = () => {
        const widgetStore = this.props.widgetStore;
        widgetStore.setMomentRangeSelectingMode(widgetStore.isSelectingMomentChannelRange ? MomentSelectingMode.NONE : MomentSelectingMode.CHANNEL);
    };

    private onMaskFromChanged = (from: number) => {
        const widgetStore = this.props.widgetStore;
        const frame = widgetStore.effectiveFrame;
        if (frame && isFinite(from)) {
            widgetStore.setSelectedMaskRange(from, widgetStore.maskRange[1]);
        }
    };

    private onMaskToChanged = (to: number) => {
        const widgetStore = this.props.widgetStore;
        const frame = widgetStore.effectiveFrame;
        if (frame && isFinite(to)) {
            widgetStore.setSelectedMaskRange(widgetStore.maskRange[0], to);
        }
    };

    private handleMaskSelectionClicked = () => {
        const widgetStore = this.props.widgetStore;
        widgetStore.setMomentRangeSelectingMode(widgetStore.isSelectingMomentMaskRange ? MomentSelectingMode.NONE : MomentSelectingMode.MASK);
    };

    private filterMoment: ItemPredicate<CARTA.Moment> = (query, moment, index, exactMatch) => {
        const momentContent = MOMENT_TEXT.get(moment);
        const normalizedMoment = momentContent.tag.toLowerCase();
        const normalizedQuery = query.toLowerCase();

        if (exactMatch) {
            return normalizedMoment === normalizedQuery;
        } else {
            return momentContent.tag.indexOf(normalizedQuery) === 0;
        }
    };

    private renderMomentTag = (moment: CARTA.Moment) => {
        const momentContent = MOMENT_TEXT.get(moment);
        return momentContent ? momentContent.tag : undefined;
    };

    private renderMomentSelectItem: ItemRenderer<CARTA.Moment> = (moment: CARTA.Moment, {modifiers, handleClick}) => {
        const momentContent = MOMENT_TEXT.get(moment);
        return momentContent ? <MenuItem text={`${momentContent.tag}: ${momentContent.text}`} onClick={handleClick} key={moment} icon={this.props.widgetStore.isMomentSelected(moment) ? "tick" : "blank"} /> : undefined;
    };

    private renderRestFreqInput = (frame: FrameStore) => {
        const disableCoordinateSetting = !frame || frame?.isPVImage || !frame?.isSpectralChannel;
        const restFreqStore = frame?.restFreqStore;
        return (
            <div className="freq-input">
                <ClearableNumericInputComponent
                    label="Rest frequency"
                    value={restFreqStore?.customRestFreq.value ?? NaN}
                    disabled={disableCoordinateSetting}
                    placeholder="Rest frequency"
                    selectAllOnFocus={true}
                    onValueChanged={restFreqStore?.setCustomVal}
                    onValueCleared={restFreqStore?.restoreDefaults}
                    resetDisabled={restFreqStore?.resetDisable}
                    tooltipContent={restFreqStore?.defaultInfo}
                    tooltipPlacement={"bottom"}
                />
                <HTMLSelect disabled={disableCoordinateSetting} options={Object.values(FrequencyUnit)} value={restFreqStore?.customRestFreq.unit} onChange={ev => restFreqStore?.setCustomUnit(ev.currentTarget.value as FrequencyUnit)} />
            </div>
        );
    };

    private handleMomentTagRemove = (tag: string, index: number) => {
        this.props.widgetStore.removeMomentByIndex(index);
    };

    private handleMomentsClear = () => {
        this.props.widgetStore.clearSelectedMoments();
    };

    private handleRequestMoment = () => {
        this.props.widgetStore.requestMoment();
    };

    private handleRequestingMomentCancelled = () => {
        this.props.widgetStore.requestingMomentCancelled();
    };

    render() {
        const appStore = AppStore.Instance;
        const widgetStore = this.props.widgetStore;
        const frame = widgetStore.effectiveFrame;
        const fileInfo = frame ? `${appStore.getFrameIndex(frame.frameInfo.fileId)}: ${frame.filename}` : undefined;
        const regionInfo = widgetStore.momentRegionInfo;

        const regionPanel = (
            <React.Fragment>
                <FormGroup
                    className={"image-region-select"}
                    label={"Data source"}
                    inline={true}
                    labelInfo={
                        fileInfo ? (
                            <React.Fragment>
                                (
                                <span className="label-info" title={fileInfo} data-testid="moment-generator-file-info">
                                    {fileInfo}
                                </span>
                                )
                            </React.Fragment>
                        ) : undefined
                    }
                    disabled={!frame}
                >
                    <HTMLSelect value={widgetStore.fileId} options={widgetStore.frameOptions} onChange={ev => widgetStore.selectFrame(parseInt(ev.target.value))} disabled={!frame} data-testid="moment-generator-image-dropdown" />
                </FormGroup>
                <FormGroup
                    className={"image-region-select"}
                    label={"Region"}
                    inline={true}
                    labelInfo={
                        regionInfo ? (
                            <React.Fragment>
                                (
                                <span className="label-info" title={regionInfo} data-testid="moment-generator-region-info">
                                    {regionInfo}
                                </span>
                                )
                            </React.Fragment>
                        ) : undefined
                    }
                    disabled={!frame}
                >
                    <HTMLSelect
                        value={widgetStore.momentRegionId}
                        options={widgetStore.momentRegionOptions}
                        onChange={ev => widgetStore.selectMomentRegion(parseInt(ev.target.value))}
                        disabled={!frame}
                        data-testid="moment-generator-region-dropdown"
                    />
                </FormGroup>
            </React.Fragment>
        );

        const spectralPanel = (
            <React.Fragment>
                <SpectralSettingsComponent frame={frame} onSpectralCoordinateChange={widgetStore.setSpectralCoordinate} onSpectralSystemChange={widgetStore.setSpectralSystem} disable={frame?.isPVImage} />
                {frame && frame.numChannels > 1 && (
                    <FormGroup label="Range" inline={true} labelInfo={frame?.spectralUnit ? `(${frame.spectralUnit})` : ""}>
                        <div className="range-select">
                            <FormGroup label="From" inline={true}>
                                <SafeNumericInput value={widgetStore.channelValueRange[0]} buttonPosition="none" onValueChange={val => this.onChannelFromChanged(val)} data-testid="moment-generator-spectral-range-from-input" />
                            </FormGroup>
                            <FormGroup label="To" inline={true}>
                                <SafeNumericInput value={widgetStore.channelValueRange[1]} buttonPosition="none" onValueChange={val => this.onChannelToChanged(val)} data-testid="moment-generator-spectral-range-to-input" />
                            </FormGroup>
                            <div className="cursor-select">
                                <Tooltip content="Use cursor to select channel range in profiler" position={Position.BOTTOM}>
                                    <AnchorButton className={classNames({[Classes.ACTIVE]: widgetStore.isSelectingMomentChannelRange})} icon="select" onClick={this.handleChannelSelectionClicked} />
                                </Tooltip>
                            </div>
                        </div>
                    </FormGroup>
                )}
                <React.Fragment>{this.renderRestFreqInput(frame)}</React.Fragment>
            </React.Fragment>
        );

        const maskPanel = (
            <React.Fragment>
                <FormGroup label="Mask" inline={true} disabled={!frame}>
                    <HTMLSelect
                        value={widgetStore.momentMask}
                        options={Object.keys(CARTA.MomentMask).map(key => ({label: key, value: CARTA.MomentMask[key]}))}
                        onChange={(event: React.FormEvent<HTMLSelectElement>) => widgetStore.setMomentMask(parseInt(event.currentTarget.value) as CARTA.MomentMask)}
                        disabled={!frame}
                        data-testid="moment-generator-mask-dropdown"
                    />
                </FormGroup>
                {frame && frame.numChannels > 1 && (
                    <FormGroup label="Range" inline={true} labelInfo={`(${frame.requiredUnit})`}>
                        <div className="range-select">
                            <FormGroup label="From" inline={true}>
                                <SafeNumericInput value={widgetStore.maskRange[0]} buttonPosition="none" onValueChange={val => this.onMaskFromChanged(val)} data-testid="moment-generator-mask-range-from-input" />
                            </FormGroup>
                            <FormGroup label="To" inline={true}>
                                <SafeNumericInput value={widgetStore.maskRange[1]} buttonPosition="none" onValueChange={val => this.onMaskToChanged(val)} data-testid="moment-generator-mask-range-to-input" />
                            </FormGroup>
                            <div className="cursor-select">
                                <Tooltip content="Use cursor to select mask range in profiler" position={Position.BOTTOM}>
                                    <AnchorButton className={classNames({[Classes.ACTIVE]: widgetStore.isSelectingMomentMaskRange})} icon="select" onClick={this.handleMaskSelectionClicked} />
                                </Tooltip>
                            </div>
                        </div>
                    </FormGroup>
                )}
            </React.Fragment>
        );

        const isAbleToGenerate = frame && frame.numChannels > 1 && !appStore.animatorStore.animationActive && !appStore.widgetsStore.isSpectralWidgetStreamingData && widgetStore.isMomentRegionValid;
        const hint = (
            <span>
                <br />
                <i>
                    <small>
                        Please ensure:
                        <br />
                        1. Animation playback is stopped.
                        <br />
                        2. Spectral profile generation is complete.
                        <br />
                        3. Point region is not selected.
                    </small>
                </i>
            </span>
        );
        const msg = <span>Unable to generate moment images{hint}</span>;
        const momentsPanel = (
            <React.Fragment>
                <FormGroup label="Moments" inline={true}>
                    <MomentMultiSelect
                        placeholder="Select..."
                        items={Object.values(CARTA.Moment) as CARTA.Moment[]}
                        itemPredicate={this.filterMoment}
                        itemRenderer={this.renderMomentSelectItem}
                        onItemSelect={moment => (widgetStore.isMomentSelected(moment) ? widgetStore.deselectMoment(moment) : widgetStore.selectMoment(moment))}
                        selectedItems={widgetStore.selectedMoments}
                        resetOnSelect={true}
                        fill={true}
                        popoverProps={{minimal: true, position: "bottom"}}
                        tagRenderer={this.renderMomentTag}
                        tagInputProps={{
                            onRemove: this.handleMomentTagRemove,
                            tagProps: {
                                minimal: true
                            },
                            rightElement: <Button icon="cross" minimal={true} onClick={this.handleMomentsClear} data-testid="moment-generator-clear-select-button" />
                        }}
                    />
                </FormGroup>
                <Divider />
                <FormGroup inline={true} label={"Options"}>
                    <Switch
                        label={"Keep previous moment image(s)"}
                        onChange={event => {
                            const e = event.target as HTMLInputElement;
                            widgetStore.setKeep(e.checked);
                        }}
                    />
                    {frame === appStore.spatialReference && <Switch label={"Auto spatial matching"} checked={appStore.momentToMatch} onChange={appStore.toggleMomentToMatch} />}
                </FormGroup>
                <div className="moment-generate">
                    <Tooltip disabled={isAbleToGenerate} content={msg} position={Position.BOTTOM}>
                        <AnchorButton intent="success" onClick={this.handleRequestMoment} disabled={!isAbleToGenerate} data-testid="moment-generator-generate-button">
                            Generate
                        </AnchorButton>
                    </Tooltip>
                </div>
            </React.Fragment>
        );

        return (
            <div className="moment-generator" data-testid="moment-generator-tab">
                <div className="moment-panel">
                    {regionPanel}
                    <Divider />
                    {spectralPanel}
                    <Divider />
                    {maskPanel}
                    <Divider />
                    {momentsPanel}
                </div>
                <TaskProgressDialogComponent
                    isOpen={frame && frame.isRequestingMoments && frame.requestingMomentsProgress < 1}
                    progress={frame ? frame.requestingMomentsProgress : 0}
                    timeRemaining={appStore.estimatedTaskRemainingTime}
                    cancellable={true}
                    onCancel={this.handleRequestingMomentCancelled}
                    text={"Generating moments"}
                />
            </div>
        );
    }
}
