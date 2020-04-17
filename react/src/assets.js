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
import { Tabs, Tab, FormGroup, InputGroup, FormControl, DropdownButton, MenuItem, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import filesize from 'filesize';
import ReactDiff from './diff.js';
import ReactTable from './table.js';
import { fetchAPI } from './actions.js';
var $ = require('jquery');

export class AssetView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            key: "data",
            power: "Unknown",
        };
    }
    handleSelect(key) {
        if (key === "back")
            this.props.history.goBack();
        else
            this.setState({key: key});
    }
    componentDidMount() {
        if (typeof this.asset !== "undefined")
            fetchAPI({url: "/asset/" + encodeURIComponent(this.asset.id) + "/ipmi/"})
              .then((power) => this.setState({power: power ? power['power_state'] : "Unknown"}));
    }
    render() {
        this.asset = this.props.assets.filter((asset) => { return asset.service_tag === decodeURIComponent(this.props.match.params.service_tag); })[0];
        var extraProps = {
            asset: this.asset,
        };
        if (typeof this.asset === "undefined") {
            if (this.props.assets.length > 0)
                return (
                    <Alert bsStyle="danger">
                        <p>The asset with service tag {decodeURIComponent(this.props.match.params.service_tag)} was not found.</p>
                    </Alert>
                );
            else
                return (<div></div>);
        }
        else {
            var data = [
                (<div class="row" key="service_tag">
                    <div class="col-sm-4">Service tag</div>
                    <div class="col-sm-8">{this.asset.service_tag}</div>
                </div>)
            ];
            if (this.asset.asset_type === "server" || this.asset.asset_type === "vm") {
                data.push(
                    <div class="row" key="power">
                        <div class="col-sm-4">Power state</div>
                        <div class="col-sm-8">{this.state.power}</div>
                    </div>
                );
                if (typeof this.asset.cpu !== "undefined")
                    data.push(
                        <div class="row" key="cpus">
                            <div class="col-sm-4">CPU(s)</div>
                            <div class="col-sm-8">{this.asset.cpu.length} x {this.asset.cpu[0]}</div>
                        </div>
                    );
                if (typeof this.asset.ram !== "undefined") {
                    var extra = "";
                    if (this.asset.ram.hasOwnProperty("slots")) {
                        var populated_slots = Object.values(this.asset.ram.slots)
                            .map((slot) => (slot.size || 0))
                            .reduce(function (slots_by_size, value) { slots_by_size[value] = (slots_by_size[value] || 0) + 1; return slots_by_size; }, {});
                        Object.keys(populated_slots).sort((a, b) => { return b - a; }).forEach((size) => {
                             extra += ", " + populated_slots[size] + " x " + (size !== "0" ? filesize(size) : "empty");
                        });
                    }
                    data.push(
                        <div class="row" key="ram">
                            <div class="col-sm-4">RAM</div>
                            <div class="col-sm-8">{filesize(this.asset.ram.total)}{extra}</div>
                        </div>
                    );
                }
            }
            return (
                <Tabs id="asset_tabs" activeKey={this.state.key} onSelect={this.handleSelect.bind(this)}>
                    <Tab eventKey="back" title="&larr; Back"></Tab>
                    <Tab eventKey="data" title="Data">
                        {data}
                        <p>Complete asset:</p>
                        <pre>{JSON.stringify(this.asset, null, 2)}</pre>
                    </Tab>
                    <Tab eventKey="ipmi" title="Actions">
                        <div></div>
                        <div>
                            <AssetManagementLink {...this.props} {...extraProps}/>
                            <AssetWarranty {...this.props} {...extraProps}/>
                        </div>
                        <div></div>
                        <div><AssetPowerManagement {...this.props} {...extraProps}/></div>
                        <div></div>
                        <div><AssetMaintenance {...this.props} {...extraProps}/></div>
                        <div></div>
                        <div><AssetDelete {...this.props} {...extraProps}/></div>
                    </Tab>
                    <Tab eventKey="log" title="Log">
                        <h3>Log</h3>
                        <AssetHistory {...this.props} {...extraProps}/>
                    </Tab>
                    <Tab eventKey="events" title="Events">
                        <h3>Events</h3>
                        <AssetEvents {...this.props} {...extraProps}/>
                    </Tab>
                </Tabs>
            );
        }
    }
}

