import widgetButtonSpatialProfiler from "static/help/widgetButton_spatialProfiler.png";
import widgetButtonSpatialProfiler_d from "static/help/widgetButton_spatialProfiler_d.png";

import {ImageComponent} from "../ImageComponent";

export const SPATIAL_PROFILER_HELP_CONTENT = (
    <div>
        <p>
            <ImageComponent light={widgetButtonSpatialProfiler} dark={widgetButtonSpatialProfiler_d} width="90%" />
        </p>
        <p>
            The Spatial Profiler Widget allows you to view a profile from
            <ul>
                <li>a horizontal cut at the cursor position or at the point region</li>
                <li>a vertical cut at the cursor position or at the point region</li>
                <li>a line region</li>
                <li>a polyline region</li>
            </ul>
            You can fix the cursor position in the Image Viewer by pressing the <code>F</code> key. Pressing the <code>F</code> key again will unfreeze the cursor. For a line region or a polyline region, an averaging width along the region
            can be set with the <b>Computation</b> tab of the Spatial Profiler Settings Dialog (the cog button at the top right corner of the widget).
        </p>
        <p>
            When a line region or a polyline region is re-sampled for the spatial profile calculations, the projection distortion of the input image is considered. If the image is considered as <em>flat</em>, the region is sampled with a
            regular step in pixels. However, if the image is considered as <em>wide</em> with noticeable projection distortion, the region is sampled with a fixed angular increment derived from the <code>CDELT</code> header. For a line
            region, the spatial profile is computed with an <em>offset</em> axis with respect to the center of the line region. For a polyline region, the spatial profile is computed with a <em>distance</em> axis instead.
        </p>
        <p>The cursor position in the Image Viewer is displayed as a red vertical line in the spatial profile plot.</p>
        <p>
            When the cursor is in the Image Viewer, the cursor position in image and world coordinates and pointed pixel value are reported in the bottom-left corner of the Spatial Profiler Widget. When the cursor moves onto the spatial
            profile plot (displayed as a gray vertical line), these values derived from the profile data will be reported instead.
        </p>
        <h3 id="profile-mean-and-rms">Profile mean and RMS</h3>
        <p>
            As an option in the <b>Styling</b> tab of the Spatial Profiler Settings Dialog, mean and RMS values of the profile can be visualized as a green dashed line and a shaded area in the profile plot. Numeric values are displayed at
            the bottom-left corner. Note that CARTA includes all data in the current zoom level of the profile plot to perform the calculations. If zoom level changes, mean and RMS values will be updated too.
        </p>
        <h3 id="profile-smoothing">Profile smoothing</h3>
        <p>
            The displayed profile can be smoothed via the <b>Smoothing</b> tab of the Spatial Profiler Settings Dialog. CARTA provides the following smoothing methods:
            <ul>
                <li>
                    <b>Boxcar</b>: convolution with a boxcar function
                </li>
                <li>
                    <b>Gaussian</b>: convolution with a Gaussian function
                </li>
                <li>
                    <b>Hanning</b>: convolution with a Hanning function
                </li>
                <li>
                    <b>Binning</b>: averaging channels with a given width
                </li>
                <li>
                    <b>Savitzky-Golay</b>: fitting successive sub-sets of adjacent data points with a low-degree polynomial by the method of linear least squares
                </li>
                <li>
                    <b>Decimation</b>: min-max decimation with a given width
                </li>
            </ul>
        </p>
        <p>Optionally, the original profile can be overplotted with the smoothed profile. The appearance of the smoothed profile, including color, style, width, and size, can be customized.</p>
        <h3 id="interactivity-zoom-and-pan">Interactivity: zoom and pan</h3>
        <p>The x and y ranges of the spatial profile plot can be modified by</p>
        <ul>
            <li>
                <code>scrolling wheel</code> (up to zoom in and down to zoom out with respect to the cursor position)
            </li>
            <li>
                <code>drag-and-drop</code> horizontally to zoom in x
            </li>
            <li>
                <code>drag-and-drop</code> vertically to zoom in y
            </li>
            <li>
                <code>drag-and-drop</code> diagonally to zoom in both x and y
            </li>
            <li>
                <code>double-click</code> to reset x and y ranges
            </li>
            <li>
                <code>shift + drag-and-drop</code> to pan in x
            </li>
        </ul>
        <p>
            In addition, the x and y ranges can be set explicitly in the <b>Styling</b> tab of the Spatial Profiler Settings Dialog.
        </p>
        <h3 id="exports">Profile plot export</h3>
        <p>The spatial profile plot can be exported as a PNG file or a text file in TSV format via the buttons in the bottom-right corner (shown when hovering over the plot).</p>
        <h3 id="plot-cosmetics">Plot cosmetics</h3>
        <p>
            The appearance of the spatial profile plot is customizable via the <b>Styling</b> tab of the Spatial Profiler Settings Dialog (the cog icon). Supported options are:
        </p>
        <ul>
            <li>color of the plot</li>
            <li>plot styles including steps (default), lines, and dots</li>
            <li>line width for steps or lines</li>
            <li>point size for dots</li>
            <li>display alternative horizontal axis in world coordinate (only for cursor or point region)</li>
            <li>display mean and RMS</li>
            <li>plot x and y ranges</li>
        </ul>
        <br />
        <h4 id="note">NOTE</h4>
        <p>
            For performance reasons, a profile is min-max decimated before rendering if the number of points of the profile is greater than the screen resolution of the Spatial Profiler Widget. The kernel size of profile decimation is
            dynamically adjusted so that profile features are mostly preserved. When decimation is applied, the line style of the profile plot is switched to &quot;line&quot;, regardless of the setting in the Spatial Profiler Settings
            Dialog. When no decimation is applied (e.g., at higher profile zoom level, or profile has fewer points than the screen resolution), the line style becomes &quot;step&quot; (as default in the <b>Styling</b> tab of the Spatial
            Profiler Settings Dialog).
        </p>
    </div>
);
