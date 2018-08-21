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

import React from 'react';
import { ButtonGroup, Button } from 'react-bootstrap';
import ReactDiff from './diff.js';
import ReactTable from './table.js';
import { fetchAPI } from './actions.js';

function object_merge(obj1, obj2) {
  for (var i in obj2) {
    if (!obj2.hasOwnProperty(i))
      continue;
    if (typeof obj2[i] === "object") {
      if (typeof obj1[i] !== "undefined")
        obj1[i] = object_merge(obj1[i], obj2[i]);
      else
        obj1[i] = obj2[i];
    }
    else
      obj1[i] = obj2[i];
  }
  return obj1;
}

export class ReviewView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      original: undefined,
      got_original: false,
    };
    this.terminal_states = ["rejected", "executed", "invalidated"];
  }
  componentWillMount() {
    if (!this.props.loaded)
      this.props.triggerFetchReviews();
  }
  getOriginal() {
    if (this.state.got_original)
      return;
    this.setState({got_original: true});
    fetchAPI({
      method: "GET",
      url: "/history/" + this.review.object_type + "/" + this.review.object_id,
    }).then((response) => {
      /* If this review has been completed, find the version before it was.
       * Otherwise, get the latest version.
       */
      var last = undefined;
      for (var i = 0; i < response.length; i++) {
        if (typeof last === "undefined" ||
            (response[i].timestamp > last.timestamp &&
              (this.terminal_states.indexOf(this.review.state) === -1 ||
                response[i].timestamp <= this.review.updated)))
          last = response[i];
      }
      if (typeof last === "undefined")
        this.setState({original: null});
      else
        this.setState({original: last.object});
    }, (error) => {
      this.setState({original: null});
    });
  }
  approve() {
    fetchAPI({
      method: "PATCH",
      url: "/review/" + this.review.id,
      data: {
        approvals: (typeof this.review.approvals === "undefined" ?
          [] : this.review.approvals).concat([this.props.user.username]),
      }
    }).then((response) => {
       this.props.setReview(response);
    });
  }
  reject() {
    fetchAPI({
      method: "PATCH",
      url: "/review/" + this.review.id,
      data: {
        state: 'rejected',
      }
    }).then((response) => {
       this.props.setReview(response);
    });
  }
  execute() {
    fetchAPI({
      method: "PATCH",
      url: "/review/" + this.review.id,
      data: {
        state: 'executed',
      }
    }).then((response) => {
       this.props.setReview(response);
    });
  }
  render() {
    this.review = this.props.reviews.filter((review) => { return review.id === this.props.match.params.id; })[0];
    if (typeof this.review === "undefined")
      return (<div className="container"></div>);
    this.getOriginal();
    var actions = [];
    if (this.terminal_states.indexOf(this.review.state) === -1) {
      if ((typeof this.review.approvals === "undefined" ||
           this.review.approvals.indexOf(this.props.user.username) === -1) &&
          this.props.user.username !== this.review.submitter)
        actions.push(
          <Button bsStyle="success" onClick={this.approve.bind(this)} key="approve">
            Approve
          </Button>
        );
      actions.push(
        <Button bsStyle="danger" onClick={this.reject.bind(this)} key="reject">
          Reject
        </Button>
      );
      if (this.review.state === "approved")
        actions.push(
          <Button bsStyle="primary" onClick={this.execute.bind(this)} key="execute">
            Execute
          </Button>
        );
    }
    var diff = [];
    if (typeof this.state.original !== "undefined") {
      var inputa = this.state.original;
      var inputb;
      if (this.review.is_partial) {
        inputb = JSON.parse(JSON.stringify(inputa));
        inputb = object_merge(inputb, this.review.object);
      }
      else
        inputb = this.review.object;
      diff = (<ReactDiff before={inputa} after={inputb} key="diff" />);
    }
    return (
      <div className="container">
        <dl className="dl-horizontal">
          <dt>Created</dt><dd>{this.review.created}</dd>
          <dt>State</dt><dd>{this.review.state}</dd>
          <dt>Submitter</dt><dd>{this.review.submitter}</dd>
          <dt>Reviewers</dt><dd>{this.review.reviewers.join(", ")}</dd>
          <dt>Approvals required</dt><dd>{this.review.approvals_required}</dd>
          <dt>Approved by</dt><dd>{this.review.approvals.join(", ")}</dd>
          <dt>Object type</dt><dd>{this.review.object_type}</dd>
        </dl>
        {diff}
        <ButtonGroup>
          {actions}
        </ButtonGroup>
      </div>
    );
  }
}

export class ReviewsView extends React.Component {
  componentWillMount() {
    this.props.triggerFetchReviews();
  }
  onRowClick(row) {
    return "/gui/review/" + encodeURIComponent(row.id);
  }
  render() {
    return (
      <ReactTable columns={["created", "state", "submitter", "object_type"]}
        availableColumns={{
          created: "Created",
          state: "State",
          submitter: "Submitter",
          object_type: "Object type",
        }}
        data={this.props.reviews} rowsPerPage={20} onRowClick={this.onRowClick}
        history={this.props.history} sortColumn={"created"} sortOrder={-1} />
    );
  }
}
