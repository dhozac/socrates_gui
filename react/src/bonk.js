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
import { Glyphicon } from 'react-bootstrap';
import { Addr } from 'netaddr';

function addr_stripper(key, value) {
    if (key === "addr")
        return undefined;
    else
        return value;
}

class BonkObject extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: false,
        };
    }
    onClick() {
        this.setState({expanded: !this.state.expanded});
    }
    render() {
        var objects = [];
        var glyph = "chevron-down";
        if (this.state.expanded) {
            glyph = "chevron-up";
            for (var i = 0; i < this.props.objects.length; i++)
                objects.push(<pre key={i}>{JSON.stringify(this.props.objects[i], addr_stripper, 2)}</pre>);
        }
        return (
            <div>
                <span onClick={this.onClick.bind(this)} style={{cursor: "pointer"}}>{this.props.children} <Glyphicon glyph={glyph} /></span>
                {objects}
            </div>
        );
    }
}

export default class BonkView extends React.Component {
    componentWillMount() {
        this.props.triggerFetchBlocks();
        this.props.triggerFetchPrefixes();
        this.props.triggerFetchAddresses();
        this.props.triggerFetchZones();
        this.props.triggerFetchRecords();
        this.props.triggerFetchNetworks();
    }
    onSearch(event) {
        this.setState({search: this.searchInput});
        event.preventDefault();
    }
    render() {
        var disabled = 'disabled';
        var results = [];
        if (this.props.loaded === 6) {
            disabled = '';
            if (typeof this.searchInput !== "undefined" && this.searchInput.value) {
                var addr = undefined;
                try {
                    addr = Addr(this.searchInput.value);
                }
                catch (err) {
                }
                function add_prefix(results, prefix, networks) {
                    var key = "p-" + prefix.vrf + "/" + prefix.network + "/" + prefix.length;
                    var network = networks.filter((network) => {
                        return network.vrf === prefix.vrf &&
                            network.network === prefix.network &&
                            network.length === prefix.length;
                    });
                    if (network.length > 0)
                        network = network[0];
                    else
                        network = null;
                    results.push(<li key={key}>
                        <BonkObject objects={[prefix, network]}>
                            Prefix {prefix.network}/{prefix.length} {prefix.name}
                        </BonkObject>
                    </li>);
                }
                var i, key;
                if (typeof addr !== "undefined") {
                    for (i = 0; i < this.props.blocks.length; i++) {
                        if (this.props.blocks[i].addr.contains(addr) || addr.contains(this.props.blocks[i].addr)) {
                            key = "b-" + this.props.blocks[i].vrf + "/" + this.props.blocks[i].network + "/" + this.props.blocks[i].length;
                            results.push(<li key={key}>
                                <BonkObject objects={[this.props.blocks[i]]}>
                                    Block {this.props.blocks[i].network}/{this.props.blocks[i].length}
                                </BonkObject>
                            </li>);
                        }
                    }
                    for (i = 0; i < this.props.prefixes.length; i++) {
                        if (this.props.prefixes[i].addr.contains(addr) || addr.contains(this.props.prefixes[i].addr))
                            add_prefix(results, this.props.prefixes[i], this.props.networks);
                    }
                    for (i = 0; i < this.props.addresses.length; i++) {
                        if (this.props.addresses[i].addr.contains(addr) || addr.contains(this.props.addresses[i].addr)) {
                            key = "a-" + this.props.addresses[i].vrf + "/" + this.props.addresses[i].ip;
                            results.push(<li key={key}>
                                <BonkObject objects={[this.props.addresses[i]]}>
                                    Address {this.props.addresses[i].ip} {this.props.addresses[i].name}
                                </BonkObject>
                            </li>);
                        }
                    }
                }
                else {
                    var pattern = new RegExp(this.searchInput.value);
                    for (i = 0; i < this.props.zones.length; i++) {
                        if (this.props.zones[i].name.match(pattern)) {
                            key = "z-" + this.props.zones[i].name;
                            results.push(<li key={key}>
                                <BonkObject objects={[this.props.zones[i]]}>
                                    Zone {this.props.zones[i].name}
                                </BonkObject>
                            </li>);
                        }
                    }
                    for (i = 0; i < this.props.records.length; i++) {
                        if (this.props.records[i].name.match(pattern)) {
                            key = "r-" + this.props.records[i].name + "/" + this.props.records[i].type;
                            results.push(<li key={key}>
                                <BonkObject objects={[this.props.records[i]]}>
                                    Record {this.props.records[i].name} of type {this.props.records[i].type}
                                </BonkObject>
                            </li>);
                        }
                    }
                    for (i = 0; i < this.props.addresses.length; i++) {
                        if (this.props.addresses[i].name.match(pattern)) {
                            key = "a-" + this.props.addresses[i].vrf + "/" + this.props.addresses[i].ip;
                            results.push(<li key={key}>
                                <BonkObject objects={[this.props.addresses[i]]}>
                                    Address {this.props.addresses[i].ip} {this.props.addresses[i].name}
                                </BonkObject>
                            </li>);
                        }
                    }
                    for (i = 0; i < this.props.prefixes.length; i++) {
                        if (typeof this.props.prefixes[i].name !== 'undefined' &&
                            this.props.prefixes[i].name.match(pattern))
                            add_prefix(results, this.props.prefixes[i], this.props.networks);
                    }
                }
            }
        }
        return (
            <div>
                <form onSubmit={this.onSearch.bind(this)}>
                    <div className="input-group">
                        <input type="text" placeholder="Search for..." className="form-control" disabled={disabled} ref={(input) => { this.searchInput = input; }} />
                        <span className="input-group-btn">
                            <button className="btn btn-primary" disabled={disabled} onClick={this.onSearch.bind(this)}>Search</button>
                        </span>
                    </div>
                </form>
                <ul>
                    {results}
                </ul>
            </div>
        );
    }
}
