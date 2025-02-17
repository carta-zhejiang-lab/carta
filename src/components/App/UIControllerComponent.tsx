import * as React from "react";
import {observer} from "mobx-react";

import {HelpDrawerComponent, RootMenuComponent, SplashScreenComponent} from "components";
import {
    AboutDialogComponent,
    CodeSnippetDialogComponent,
    ContourDialogComponent,
    ExternalPageDialogComponent,
    FileBrowserDialogComponent,
    FileInfoDialogComponent,
    FittingDialogComponent,
    OnlineDataQueryDialogComponent,
    PreferenceDialogComponent,
    RegionDialogComponent,
    SaveLayoutDialogComponent,
    ShareWorkspaceDialogComponent,
    StokesDialogComponent,
    TelemetryDialogComponent,
    VectorOverlayDialogComponent,
    WorkspaceDialogComponent
} from "components/Dialogs";

@observer
export class UIControllerComponent extends React.Component {
    render() {
        return (
            <React.Fragment>
                <RootMenuComponent />
                <RegionDialogComponent />
                <OnlineDataQueryDialogComponent />
                <ContourDialogComponent />
                <VectorOverlayDialogComponent />
                <FileInfoDialogComponent />
                <FileBrowserDialogComponent />
                <PreferenceDialogComponent />
                <SaveLayoutDialogComponent />
                <WorkspaceDialogComponent />
                <ShareWorkspaceDialogComponent />
                <CodeSnippetDialogComponent />
                <AboutDialogComponent />
                <ExternalPageDialogComponent />
                <HelpDrawerComponent />
                <StokesDialogComponent />
                <TelemetryDialogComponent />
                <SplashScreenComponent />
                <FittingDialogComponent />
            </React.Fragment>
        );
    }
}
