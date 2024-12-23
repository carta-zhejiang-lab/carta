// @ts-nocheck
import "./index.scss";
import * as React from "react";
import classNames from "classnames";
import {observer} from "mobx-react";
import {AppStore} from "stores";

@observer
export default class FileInfoPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedTab: "file",
            selectedHdu: ""
        };
    }

    onLoadFile = async () => {
        const store = AppStore.Instance;
        await store.openFile(".", "CSST_MSC_MS_SCI_20231128175332_20231128175602_10109200108743_01_L1_V01.fits", this.state.selectedHdu ? this.state.selectedHdu : "");

        // await store.openFile(".", "testkeys.fits", this.state.selectedHdu ? this.state.selectedHdu : "");
    };

    render() {
        const store = AppStore.Instance;
        const options =
            Object.keys(store.fileResponse?.fileInfoExtended || {}).length > 1
                ? Object.keys(store.fileResponse?.fileInfoExtended || {})
                      .map(key => {
                          const value = store.fileResponse?.fileInfoExtended[key];
                          let name = value.computedEntries.find(j => j.name === "Extension name");
                          let hdu = value.computedEntries.find(j => j.name === "HDU");
                          if (name && hdu) {
                              return {name: name.value, hdu: hdu.value};
                          }
                          return null;
                      })
                      .filter(Boolean)
                : null;

        const data = Object.keys(store.fileResponse?.fileInfoExtended || {}).length > 1 ? store.fileResponse?.fileInfoExtended[this.state.selectedHdu || "1"] : store.fileResponse?.fileInfoExtended[this.state.selectedHdu || "0"];
        return (
            <div className="file-info-panel">
                <div className="file-info-panel-title">
                    <div className="file-info-panel-left">
                        <div
                            className={classNames("file-info-panel-title-item", {
                                "file-info-panel-title-item-active": this.state.selectedTab === "file"
                            })}
                            onClick={() => {
                                this.setState({
                                    selectedTab: "file"
                                });
                            }}
                        >
                            文件信息
                        </div>
                        <div
                            className={classNames("file-info-panel-title-item", {
                                "file-info-panel-title-item-active": this.state.selectedTab === "header"
                            })}
                            onClick={() => {
                                this.setState({
                                    selectedTab: "header"
                                });
                            }}
                        >
                            Header信息
                        </div>
                        <div className="file-info-panel-border" />
                    </div>
                    {options && (
                        <div className="file-info-panel-right">
                            HDU:&nbsp;&nbsp;
                            <select
                                value={this.state.selectedHdu}
                                onChange={e => {
                                    console.log("ee", e, e.target.value);
                                    this.setState({
                                        selectedHdu: e.target.value
                                    });
                                }}
                            >
                                {options.map((i, index) => (
                                    <option value={i.hdu}>
                                        {i.hdu}:{i.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <div className="file-info-panel-content">
                    {this.state.selectedTab === "file" &&
                        data?.computedEntries.map(i => {
                            return (
                                <div className="file-info-item">
                                    <div className="file-info-item-label">{i.name}</div>
                                    <div className="file-info-item-value">= {i.value}</div>
                                    <div className="file-info-item-comment"></div>
                                </div>
                            );
                        })}

                    {this.state.selectedTab === "header" &&
                        data?.headerEntries.map(i => {
                            return (
                                <div className="file-info-item">
                                    <div className="file-info-item-label">{i.name}</div>
                                    {i.value && <div className="file-info-item-value">= {i.value}</div>}
                                    {i.comment && <div className="file-info-item-comment">/ {i.comment}</div>}
                                </div>
                            );
                        })}
                </div>
                <div className="file-info-panel-bottom">
                    <div className="file-info-button" onClick={this.onLoadFile}>
                        加载
                    </div>
                </div>
            </div>
        );
    }
}
