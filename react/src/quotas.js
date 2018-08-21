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

class Quota extends React.Component {
    render() {
        var content = [
            ["Physical servers", this.props.quota.used.physical.count, "N/A"],
            ["Physical CPUs", this.props.quota.used.physical.cpus, "N/A"],
            ["Physical RAM", this.props.quota.used.physical.ram, "N/A"],
            ["Physical disk", this.props.quota.used.physical.disk, "N/A"],
            ["Virtual servers", this.props.quota.used.vms.count, this.props.quota.quota.vms],
            ["Virtual CPUs", this.props.quota.used.vms.cpus, this.props.quota.quota.total_vcpus],
            ["Virtual RAM", this.props.quota.used.vms.ram, this.props.quota.quota.total_ram],
            ["Virtual disk", this.props.quota.used.vms.disk, this.props.quota.quota.total_disk],
        ].map((row, index) => {
            return (<tr key={index}><th>{row[0]}</th><td>{row[1]}</td><td>{row[2]}</td></tr>);
        });
        return (
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Group</th>
                        <th>{this.props.quota.group}</th>
                        <th>Quota</th>
                    </tr>
                </thead>
                <tbody>
                    {content}
                </tbody>
            </table>
        );
    }
}

export default class QuotasView extends React.Component {
    componentWillMount() {
        this.props.triggerFetchQuotas();
    }
    render() {
        var assets = {};
        this.props.assets.reduce(function(assets, asset) {
            if (typeof asset === "undefined")
                return assets;
            if (!asset.hasOwnProperty("owner"))
                asset.owner = "Undefined";
            assets[asset.owner] = assets[asset.owner] || [];
            assets[asset.owner].push(asset);
            return assets;
        }, assets);
        var quotas = {};
        this.props.quotas.reduce(function(quotas, quota) {
            if (typeof quota !== "undefined")
                quotas[quota.group] = quota;
            return quotas;
        }, quotas);
        if (!quotas.hasOwnProperty("_default_"))
            return (<div></div>);
        var data = [];
        var summer = function (prev, cur) {
            return prev + cur;
        };
        for (var owner in assets) {
            if (!assets.hasOwnProperty(owner))
                continue;
            var servers = assets[owner].filter(function (asset) {
                return asset.asset_type === "server";
            });
            var vms = assets[owner].filter(function (asset) {
                return asset.asset_type === "vm";
            });
            var quota = quotas[owner] || quotas["_default_"];
            data.push({
                group: owner,
                used: {
                    physical: {
                        count: servers.length,
                        cpus: servers.map(function(asset) {
                            return asset.hasOwnProperty("cpu") ? asset.cpu.length : 0;
                        }).reduce(summer, 0),
                        ram: servers.map(function(asset) {
                            return asset.hasOwnProperty("ram") ? asset.ram.total : 0;
                        }).reduce(summer, 0) / (1*1024*1024*1024),
                        disk: servers.map(function(asset) {
                            if (asset.hasOwnProperty("storage")) {
                                return asset.storage.map(function(controller) {
                                    return controller.pdisks.map(function(pdisk) {
                                        return pdisk.capacity;
                                    }).reduce(summer, 0);
                                }).reduce(summer, 0);
                            }
                            else
                                return 0;
                        }).reduce(summer, 0) / (1*1000*1000*1000),
                    },
                    vms: {
                        count: vms.length,
                        cpus: vms.map(function(asset) {
                            return asset.hasOwnProperty("cpu") ? asset.cpu.length : 0;
                        }).reduce(summer, 0),
                        ram: vms.map(function(asset) {
                            return asset.hasOwnProperty("ram") ? asset.ram.total : 0;
                        }).reduce(summer, 0) / (1*1024*1024*1024),
                        disk: vms.map(function(asset) {
                            if (asset.hasOwnProperty("storage")) {
                                return asset.storage.map(function(disk) {
                                    return disk.capacity;
                                }).reduce(summer, 0);
                            }
                            else
                                return 0;
                        }).reduce(summer, 0) / (1*1000*1000*1000),
                    },
                },
                quota: {
                    group: quota.group,
                    vms: quota.vms,
                    total_vcpus: quota.total_vcpus,
                    total_ram: quota.total_ram / (1*1024*1024*1024),
                    total_disk: quota.total_disk / (1*1000*1000*1000),
                },
            });
        }
        var output = data.map((quota) => {
            return (<li key={quota.group}><Quota quota={quota} /></li>);
        });
        return (
            <ul>
                {output}
            </ul>
        );
    }
}
