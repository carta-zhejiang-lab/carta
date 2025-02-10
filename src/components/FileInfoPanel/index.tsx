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

        await store.openFile("", "", this.state.selectedHdu ? this.state.selectedHdu : "", null, true, store.fileParams.isPersonalData, store.fileParams.id, store.fileParams.level);

        // await store.openFile(".", "CSST_MSC_MS_SCI_20230425170015_20230425170245_10109200074165_23_L0_V01.fits", this.state.selectedHdu ? this.state.selectedHdu : "");
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

        const data = Object.keys(store.fileResponse?.fileInfoExtended || {}).length > 0 ? store.fileResponse?.fileInfoExtended[this.state.selectedHdu || Object.keys(store.fileResponse?.fileInfoExtended)[0]] : {};
        return (
            <div className={`file-info-panel ${store.fileParams && +store.fileParams.level === 2 ? "file-info-panel-full" : ""}`}>
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
                        data?.computedEntries?.map(i => {
                            return (
                                <div className="file-info-item">
                                    <div className="file-info-item-label">{i.name}</div>
                                    <div className="file-info-item-value">= {i.value}</div>
                                    <div className="file-info-item-comment"></div>
                                </div>
                            );
                        })}

                    {this.state.selectedTab === "header" &&
                        data?.headerEntries?.map(i => {
                            return (
                                <div className="file-info-item">
                                    <div className="file-info-item-label">{i.name}</div>
                                    {i.value && <div className="file-info-item-value">= {i.value}</div>}
                                    {i.comment && <div className="file-info-item-comment">/ {i.comment}</div>}
                                </div>
                            );
                        })}
                </div>
                {store.fileParams && +store.fileParams.level !== 2 && (
                    <div className="file-info-panel-bottom">
                        <div className="file-info-button" onClick={this.onLoadFile}>
                            加载
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