class AssetManagementLink extends React.Component {
    render() {
        if (this.props.asset.asset_type === 'server')
            if (this.props.asset.hasOwnProperty('oob') && this.props.asset.hasOwnProperty('vendor') && this.props.asset.vendor === 'Dell Inc.')
                return (
                    <a href={'/gui/asset/' + encodeURIComponent(this.props.asset.service_tag) + '/console/'} className="btn btn-primary" role="button">Console</a>
                );
            else if (this.props.user.is_superuser || this.props.user.is_console_user)
                return (<a href={'/gui/asset/' + encodeURIComponent(this.props.asset.service_tag) + '/management/'} className="btn btn-primary" role="button">Management</a>);
            else
                return (<span/>);
        else if (this.props.asset.asset_type === 'vm' && this.props.asset.asset_subtype === 'libvirt')
            return (
                <a href={'/gui/asset/' + encodeURIComponent(this.props.asset.service_tag) + '/console/'} className="btn btn-primary" role="button">Console</a>
                );
        else
            return (<span/>);
    }
}

class AssetHistoryEntry extends React.Component {
    constructor(props) {
        super(props);
        this.state = {diff: false};
    }
    render() {
        var button_label = "Show diff";
        var diff = null;
        if (this.state.diff) {
            button_label = "Hide diff";
            var inputa = $.extend({}, this.props.prev_entry.object);
            var inputb = $.extend({}, this.props.entry.object);
            diff = (<ReactDiff before={inputa} after={inputb} />);
        }
        var button = (<button type="button" className="btn btn-primary" onClick={this.handleClick.bind(this)}>{button_label}</button>);
        return (
            <span>
                {this.props.entry.timestamp}: {this.props.entry.username} performed action {this.props.entry.message}<br />
                {button}<br />
                {diff}
            </span>
        );
    }
    handleClick() {
        this.setState({diff: !this.state.diff});
    }
}

class AssetHistory extends React.Component {
    constructor(props) {
        super(props);
        this.state = {log: []};
    }
    componentDidMount() {
        fetchAPI({url: "/asset/" + encodeURIComponent(this.props.asset.id) + "/history/"})
            .then((log) => {
                log.sort(function (a, b) {
                    var x = a['timestamp'];
                    var y = b['timestamp'];
                    return ((x > y) ? 1 : ((x < y) ? -1 : 0));
                });
                this.setState({log: log});
            });
    }
    render() {
        var logs = [];
        for (var i = 0; i < this.state.log.length; i++) {
            var entry = this.state.log[i];
            var prev_entry = this.state.log[i - 1];
            if (entry.username === null)
                entry.username = 'Socrates';
            logs.push(<li key={entry.id}><AssetHistoryEntry entry={entry} prev_entry={prev_entry} /></li>);
        }
        return (<ol>{logs}</ol>);
    }
}

class AssetPowerManagement extends React.Component {
    constructor(props) {
        super(props);
        this.state = {log: ""};
    }
    onChange(event) {
        this.setState({
            log: event.target.value,
        });
    }
    render() {
        if (this.props.asset.asset_type === 'server' || this.props.asset.asset_type === 'vm')
            return (
                <FormGroup>
                    <InputGroup>
                        <FormControl type="text" placeholder="Log message..." onChange={this.onChange.bind(this)} />
                        <DropdownButton componentClass={InputGroup.Button} id="asset_power_action" title="Action" bsStyle="warning">
                            <MenuItem key="1" onClick={this.powerOn.bind(this)}>Power on</MenuItem>
                            <MenuItem key="2" onClick={this.reboot.bind(this)}>Reboot</MenuItem>
                            <MenuItem key="3" onClick={this.rebootPXE.bind(this)}>Reboot to PXE</MenuItem>
                            <MenuItem key="4" onClick={this.powerOff.bind(this)}>Power off</MenuItem>
                        </DropdownButton>
                    </InputGroup>
                </FormGroup>
            );
        else
            return (<span/>);
    }
    sendIpmi(action) {
        if (this.state.log === "") {
            alert("Please fill out log");
            return;
        }
        fetchAPI({
            url: "/asset/" + encodeURIComponent(this.props.asset.service_tag) +
                 "/ipmi/",
            data: {log: this.state.log, action: action}
        }).then((data) => {
        });
    }
    powerOn() {
        return this.sendIpmi("poweron");
    }
    reboot() {
        return this.sendIpmi("reboot");
    }
    rebootPXE() {
        return this.sendIpmi("reboot_pxe");
    }
    powerOff() {
        return this.sendIpmi("shutdown");
    }
}

