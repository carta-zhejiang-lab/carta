import {OptionProps} from "@blueprintjs/core";
import {CARTA} from "carta-protobuf";
import {action, computed, makeObservable, observable, reaction} from "mobx";

import {SpectralSystem} from "models";
import {TelemetryAction, TelemetryService} from "services";
import {AppStore, PreferenceStore} from "stores";
import {FrameStore} from "stores/Frame";
import {length2D} from "utilities";

import {ACTIVE_FILE_ID, RegionId, RegionsType, RegionWidgetStore} from "../RegionWidgetStore/RegionWidgetStore";

export enum PVAxis {
    SPATIAL = "Spatial",
    SPECTRAL = "Spectral"
}

export class PvGeneratorWidgetStore extends RegionWidgetStore {
    @observable width: number;
    @observable reverse: boolean;
    @observable keep: boolean;
    @observable range: CARTA.IIntBounds = {min: this.effectiveFrame?.channelValueBounds?.min, max: this.effectiveFrame?.channelValueBounds?.max};
    @observable xyRebin: number = 1;
    @observable zRebin: number = 1;
    @observable previewRegionId: number;
    @observable previewFrame: FrameStore | null;
    @observable pvCutRegionId: number | null;

    @computed get regionOptions(): OptionProps[] {
        const appStore = AppStore.Instance;
        let regionOptions: OptionProps[] = [{value: RegionId.NONE, label: "None"}];
        if (appStore.frames) {
            const selectedFrame = appStore.getFrame(this.fileId);
            if (selectedFrame?.regionSet) {
                const validRegionOptions = selectedFrame.regionSet.regions
                    ?.filter(r => !r.isTemporary && (r.regionType === CARTA.RegionType.LINE || r.regionType === CARTA.RegionType.POLYLINE))
                    ?.map(region => {
                        return {value: region?.regionId, label: region?.nameString};
                    });
                if (validRegionOptions) {
                    regionOptions = regionOptions.concat(validRegionOptions);
                }
            }
        }
        return regionOptions;
    }

    @computed get previewRegionOptions(): OptionProps[] {
        const appStore = AppStore.Instance;
        let previewRegionOptions: OptionProps[] = [{value: RegionId.IMAGE, label: "Image"}];
        if (appStore.frames) {
            const selectedFrame = appStore.getFrame(this.fileId);
            if (selectedFrame?.regionSet) {
                const validRegionOptions = selectedFrame.regionSet.regions
                    ?.filter(r => !r.isTemporary && r.regionType === CARTA.RegionType.RECTANGLE)
                    ?.map(region => {
                        return {value: region?.regionId, label: region?.nameString};
                    });
                if (validRegionOptions) {
                    previewRegionOptions = previewRegionOptions.concat(validRegionOptions);
                }
            }
        }
        return previewRegionOptions;
    }

    @computed get effectivePreviewRegionId(): number {
        if (this.effectiveFrame) {
            const regionId = this.previewRegionId;
            if (regionId !== RegionId.IMAGE && regionId !== undefined && this.effectiveFrame.getRegion(regionId)) {
                return regionId;
            }
        }
        return RegionId.IMAGE;
    }

    @action requestPV = (preview: boolean = false, pvGeneratorId?: string) => {
        const frame = this.effectiveFrame;
        if (!frame) {
            return;
        }

        let channelIndexMin = frame.findChannelIndexByValue(this.range.min);
        let channelIndexMax = frame.findChannelIndexByValue(this.range.max);

        if (channelIndexMin > channelIndexMax) {
            const holder = channelIndexMax;
            channelIndexMax = channelIndexMin;
            channelIndexMin = holder;
        }
        if (channelIndexMin >= channelIndexMax) {
            if (channelIndexMax === 0) {
                channelIndexMax++;
            }
            channelIndexMin = channelIndexMax - 1;
        }
        if (frame && this.effectiveRegion) {
            const requestMessage: CARTA.IPvRequest = {
                fileId: frame.frameInfo.fileId,
                regionId: this.effectiveRegionId,
                width: this.width,
                spectralRange: isFinite(channelIndexMin) && isFinite(channelIndexMax) ? {min: channelIndexMin, max: channelIndexMax} : null,
                reverse: this.reverse,
                keep: this.keep,
                previewSettings:
                    preview && pvGeneratorId
                        ? {
                              previewId: parseInt(pvGeneratorId.split("-")[2]),
                              regionId: this.effectivePreviewRegionId,
                              rebinXy: this.xyRebin,
                              rebinZ: this.zRebin,
                              imageCompressionQuality: PreferenceStore.Instance.imageCompressionQuality || 11,
                              animationCompressionQuality: PreferenceStore.Instance.animationCompressionQuality || 9,
                              compressionType: CARTA.CompressionType.ZFP
                          }
                        : undefined
            };
            if (preview && pvGeneratorId) {
                AppStore.Instance.requestPreviewPV(requestMessage, frame, pvGeneratorId);
            } else {
                AppStore.Instance.requestPV(requestMessage, frame, this.keep);
                const depth = channelIndexMax - channelIndexMin + 1;
                TelemetryService.Instance.addTelemetryEntry(TelemetryAction.PvGeneration, {regionId: this.effectiveRegion.regionId, regionType: this.effectiveRegion.regionType, length: length2D(this.effectiveRegion.size), depth});
            }
            frame.resetPvRequestState();
            frame.setIsRequestingPV(true);
        }
    };

    @action requestingPVCancelled = (pvGeneratorId: string) => {
        return () => {
            const frame = this.effectiveFrame;
            if (frame) {
                AppStore.Instance.cancelRequestingPV(frame.frameInfo.fileId, parseInt(pvGeneratorId.split("-")[2]));
                frame.setIsRequestPVCancelling(true);
            }
        };
    };

    @action setSpectralCoordinate = (coordStr: string) => {
        this.effectiveFrame?.setSpectralCoordinate(coordStr);
    };

    @action setSpectralSystem = (specsys: SpectralSystem) => {
        this.effectiveFrame?.setSpectralSystem(specsys);
    };

    @action setWidth = (val: number) => {
        this.width = val;
    };

    @action setReverse = (bool: boolean) => {
        this.reverse = bool;
    };

    @action setKeep = (bool: boolean) => {
        this.keep = bool;
    };

    @action setSpectralRange = (range: CARTA.IIntBounds) => {
        if (isFinite(range.min ?? NaN) && isFinite(range.max ?? NaN)) {
            this.range = range;
        }
    };

    @action setXYRebin = (val: number) => {
        this.xyRebin = val;
    };

    @action setZRebin = (val: number) => {
        this.zRebin = val;
    };

    @action setPreviewRegionId = (regionId: number) => {
        this.previewRegionId = regionId;
    };

    @action setPreviewFrame = (frame: FrameStore) => {
        this.previewFrame = frame;
    };

    @action setPvCutRegionId = (regionId: number) => {
        this.pvCutRegionId = regionId;
    };

    @action removePreviewFrame = (id: number) => {
        AppStore.Instance.removePreviewFrame(id);
        this.previewFrame = null;
        this.pvCutRegionId = null;
    };

    constructor() {
        super(RegionsType.LINE);
        makeObservable(this);
        this.width = 3;
        this.reverse = false;
        this.keep = false;
        this.regionIdMap.set(ACTIVE_FILE_ID, RegionId.NONE);
        reaction(
            () => this.effectiveFrame?.channelValueBounds,
            channelValueBounds => {
                if (channelValueBounds) {
                    this.setSpectralRange(channelValueBounds);
                }
            }
        );
    }
}
