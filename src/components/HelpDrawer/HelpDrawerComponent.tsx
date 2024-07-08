import * as React from "react";
import {Classes, Drawer, DrawerProps} from "@blueprintjs/core";
import classNames from "classnames";
import {observer} from "mobx-react";

import {AppStore, HelpStore} from "stores";
import {HelpType} from "stores/HelpStore/HelpStore";

import {
    ANIMATOR_HELP_CONTENT,
    CATALOG_HISTOGRAM_PLOT_HELP_CONTENT,
    CATALOG_OVERLAY_HELP_CONTENT,
    CATALOG_SCATTER_PLOT_HELP_CONTENT,
    CATALOG_SETTINGS_COLOR_HELP_CONTENT,
    CATALOG_SETTINGS_ORIENTATION_HELP_CONTENT,
    CATALOG_SETTINGS_SIZE_HELP_CONTENT,
    CONTOUR_HELP_CONTENT,
    CURSOR_INFO_HELP_CONTENT,
    FILE_BROWSER_HELP_CONTENT,
    FILE_INFO_HELP_CONTENT,
    HISTOGRAM_HELP_CONTENT,
    HISTOGRAM_SETTINGS_HELP_CONTENT,
    IMAGE_FITTING_HELP_CONTENT,
    IMAGE_VIEW_HELP_CONTENT,
    IMAGE_VIEW_SETTINGS_HELP_CONTENT,
    LAYER_LIST_HELP_CONTENT,
    LAYER_LIST_SETTINGS_HELP_CONTENT,
    LOG_HELP_CONTENT,
    ONLINE_CATALOG_QUERY_HELP_CONTENT,
    PLACE_HOLDER_HELP_CONTENT,
    PREFERENCES_HELP_CONTENT,
    PV_GENERATOR_HELP_CONTENT,
    REGION_DIALOG_HELP_CONTENT,
    REGION_LIST_HELP_CONTENT,
    RENDER_CONFIG_HELP_CONTENT,
    RENDER_CONFIG_SETTINGS_HELP_CONTENT,
    SAVE_LAYOUT_HELP_CONTENT,
    SPATIAL_PROFILER_HELP_CONTENT,
    SPATIAL_PROFILER_SETTINGS_COMPUTATION_HELP_CONTENT,
    SPATIAL_PROFILER_SETTINGS_SMOOTHING_HELP_CONTENT,
    SPATIAL_PROFILER_SETTINGS_STYLING_HELP_CONTENT,
    SPECTRAL_LINE_QUERY_HELP_CONTENT,
    SPECTRAL_PROFILER_HELP_CONTENT,
    SPECTRAL_PROFILER_SETTINGS_CONVERSION_HELP_CONTENT,
    SPECTRAL_PROFILER_SETTINGS_FITTING_HELP_CONTENT,
    SPECTRAL_PROFILER_SETTINGS_MOMENTS_HELP_CONTENT,
    SPECTRAL_PROFILER_SETTINGS_SMOOTHING_HELP_CONTENT,
    SPECTRAL_PROFILER_SETTINGS_STYLING_HELP_CONTENT,
    STATS_HELP_CONTENT,
    STOKES_ANALYSIS_HELP_CONTENT,
    STOKES_ANALYSIS_SETTINGS_CONVERSION_HELP_CONTENT,
    STOKES_ANALYSIS_SETTINGS_LINE_PLOT_STYLING_HELP_CONTENT,
    STOKES_ANALYSIS_SETTINGS_SCATTER_PLOT_STYLING_HELP_CONTENT,
    STOKES_ANALYSIS_SETTINGS_SMOOTHING_HELP_CONTENT,
    STOKES_HYPERCUBE_DIALOG_HELP_CONTENT,
    VECTOR_OVERLAY_HELP_CONTENT,
    WORKSPACE_HELP_CONTENT
} from "./HelpContent";

import "./HelpDrawerComponent.scss";