class AssetMaintenance extends React.Component {
    constructor(props) {
        super(props);
        this.state = {maintenance: false, log: ""};
    }
    componentDidMount() {
        this.setState({
            maintenance: this.props.asset.hasOwnProperty("maintenance") && this.props.asset.maintenance,
            log: "",
            version: this.props.asset.version,
        });
    }
    onChange(event) {
        this.setState({
            maintenance: this.state.maintenance,
            log: event.target.value,
            version: this.state.version,
        });
    }
    render() {
        if (this.state.maintenance)
            return (
                <div className="input-group">
                    <input type="text" className="form-control" placeholder="Log message..." onChange={this.onChange.bind(this)} />
                    <span className="input-group-btn">
                        <button className="btn btn-primary" onClick={this.unsetMaintenance.bind(this)}>Unset Maintenance</button>
                    </span>
                </div>
            );
        else
            return (
                <div className="input-group">
                    <input type="text" className="form-control" placeholder="Log message..." onChange={this.onChange.bind(this)} />
                    <span className="input-group-btn">
                        <button className="btn btn-primary" onClick={this.setMaintenance.bind(this)}>Set Maintenance</button>
                    </span>
                </div>
            );
    }
    registerMaintenance(maintenance) {
        if (this.state.log === "") {
            alert("Please fill out log");
            return;
        }
        fetchAPI({
            method: "PATCH",
            url: "/asset/" + encodeURIComponent(this.props.asset.service_tag),
            data: {maintenance: maintenance, log: this.state.log, version: this.state.version},
        }).then((data) => {
            this.setState({maintenance: maintenance, version: data.version});
        });
    }
    setMaintenance() {
        this.registerMaintenance(true);
    }
    unsetMaintenance() {
        this.registerMaintenance(false);
    }
}

class AssetWarranty extends React.Component {
    render() {
        if (this.props.asset.hasOwnProperty('vendor') && this.props.asset.vendor === "Dell Inc.") {
            return(
                <button className="btn btn-primary" onClick={this.updateWarranty.bind(this)}>Update warranty</button>
                  );
        } else {
            return(<span/>);
        }
    }
    updateWarranty() {
        fetchAPI({url: "/warrantylookup/" + encodeURIComponent(this.props.asset.service_tag)});
    }
}

class AssetEvents extends React.Component {
    constructor(props) {
        super(props);
        this.state = {events: []};
    }
    componentDidMount() {
        var url;
        url = "/event/feed/" + encodeURIComponent(this.props.asset.service_tag);
        fetchAPI({
            url: url,
        }).then((events) => {
            if (typeof events === "undefined")
                return;
            events.sort(function (a, b) {
                var x = a['timestamp'];
                var y = b['timestamp'];
                return ((x > y) ? 1 : ((x < y) ? -1 : 0));
            });
            this.setState({events: events});
        });
    }
    render() {
        var events = [];
        this.state.events.forEach(function (event) {
            events.push(<li key={event.id}>{event.timestamp}: {event.event}</li>);
        });
        return (<ol>{events}</ol>);
    }
}

class AssetDelete extends React.Component {
    constructor(props) {
        super(props);
        this.state = {log: ""};
    }
    onChange(event) {
        this.setState({
            log: event.target.value,
        });
    }
    render() {
        return (
            <div className="input-group">
                <input type="text" className="form-control" placeholder="Log message..." onChange={this.onChange.bind(this)} />
                <span className="input-group-btn">
                    <button className="btn btn-primary" onClick={this.deleteAsset.bind(this)}>Delete</button>
                </span>
            </div>
        );
    }
    deleteAsset(maintenance) {
        if (this.state.log === "") {
            alert("Please fill out log");
            return;
        }
        fetchAPI({
            method: "DELETE",
            url: "/asset/" + encodeURIComponent(this.props.asset.service_tag),
            data: {log: this.state.log},
        }).then((data) => {
            this.props.history.goBack();
        });
    }
}

export class AssetsView extends React.Component {
    onRowClick(row) {
        return "/gui/asset/" + encodeURIComponent(row.service_tag);
    }
    render() {
        return (
            <ReactTable columns={["service_tag", "owner", "state", "model", "provision.hostname"]}
                availableColumns={{
                    "service_tag": "Service tag",
                    "owner": "Owner",
                    "state": "State",
                    "model": "Model",
                    "provision.hostname": "Hostname",
                    "parent": "Parent",
                    "provision.os": "OS",
                    "provision.vlan.cidr": "VLAN",
                    "asset_type": "Type",
                }} data={this.props.assets} rowsPerPage={20} onRowClick={this.onRowClick} history={this.props.history} />
        );
    }
}

function range(start, stop, step) {
    var ret = [];
    for (var i = start; i !== stop; i += step)
        ret.push(i);
    return ret;
}

function asset_label(asset) {
    if (asset.state === "in-use" && asset.hasOwnProperty("provision"))
        return asset.provision.hostname;
    else if (asset.hasOwnProperty("network"))
        return asset.network.device;
    else if (asset.hasOwnProperty("switch"))
        return asset.switch.domain;
    else
        return asset.service_tag;
}

