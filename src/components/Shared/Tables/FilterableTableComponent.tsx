import * as React from "react";
import {Checkbox, Classes, Icon, InputGroup, Label, Position, Tooltip} from "@blueprintjs/core";
import {IconName} from "@blueprintjs/icons";
import {Cell, Column, ColumnHeaderCell, Region, RenderMode, SelectionModes, Table2} from "@blueprintjs/table";
import {RowIndices} from "@blueprintjs/table/lib/esm/common/grid";
import {CARTA} from "carta-protobuf";
import classNames from "classnames";
import {observer} from "mobx-react";

import {CatalogType} from "models";
import {CatalogApiService} from "services";
import {AppStore, ControlHeader} from "stores";
import {SpectralLineHeaders} from "stores/Widgets";
import {ProcessedColumnData} from "utilities";

import "./FilterableTableComponent.scss";

export type ColumnFilter = {index: number; columnFilter: string};

enum RowSelectionType {
    None,
    Indeterminate,
    All
}

const KEYCODE_ENTER = 13;

export class FilterableTableComponentProps {
    dataset: Map<number, ProcessedColumnData>;
    filter?: Map<string, ControlHeader>;
    columnHeaders: Array<CARTA.ICatalogHeader>;
    numVisibleRows: number;
    columnWidths?: Array<number>;
    loadingCell?: boolean;
    selectedDataIndex?: number[];
    showSelectedData?: boolean;
    updateTableRef?: (ref: Table2) => void;
    updateColumnFilter?: (value: string, columnName: string) => void;
    updateByInfiniteScroll?: (rowIndexEnd: number) => void;
    updateTableColumnWidth?: (width: number, columnName: string) => void;
    updateSelectedRow?: (dataIndex: number[]) => void;
    updateSortRequest?: (columnName: string, sortingType: CARTA.SortingType, columnIndex: number) => void;
    flipRowSelection?: (rowIndex: number) => void;
    sortingInfo?: {columnName: string; sortingType: CARTA.SortingType};
    disableSort?: boolean;
    tableHeaders?: Array<CARTA.ICatalogHeader>;
    sortedIndexMap?: Array<number>;
    sortedIndices?: Array<number>;
    onCompleteRender?: () => void;
    catalogType?: CatalogType;
    applyFilterWithEnter?: () => void;
}

@observer
export class FilterableTableComponent extends React.Component<FilterableTableComponentProps> {
    private readonly SortingTypelinkedList = {
        head: {
            value: null,
            next: {
                value: CARTA.SortingType.Ascending,
                next: {
                    value: CARTA.SortingType.Descending,
                    next: null
                }
            }
        }
    };

