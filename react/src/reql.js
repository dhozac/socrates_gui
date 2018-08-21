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
import { fetchAPI } from './actions.js';

export default class ReQLView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: "",
      result: "",
      error: false,
    };
  }
  onSubmit() {
    this.setState({result: "Loading..."});
    fetchAPI({
      url: "/gui/reqlapi/",
      data: {query: this.state.query},
      onError: (error) => {
        error.json().then((result) => {
          if (result.hasOwnProperty("query"))
            result = result.query[0];
          this.setState({
            result: result,
            error: true,
          });
        });
      }
    }).then((result) => {
      this.setState({
        result: JSON.stringify(result, null, 2),
        error: false,
      });
    });
  }
  onQueryChange(event) {
    this.setState({query: event.target.value});
  }
  render() {
    var result;
    if (this.state.error) {
      result = (
        <div className="help-block">
          Query is invalid:
          <pre>{this.state.result}</pre>
        </div>
      );
    }
    else if (this.state.result)
      result = (<pre>{this.state.result}</pre>);
    return (
      <div>
        <h2>Think and rethink questions</h2>
        <div className="form-group">
          <label className="control-label" htmlFor="id_query">Query</label>
          <textarea id="id_query" className="form-control" cols="40" name="query" placeholder="Query" rows="2" onChange={this.onQueryChange.bind(this)} value={this.state.query} />
        </div>
        <div className="form-group">
          <button className="btn btn-primary" type="submit" onClick={this.onSubmit.bind(this)}>Submit for consideration</button>
        </div>
        {result}
      </div>
    );
  }
}