class Asset extends React.Component {
    render() {
        var children = this.props.assets.filter((asset) => {
            return asset.parent === this.props.asset.service_tag;
        })
        .sort((a, b) => {
            if (typeof a.parent_position !== "undefined" && typeof b.parent_position !== "undefined")
                return a.parent_position[0] - b.parent_position[0];
            else
                return a.service_tag.localeCompare(b.service_tag);
        })
        .map((asset) => {
            return (<Asset key={asset.service_tag} asset={asset} assets={this.props.assets} user={this.props.user} />);
        });
        return (
            <div>
                <Link to={"/gui/asset/" + encodeURIComponent(this.props.asset.service_tag)} className="rackspace_label">{asset_label(this.props.asset)}</Link>
                {children}
            </div>
        );
    }
}

class Rack extends React.Component {
    render() {
        var assets = [];
        var positions = range(this.props.asset.positions, 0, -1);
        var filtered_assets = this.props.assets.filter((asset) => {
            return asset.parent === this.props.asset.service_tag;
        });
        for (var i = 0; i < positions.length; i++) {
            var position = positions[i];
            var columns = [React.createElement("th", {key: "th"}, "" + position)];
            for (var j = 0; j < filtered_assets.length; j++) {
                var asset = filtered_assets[j];
                var top_pos = Math.max.apply(null, asset.parent_position);
                var bottom_pos = Math.min.apply(null, asset.parent_position);
                if (position === top_pos) {
                    columns.push(
                        <td key={asset.service_tag} rowSpan={top_pos - bottom_pos + 1} className={"rackspace_asset rackspace_" + asset.asset_type}>
                            <Asset asset={asset} assets={this.props.assets} user={this.props.user} />
                        </td>
                    );
                }
            }
            assets.push(React.createElement("tr", {key: "" + position}, columns));
        }
        return (
            <table className="rackspace_rack">
                <caption><a name={this.props.asset.service_tag}>{this.props.asset.service_tag}</a></caption>
                <tbody>
                    {assets}
                </tbody>
            </table>
        );
    }
}

class Zone extends React.Component {
    render() {
        var assets = this.props.assets.filter((asset) => {
            return asset.parent === this.props.asset.service_tag &&
                asset.asset_type === 'rack';
        }).sort(function (a, b) {
            if (a.hasOwnProperty('parent_position') && b.hasOwnProperty('parent_position'))
                return Math.max.apply(null, b.parent_position) - Math.max.apply(null, a.parent_position);
            else
                return 0;
        }).map((asset) => {
            return (
                <Rack key={asset.service_tag} assets={this.props.assets} asset={asset} user={this.props.user} />
            );
        });
        return (
            <div>
                <h3><a name={this.props.asset.service_tag}>Zone {this.props.asset.service_tag}</a></h3>
                {assets}
            </div>
        );
    }
}

class Site extends React.Component {
    render() {
        var assets = this.props.assets.filter((asset) => {
            return asset.parent === this.props.asset.service_tag &&
                ['zone', 'rack'].indexOf(asset.asset_type) !== -1;
        }).sort(function (a, b) {
            if (a.hasOwnProperty('parent_position') && b.hasOwnProperty('parent_position'))
                return Math.max.apply(null, b.parent_position) - Math.max.apply(null, a.parent_position);
            else
                return 0;
        }).map((asset) => {
            if (asset.asset_type === 'zone')
                return (
                    <Zone key={asset.service_tag} assets={this.props.assets} asset={asset} user={this.props.user} />
                );
            else if (asset.asset_type === 'rack')
                return (
                    <Rack key={asset.service_tag} assets={this.props.assets} asset={asset} user={this.props.user} />
                );
            else
                return (<div></div>);
        });
        return (
            <div>
                <h3><a name={this.props.asset.service_tag}>Site {this.props.asset.service_tag}</a></h3>
                {assets}
            </div>
        );
    }
}

export class RackspaceView extends React.Component {
    render() {
        var assets = this.props.assets.filter(function(asset) {
            return !asset.parent && ['site', 'zone', 'rack'].indexOf(asset.asset_type) !== -1;
        }).sort(function (a, b) {
            if (a.hasOwnProperty('parent_position') && b.hasOwnProperty('parent_position'))
                return Math.max.apply(null, b.parent_position) - Math.max.apply(null, a.parent_position);
            else
                return 0;
        }).map(function(asset) {
            if (asset.asset_type === 'site')
                return (
                    <Site key={asset.service_tag} assets={this.props.assets} asset={asset} user={this.props.user} />
                );
            else if (asset.asset_type === 'zone')
                return (
                    <Zone key={asset.service_tag} assets={this.props.assets} asset={asset} user={this.props.user} />
                );
            else if (asset.asset_type === 'rack')
                return (
                    <Rack key={asset.service_tag} assets={this.props.assets} asset={asset} user={this.props.user} />
                );
            else
                return (<div></div>);
        }.bind(this));
        return (
            <div>
                <h2>Rackspace</h2>
                {assets}
            </div>
        );
    }
}
