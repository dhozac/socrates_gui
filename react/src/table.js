/*
 * Copyright 2015-2018 Klarna Bank AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

import React from 'react';
import { Pagination, Modal, Button, Glyphicon } from 'react-bootstrap';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';

function pick(obj, field) {
  field.split(".").forEach((part) => {
    if (typeof obj !== "undefined" && obj.hasOwnProperty(part))
      obj = obj[part];
    else
      obj = undefined;
  });
  return obj;
}

const ReactTableConfigureColumn = SortableElement(({value}) => <li style={{position: "flex", userSelect: "none", cursor: "row-resize", zIndex: 20}}>{value}</li>);

const ReactTableConfigureList = SortableContainer(({items}) => {
  return (
    <ol style={{zIndex: 10, position: "relative", listStyleType: "none"}}>
      {items.map((value, index) => (
        <ReactTableConfigureColumn key={`item-${index}`} index={index} value={value.label} />
      ))}
    </ol>
  );
});

class ReactTableConfigure extends React.Component {
  constructor(props) {
    super(props);
    var columns = [];
    for (var i = 0; i < this.props.columns.length; i++)
      columns.push({name: this.props.columns[i], label: this.props.availableColumns[this.props.columns[i]]});
    columns.push({name: null, label: <hr/>});
    for (var column in this.props.availableColumns) {
       if (this.props.columns.indexOf(column) === -1)
         columns.push({name: column, label: this.props.availableColumns[column]});
    }
    this.state = {columns: columns};
  }
  onSortEnd({oldIndex, newIndex}) {
    this.setState({
      columns: arrayMove(this.state.columns, oldIndex, newIndex),
    });
  }
  onHide() {
    var columns = [];
    for (var i = 0; i < this.state.columns.length && this.state.columns[i].name !== null; i++)
      columns.push(this.state.columns[i].name);
    this.props.onConfigure(columns);
    this.props.onHide();
  }
  render() {
    return (
      <Modal show={this.props.show} onHide={this.onHide.bind(this)}>
        <Modal.Header closeButton>
          <Modal.Title>Configure Table</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ReactTableConfigureList items={this.state.columns} onSortEnd={this.onSortEnd.bind(this)} />
        </Modal.Body>
      </Modal>
    );
  }
}

export default class ReactTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      columns: this.props.columns,
      filtering: "",
      page: 0,
      pageSize: this.props.rowsPerPage,
      showConfigure: false,
      sortColumn: this.props.columns[0],
      sortOrder: 1,
    };

    if (this.props.hasOwnProperty("sortColumn"))
      this.state.sortColumn = this.props.sortColumn;
    if (this.props.hasOwnProperty("sortOrder"))
      this.state.sortOrder = this.props.sortOrder;

    var query = {};
    window.location.search.substr(1).split("&").forEach((parameter) => {
      if (!parameter)
        return;
      var ind = parameter.indexOf("=");
      if (ind === -1)
        return;
      query[decodeURIComponent(parameter.substr(0, ind))] = decodeURIComponent(parameter.substr(ind + 1));
    });

    if (query.hasOwnProperty("p"))
      this.state.page = parseInt(query.p, 10) - 1;
    if (query.hasOwnProperty("s"))
      this.state.filtering = query.s;
    if (query.hasOwnProperty("o"))
      this.state.sortColumn = query.o;
    if (query.hasOwnProperty("d"))
      this.state.sortOrder = parseInt(query.d, 10);
  }
  onRowClick(callback, row) {
    return (event) => {
      if (callback) {
        var query = "?";
        if (this.state.filtering)
            query += "s=" + encodeURIComponent(this.state.filtering) + "&";
        if (this.state.page !== 0)
            query += "p=" + (this.state.page + 1) + "&";
        if (this.state.sortColumn)
            query += "o=" + this.state.sortColumn + "&";
        if (this.state.sortOrder)
            query += "d=" + this.state.sortOrder + "&";
        this.props.history.replace({pathname: window.location.pathname, search: query});
        this.props.history.push(callback(row));
      }
    };
  }
  onFilterChange(event) {
    this.setState({filtering: event.target.value});
  }
  onSelectPage(page) {
    this.setState({page: page - 1});
  }
  onHeaderClick(column) {
    return (event) => {
      event.preventDefault();
      if (this.state.sortColumn === column)
        this.setState({sortOrder: this.state.sortOrder * -1});
      else
        this.setState({sortColumn: column, sortOrder: 1});
    };
  }
  render() {
    var column_headers = this.state.columns.map((column, index) => {
      var sorter = (<span></span>);
      if (column === this.state.sortColumn) {
        if (this.state.sortOrder === 1)
          sorter = (<Glyphicon glyph="chevron-up" />);
        else
          sorter = (<Glyphicon glyph="chevron-down" />);
      }
      return (<th key={'col' + index}><Button bsStyle="default" onClick={this.onHeaderClick(column)}>{this.props.availableColumns[column]} {sorter}</Button></th>);
    });
    var rows = this.props.data.sort((a, b) => {
      var av = pick(a, this.state.sortColumn);
      var bv = pick(b, this.state.sortColumn);
      if (typeof av === "undefined" && typeof bv === "undefined")
        return 0;
      else if (typeof av === "undefined")
        return this.state.sortOrder * -1;
      else if (typeof bv === "undefined")
        return this.state.sortOrder * 1;
      else
        return (this.state.sortOrder *
          (av > bv ? 1 :
          (av < bv ? -1 :
           0)));
    }).map((row) => {
      return [row, this.state.columns.map((column) => {
        return pick(row, column);
      })];
    }).filter((row) => {
      if (!this.state.filtering)
        return true;
      var matched = row[1].filter((column) => {
        return typeof column !== 'undefined' &&
          column !== null &&
          ((typeof column.indexOf !== 'undefined' &&
              column.toUpperCase().indexOf(this.state.filtering.toUpperCase()) !== -1) ||
            column === this.state.filtering);
      });
      return matched.length > 0;
    }).map((row) => {
      var columns = row[1].map((column, column_index) => {
        return (<td key={'col' + column_index}>{column}</td>);
      });
      return (<tr onClick={this.onRowClick(this.props.onRowClick, row[0])} key={row[1][0]}>{columns}</tr>);
    });
    var last_page = Math.ceil(rows.length / this.state.pageSize);
    if (rows.length > this.state.pageSize) {
      rows = rows.slice(this.state.pageSize * this.state.page, this.state.pageSize * (this.state.page + 1));
    }
    var footer = (
      <tr key="pagerRow">
        <td colSpan={this.state.columns.length} style={{textAlign: "center"}}>
          <Pagination
            prev next ellipsis boundaryLinks
            activePage={this.state.page + 1}
            items={last_page}
            maxButtons={5}
            onSelect={this.onSelectPage.bind(this)}
            />
        </td>
      </tr>
    );
    return (
      <div>
        <input type="text" value={this.state.filtering} placeholder="Search..." onChange={this.onFilterChange.bind(this)} />
        <Button onClick={(event) => this.setState({showConfigure: true})}><Glyphicon glyph="cog" /></Button>
        <ReactTableConfigure
          show={this.state.showConfigure}
          columns={this.state.columns}
          availableColumns={this.props.availableColumns}
          onHide={() => this.setState({showConfigure: false})}
          onConfigure={(columns) => this.setState({columns: columns})}
          />
        <br />
        <table className="table table-striped">
          <thead>
            <tr>
              {column_headers}
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
          <tfoot key="pager">
            {footer}
          </tfoot>
        </table>
      </div>
    );
  }
}
