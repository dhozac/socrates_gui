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

class Task extends React.Component {
    render() {
        var ack_state = null;
        var task = null;
        var task_name = "Unknown";
        var service_tag = null;
        var asset_id = null;
        var server = "N/A";
        if (this.props.task.hasOwnProperty("ops_acked") && this.props.task.ops_acked)
            ack_state = (<div>Acked</div>);
        else
            ack_state = (
                <div>
                    <button className="btn btn-success" onClick={this.handleAck.bind(this)}>Ack</button>
                    <button className="btn btn-primary" onClick={this.handleRerun.bind(this)}>Rerun task</button>
                </div>
            );
        if (this.props.task.task.hasOwnProperty("payload")) {
            task = JSON.parse(atob(this.props.task.task.payload.body));
            task_name = this.props.task.task.payload.headers.task;
            if (task[0].length > 0) {
                if (task[0][0].hasOwnProperty("service_tag"))
                    service_tag = task[0][0].service_tag;
                if (task[0][0].hasOwnProperty("id"))
                    asset_id = task[0][0].id;
                if (task_name === "socrates_api.tasks.extract_asset_from_raw")
                    service_tag = task[0][0];
            }
            server = this.props.task.task.claimed_by[0];
        }
        return (
            <li>
                <div className="well">
                    <strong>ID</strong>: {this.props.task.id}<br />
                    <strong>Date</strong>: {this.props.task.date_done}<br />
                    <strong>Server</strong>: {server}<br />
                    <strong>Task</strong>: {task_name}<br />
                    <strong>Service tag</strong>: {service_tag}<br />
                    <strong>Asset ID</strong>: {asset_id}<br />
                    <strong>Result</strong>: {this.getResult()}<br />
                    <strong>Traceback</strong><br />
                    <pre>{this.props.task.traceback}</pre>
                    {ack_state}
                </div>
            </li>
        );
    }
    getResult() {
        return JSON.stringify(this.props.task.result);
    }
    patchResult(data, callback) {
        fetchAPI({
            method: "PATCH",
            url: "/task/result/" + this.props.task.id,
            data: data,
        }).then(callback);
    }
    handleAck() {
        this.patchResult({ops_acked: true}, (data) => {
            data.task = this.props.task.task;
            this.props.onSetTask(data);
        });
    }
    handleRerun() {
        fetchAPI({
            method: "PATCH",
            url: "/task/queue/" + this.props.task.id,
            data: {claimed_by: []},
        });
        this.patchResult({status: "RERUN", ops_acked: true}, (data) => {
            data.task = this.props.task.task;
            this.props.onSetTask(data);
        });
    }
}

export default class TasksView extends React.Component {
    componentWillMount() {
        this.props.triggerFetchTasks();
    }
    render() {
        var tasks = this.props.tasks.map((task) => {
            return (<Task key={task.id} task={task} onSetTask={this.props.onSetTask} />);
        });
        if (!this.props.loaded)
            return (
                    <p>Loading!</p>
                   );
        if (Object.keys(tasks).length === 0)
            return (
                    <p>No failed tasks!</p>
                   );
        else
            return (
                <ol className="list-unstyled">
                    {tasks}
                </ol>
            );
    }
}