    private getFilterSyntax = (dataType: CARTA.ColumnType) => {
        const className = "column-popover-content";
        switch (dataType) {
            case CARTA.ColumnType.String:
                return (
                    <div className={className}>
                        <small>Filter by substring</small>
                        <br />
                        <small>e.g. gal (no quotation, entries contain the "gal" string)</small>
                    </div>
                );
            case CARTA.ColumnType.Bool:
                return (
                    <div className={className}>
                        <small>Filter by boolean value</small>
                        <br />
                        <small>e.g. "True" or "T", "False" or "F", case insensitive</small>
                    </div>
                );
            case CARTA.ColumnType.Double:
            default:
                return (
                    <div className={className}>
                        <small>
                            Operators: {">"}, {">="}, {"<"}, {"<="}, {"=="}, {"!="}, {".."}, {"..."}
                        </small>
                        <br />
                        <small>e.g. {"<"} 10 (everything less than 10) </small>
                        <br />
                        <small>e.g. == 1.23 (entries equal to 1.23) </small>
                        <br />
                        <small>e.g. 10..50 (everything between 10 and 50, exclusive)) </small>
                        <br />
                        <small>e.g. 10...50 (everything between 10 and 50, inclusive) </small>
                    </div>
                );
        }
    };

    private renderCheckboxColumnHeaderCell = (columnIndex: number, columnHeader: CARTA.ICatalogHeader, columnData: any, selectionType: RowSelectionType) => {
        const controlHeader = this.props.filter?.get(columnHeader.name);
        const filterSyntax = this.getFilterSyntax(columnHeader.dataType);
        return (
            <ColumnHeaderCell>
                <ColumnHeaderCell>
                    <Checkbox
                        indeterminate={selectionType === RowSelectionType.Indeterminate}
                        checked={selectionType === RowSelectionType.All}
                        inline={true}
                        onChange={() => {
                            if (selectionType === RowSelectionType.None || selectionType === RowSelectionType.All) {
                                columnData?.forEach((isSelected, rowIndex) => this.props.flipRowSelection(rowIndex));
                            } else {
                                columnData?.forEach((isSelected, rowIndex) => {
                                    if (isSelected) {
                                        this.props.flipRowSelection(rowIndex);
                                    }
                                });
                            }
                        }}
                        data-testid="filterable-table-header-checkbox"
                    />
                </ColumnHeaderCell>
                <ColumnHeaderCell isActive={controlHeader?.filter !== ""}>
                    <Tooltip hoverOpenDelay={250} hoverCloseDelay={0} content={filterSyntax} position={Position.BOTTOM}>
                        <InputGroup
                            key={"column-popover-" + columnIndex}
                            small={true}
                            placeholder="Click to filter"
                            value={controlHeader?.filter ?? ""}
                            onChange={ev => this.props.updateColumnFilter(ev.currentTarget.value, columnHeader.name)}
                        />
                    </Tooltip>
                </ColumnHeaderCell>
            </ColumnHeaderCell>
        );
    };

    private renderCheckboxCell = (rowIndex: number, columnIndex: number, columnData: any) => {
        return (
            <Cell key={`cell_${columnIndex}_${rowIndex}`} interactive={false}>
                <React.Fragment>{rowIndex < columnData?.length ? <Checkbox checked={columnData[rowIndex]} onChange={() => this.props.flipRowSelection(rowIndex)} /> : null}</React.Fragment>
            </Cell>
        );
    };

    private renderCheckboxColumn = (columnHeader: CARTA.ICatalogHeader, columnData: any) => {
        let selected = 0;
        columnData?.forEach(isSelected => (selected += isSelected ? 1 : 0));
        const selectionType = selected === 0 ? RowSelectionType.None : selected === columnData?.length ? RowSelectionType.All : RowSelectionType.Indeterminate;

        return (
            <Column
                key={columnHeader.name}
                name={columnHeader.name}
                columnHeaderCellRenderer={(columnIndex: number) => this.renderCheckboxColumnHeaderCell(columnIndex, columnHeader, columnData, selectionType)}
                cellRenderer={columnData?.length ? (rowIndex, columnIndex) => this.renderCheckboxCell(rowIndex, columnIndex, columnData) : undefined}
            />
        );
    };

    private renderDataColumnWithFilter = (columnHeader: CARTA.ICatalogHeader, columnData: Array<any> | NodeJS.TypedArray) => {
        return (
            <Column
                key={columnHeader.name}
                name={columnHeader.name}
                columnHeaderCellRenderer={(columnIndex: number) => this.renderColumnHeaderCell(columnIndex, columnHeader)}
                cellRenderer={columnData?.length ? (rowIndex, columnIndex) => this.renderCell(rowIndex, columnIndex, columnData, columnHeader) : undefined}
            />
        );
    };

    private renderCell = (index: number, columnIndex: number, columnData: Array<any> | NodeJS.TypedArray, columnHeader: CARTA.ICatalogHeader) => {
        const dataIndex = this.props.selectedDataIndex;
        let rowIndex = index;
        if (this.props.sortedIndexMap) {
            rowIndex = this.props.showSelectedData ? this.props.sortedIndices[rowIndex] : this.props.sortedIndexMap[rowIndex];
        }
        let cellContext = rowIndex < columnData.length ? columnData[rowIndex] : "";
        if (typeof cellContext === "boolean" && this.props.catalogType === CatalogType.FILE) {
            cellContext = cellContext.toString();
        }
        let cell = cellContext;
        if (this.props.catalogType === CatalogType.SIMBAD) {
            if (columnHeader.name?.toLocaleLowerCase().includes("bibcode")) {
                cell = (
                    <a href={`${CatalogApiService.SimbadHyperLink.bibcode}${cellContext}`} target="_blank" rel="noopener noreferrer">
                        {cellContext}
                    </a>
                );
            }

            if (columnHeader.name?.toLocaleLowerCase().includes("main_id")) {
                cell = (
                    <a href={`${CatalogApiService.SimbadHyperLink.mainId}${cellContext}`} target="_blank" rel="noopener noreferrer">
                        {cellContext}
                    </a>
                );
            }
        }
        const selected = dataIndex && dataIndex.includes(index) && !this.props.showSelectedData;
        return (
            <Cell key={`cell_${columnIndex}_${rowIndex}`} intent={selected ? "danger" : "none"} loading={this.isLoading(rowIndex)} interactive={false}>
                <>
                    <div data-testid={"filterable-table-" + rowIndex + "-" + columnIndex}>{cell}</div>
                </>
            </Cell>
        );
    };

    private getNextSortingType = () => {
        const sortingInfo = this.props.sortingInfo;
        let currentNode = this.SortingTypelinkedList.head;
        while (currentNode.next) {
            if (currentNode.value === sortingInfo.sortingType) {
                return currentNode.next.value;
            }
            currentNode = currentNode.next;
        }
        return null;
    };

    private renderColumnHeaderCell = (columnIndex: number, column: CARTA.ICatalogHeader) => {
        if (!isFinite(columnIndex) || !column) {
            return null;
        }
        const controlheader = this.props.filter?.get(column.name);
        const filterSyntax = this.getFilterSyntax(column.dataType);
        const sortingInfo = this.props.sortingInfo;
        const headerDescription = this.props.tableHeaders?.[controlheader?.dataIndex]?.description;
        const disableSort = this.props.disableSort;
        const nameRenderer = () => {
            // sharing css with fileList table
            let sortIcon = "sort";
            let iconClass = "sort-icon inactive";
            let nextSortType = 0;
            if (sortingInfo?.columnName === column.name) {
                nextSortType = this.getNextSortingType();
                if (sortingInfo?.sortingType === CARTA.SortingType.Descending) {
                    sortIcon = "sort-desc";
                    iconClass = "sort-icon";
                } else if (sortingInfo?.sortingType === CARTA.SortingType.Ascending) {
                    sortIcon = "sort-asc";
                    iconClass = "sort-icon";
                }
            }
            return (
                <div className="sort-label" onClick={() => (disableSort ? null : this.props.updateSortRequest(column.name, nextSortType, column.columnIndex))}>
                    <Label disabled={disableSort} className={classNames(Classes.INLINE, "label")} data-testid={"filterable-table-header-" + columnIndex}>
                        <Icon className={iconClass} icon={sortIcon as IconName} />
                        <Tooltip hoverOpenDelay={250} hoverCloseDelay={0} content={headerDescription ?? "Description not avaliable"} position={Position.BOTTOM} popoverClassName={classNames({[Classes.DARK]: AppStore.Instance.darkTheme})}>
                            {column.name}
                        </Tooltip>
                    </Label>
                </div>
            );
        };

        return (
            <ColumnHeaderCell>
                <ColumnHeaderCell className={"column-name"} nameRenderer={nameRenderer} />
                <ColumnHeaderCell isActive={controlheader?.filter !== ""}>
                    <Tooltip hoverOpenDelay={250} hoverCloseDelay={0} content={filterSyntax} position={Position.BOTTOM}>
                        <InputGroup
                            key={"column-popover-" + columnIndex}
                            small={true}
                            placeholder="Click to filter"
                            value={controlheader?.filter ?? ""}
                            onChange={ev => this.props.updateColumnFilter(ev.currentTarget.value, column.name)}
                            onKeyDown={this.handleKeyDown}
                            data-testid={"filterable-table-filter-input-" + columnIndex}
                        />
                    </Tooltip>
                </ColumnHeaderCell>
            </ColumnHeaderCell>
        );
    };

    private handleKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
        if (ev.type === "keydown" && ev.keyCode === KEYCODE_ENTER && this.props.applyFilterWithEnter) {
            this.props.applyFilterWithEnter();
        }
    };

    private isLoading(rowIndex: number): boolean {
        if (this.props.loadingCell && rowIndex + 4 > this.props.numVisibleRows) {
            return true;
        }
        return false;
    }

    private infiniteScroll = (rowIndices: RowIndices) => {
        // rowIndices offset around 5 form blueprintjs tabel
        const currentIndex = rowIndices.rowIndexEnd + 1;
        if (rowIndices.rowIndexEnd > 0 && currentIndex >= this.props.numVisibleRows && !this.props.loadingCell && !this.props.showSelectedData) {
            this.props.updateByInfiniteScroll?.(rowIndices.rowIndexEnd);
        }
    };

    private updateTableColumnWidth = (index: number, size: number) => {
        const header = this.props.columnHeaders[index];
        if (header && this.props.updateTableColumnWidth) {
            this.props.updateTableColumnWidth(size, header.name);
        }
    };

    private onRowIndexSelection = (selectedRegions: Region[]) => {
        if (selectedRegions.length > 0) {
            let selectedDataIndex = [];
            for (let i = 0; i < selectedRegions.length; i++) {
                const region = selectedRegions[i];
                const start = region.rows[0];
                const end = region.rows[1];
                if (start === end) {
                    selectedDataIndex.push(start);
                } else {
                    for (let j = start; j <= end; j++) {
                        selectedDataIndex.push(j);
                    }
                }
            }
            this.props.updateSelectedRow?.(selectedDataIndex);
        }
    };

    render() {
        const table = this.props;
        const tableColumns = [];
        const tableData = table.dataset;
        let lineSelectionIndex: number;
        table.columnHeaders?.forEach(header => {
            const columnIndex = header.columnIndex;
            let dataArray = tableData.get(columnIndex)?.data;
            const column = header.name === SpectralLineHeaders.LineSelection && this.props.flipRowSelection ? this.renderCheckboxColumn(header, dataArray) : this.renderDataColumnWithFilter(header, dataArray);
            tableColumns.push(column);
            if (header.name === SpectralLineHeaders.LineSelection) {
                lineSelectionIndex = columnIndex;
            }
        });

        const tableCheckData = this.props.dataset.get(lineSelectionIndex)?.data.slice();

        const className = classNames("column-filter-table", {[Classes.DARK]: AppStore.Instance.darkTheme});

        return (
            <Table2
                className={className}
                ref={table.updateTableRef ?? null}
                numRows={table.numVisibleRows}
                renderMode={RenderMode.BATCH}
                enableRowReordering={false}
                selectionModes={SelectionModes.ROWS_AND_CELLS}
                onVisibleCellsChange={this.infiniteScroll}
                onColumnWidthChanged={this.updateTableColumnWidth}
                enableGhostCells={true}
                onSelection={this.onRowIndexSelection}
                enableMultipleSelection={true}
                enableRowResizing={false}
                columnWidths={table.columnWidths}
                onCompleteRender={table.onCompleteRender}
                cellRendererDependencies={[tableCheckData]} // trigger re-render on line selection change
            >
                {tableColumns}
            </Table2>
        );
    }
}
