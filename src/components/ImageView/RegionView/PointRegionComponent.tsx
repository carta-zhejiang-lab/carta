import * as React from "react";
import Konva from "konva";
import {observer} from "mobx-react";

import {Point2D} from "models";
import {AppStore} from "stores";
import {FrameStore, PointAnnotationStore, RegionStore} from "stores/Frame";
import {transformPoint} from "utilities";

import {Point} from "./InvariantShapes";
import {adjustPosToUnityStage, canvasToTransformedImagePos, transformedImageToCanvasPos} from "./shared";

interface PointRegionComponentProps {
    region: RegionStore;
    frame: FrameStore;
    layerWidth: number;
    layerHeight: number;
    selected: boolean;
    stageRef: any;
    onSelect?: (region: RegionStore) => void;
    onDoubleClick?: (region: RegionStore) => void;
}

@observer
export class PointRegionComponent extends React.Component<PointRegionComponentProps> {
    componentDidUpdate() {
        AppStore.Instance.resetImageRatio();
    }

    private handleDoubleClick = () => {
        this.props.onDoubleClick?.(this.props.region);
    };

    private handleClick = (konvaEvent: Konva.KonvaEventObject<MouseEvent>) => {
        const mouseEvent = konvaEvent.evt;
        if (mouseEvent.button === 0 && !(mouseEvent.ctrlKey || mouseEvent.metaKey)) {
            this.props.onSelect?.(this.props.region);
        }
    };

    private handleDragStart = () => {
        this.props.onSelect?.(this.props.region);
        this.props.region.beginEditing();
    };

    private handleDragEnd = () => {
        this.props.region.endEditing();
    };

    private handleDrag = (konvaEvent: Konva.KonvaEventObject<MouseEvent>) => {
        if (konvaEvent.target) {
            const frame = this.props.frame;
            const position = adjustPosToUnityStage(konvaEvent.target.position(), this.props.stageRef.current);
            let positionImageSpace = canvasToTransformedImagePos(position.x, position.y, frame, this.props.layerWidth, this.props.layerHeight);
            if (frame.spatialReference) {
                positionImageSpace = transformPoint(frame.spatialTransformAST, positionImageSpace, true);
            }
            this.props.region.setCenter(positionImageSpace);
        }
    };

    public render() {
        const region = this.props.region as PointAnnotationStore;
        const frame = this.props.frame;
        let centerPixelSpace: Point2D;
        let rotation: number;

        // trigger re-render when exporting images and  changing devicePixelRatio (switching monitor)
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const pixelRatio = AppStore.Instance.pixelRatio;
        const zoomLevel = frame.spatialReference?.zoomLevel || frame.zoomLevel;
        /* eslint-enable @typescript-eslint/no-unused-vars */

        if (frame.spatialReference) {
            const pointReferenceImage = region.center;
            const pointSecondaryImage = transformPoint(frame.spatialTransformAST, pointReferenceImage, false);
            centerPixelSpace = transformedImageToCanvasPos(pointSecondaryImage, frame, this.props.layerWidth, this.props.layerHeight, this.props.stageRef.current);
            rotation = (-frame.spatialTransform.rotation * 180.0) / Math.PI;
        } else {
            centerPixelSpace = transformedImageToCanvasPos(region.center, frame, this.props.layerWidth, this.props.layerHeight, this.props.stageRef.current);
            rotation = 0;
        }

        return (
            <Point
                x={centerPixelSpace.x}
                y={centerPixelSpace.y}
                rotation={rotation}
                color={region.color}
                opacity={region.locked ? 0.7 : 1}
                selectionOpacity={region.locked ? 0 : this.props.selected ? 1 : 0}
                listening={!region.locked}
                onDragStart={this.handleDragStart}
                onDragEnd={this.handleDragEnd}
                onDragMove={this.handleDrag}
                onClick={this.handleClick}
                onDblClick={this.handleDoubleClick}
                pointShape={region.pointShape}
                pointWidth={region.pointWidth}
            />
        );
    }
}