const HELP_CONTENT_MAP = new Map<HelpType, JSX.Element>([
    // Dialog
    [HelpType.CONTOUR, CONTOUR_HELP_CONTENT],
    [HelpType.FILE_BROWSER, FILE_BROWSER_HELP_CONTENT],
    [HelpType.FILE_INFO, FILE_INFO_HELP_CONTENT],
    [HelpType.IMAGE_FITTING, IMAGE_FITTING_HELP_CONTENT],
    [HelpType.PREFERENCES, PREFERENCES_HELP_CONTENT],
    [HelpType.REGION_DIALOG, REGION_DIALOG_HELP_CONTENT],
    [HelpType.SAVE_LAYOUT, SAVE_LAYOUT_HELP_CONTENT],
    [HelpType.STOKES, STOKES_HYPERCUBE_DIALOG_HELP_CONTENT],
    [HelpType.VECTOR_OVERLAY, VECTOR_OVERLAY_HELP_CONTENT],
    [HelpType.ONLINE_CATALOG_QUERY, ONLINE_CATALOG_QUERY_HELP_CONTENT],
    [HelpType.WORKSPACE, WORKSPACE_HELP_CONTENT],

    // Widgets
    [HelpType.ANIMATOR, ANIMATOR_HELP_CONTENT],
    [HelpType.HISTOGRAM, HISTOGRAM_HELP_CONTENT],
    [HelpType.HISTOGRAM_SETTINGS, HISTOGRAM_SETTINGS_HELP_CONTENT],
    [HelpType.IMAGE_VIEW, IMAGE_VIEW_HELP_CONTENT],
    [HelpType.IMAGE_VIEW_SETTINGS, IMAGE_VIEW_SETTINGS_HELP_CONTENT],
    [HelpType.LAYER_LIST, LAYER_LIST_HELP_CONTENT],
    [HelpType.LAYER_LIST_SETTINGS, LAYER_LIST_SETTINGS_HELP_CONTENT],
    [HelpType.LOG, LOG_HELP_CONTENT],
    [HelpType.PLACEHOLDER, PLACE_HOLDER_HELP_CONTENT],
    [HelpType.REGION_LIST, REGION_LIST_HELP_CONTENT],
    [HelpType.RENDER_CONFIG, RENDER_CONFIG_HELP_CONTENT],
    [HelpType.RENDER_CONFIG_SETTINGS, RENDER_CONFIG_SETTINGS_HELP_CONTENT],
    [HelpType.SPATIAL_PROFILER, SPATIAL_PROFILER_HELP_CONTENT],
    [HelpType.SPATIAL_PROFILER_SETTINGS_STYLING, SPATIAL_PROFILER_SETTINGS_STYLING_HELP_CONTENT],
    [HelpType.SPATIAL_PROFILER_SETTINGS_SMOOTHING, SPATIAL_PROFILER_SETTINGS_SMOOTHING_HELP_CONTENT],
    [HelpType.SPATIAL_PROFILER_SETTINGS_COMPUTATION, SPATIAL_PROFILER_SETTINGS_COMPUTATION_HELP_CONTENT],
    [HelpType.SPECTRAL_PROFILER, SPECTRAL_PROFILER_HELP_CONTENT],
    [HelpType.SPECTRAL_PROFILER_SETTINGS_CONVERSION, SPECTRAL_PROFILER_SETTINGS_CONVERSION_HELP_CONTENT],
    [HelpType.SPECTRAL_PROFILER_SETTINGS_STYLING, SPECTRAL_PROFILER_SETTINGS_STYLING_HELP_CONTENT],
    [HelpType.SPECTRAL_PROFILER_SETTINGS_SMOOTHING, SPECTRAL_PROFILER_SETTINGS_SMOOTHING_HELP_CONTENT],
    [HelpType.SPECTRAL_PROFILER_SETTINGS_MOMENTS, SPECTRAL_PROFILER_SETTINGS_MOMENTS_HELP_CONTENT],
    [HelpType.SPECTRAL_PROFILER_SETTINGS_FITTING, SPECTRAL_PROFILER_SETTINGS_FITTING_HELP_CONTENT],
    [HelpType.STATS, STATS_HELP_CONTENT],
    [HelpType.STOKES_ANALYSIS, STOKES_ANALYSIS_HELP_CONTENT],
    [HelpType.STOKES_ANALYSIS_SETTINGS_CONVERSION, STOKES_ANALYSIS_SETTINGS_CONVERSION_HELP_CONTENT],
    [HelpType.STOKES_ANALYSIS_SETTINGS_LINE_PLOT_STYLING, STOKES_ANALYSIS_SETTINGS_LINE_PLOT_STYLING_HELP_CONTENT],
    [HelpType.STOKES_ANALYSIS_SETTINGS_SCATTER_PLOT_STYLING, STOKES_ANALYSIS_SETTINGS_SCATTER_PLOT_STYLING_HELP_CONTENT],
    [HelpType.STOKES_ANALYSIS_SETTINGS_SMOOTHING, STOKES_ANALYSIS_SETTINGS_SMOOTHING_HELP_CONTENT],
    [HelpType.CATALOG_OVERLAY, CATALOG_OVERLAY_HELP_CONTENT],
    [HelpType.CATALOG_HISTOGRAM_PLOT, CATALOG_HISTOGRAM_PLOT_HELP_CONTENT],
    [HelpType.CATALOG_SCATTER_PLOT, CATALOG_SCATTER_PLOT_HELP_CONTENT],
    [HelpType.CATALOG_SETTINGS_GOLBAL, undefined],
    [HelpType.CATALOG_SETTINGS_OVERLAY, undefined],
    [HelpType.CATALOG_SETTINGS_COLOR, CATALOG_SETTINGS_COLOR_HELP_CONTENT],
    [HelpType.CATALOG_SETTINGS_SIZE, CATALOG_SETTINGS_SIZE_HELP_CONTENT],
    [HelpType.CATALOG_SETTINGS_ORIENTATION, CATALOG_SETTINGS_ORIENTATION_HELP_CONTENT],
    [HelpType.SPECTRAL_LINE_QUERY, SPECTRAL_LINE_QUERY_HELP_CONTENT],
    [HelpType.PV_GENERATOR, PV_GENERATOR_HELP_CONTENT],
    [HelpType.CURSOR_INFO, CURSOR_INFO_HELP_CONTENT]
]);

@observer
export class HelpDrawerComponent extends React.Component {
    render() {
        const helpStore = HelpStore.Instance;
        const className = classNames("help-drawer", {[Classes.DARK]: AppStore.Instance.darkTheme});

        const drawerProps: DrawerProps = {
            icon: "help",
            className: className,
            lazy: true,
            isOpen: helpStore.helpVisible,
            onClose: helpStore.hideHelpDrawer,
            title: helpStore.type ?? "",
            position: helpStore.position,
            size: "33%",
            hasBackdrop: true,
            backdropClassName: "help-drawer-backdrop"
        };

        return (
            <Drawer {...drawerProps}>
                <div className={Classes.DRAWER_BODY}>
                    <div className={Classes.DIALOG_BODY}>{HELP_CONTENT_MAP.get(helpStore.type) ?? ""}</div>
                </div>
            </Drawer>
        );
    }
}
