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
import createPlotlyComponent from 'react-plotlyjs';
import Plotly from 'plotly.js/dist/plotly-basic.min';
const PlotlyComponent = createPlotlyComponent(Plotly);

export default class StatsView extends React.Component {
  render() {
    var assets = this.props.assets;

    function calculateAge(shipping_date) {
      var shippingDate = new Date(shipping_date);
      var now = new Date();
      var years = (now.getFullYear() - shippingDate.getFullYear());
      if ((now.getMonth() < shippingDate.getMonth() ||
           now.getMonth() === shippingDate.getMonth()) &&
          now.getDate() < shippingDate.getDate()) {
        years--;
      }
      return years;
    }

    function myRound(number, precision) {
      var factor = Math.pow(10, precision);
      var tempNumber = number * factor;
      var roundedTempNumber = Math.round(tempNumber);
      return roundedTempNumber / factor;
    }

    var teams = {};
    var ages = [];
    var number_of_physical_servers = 0;
    var number_of_physical_servers_without_warranty_info = 0;
    var number_of_vms = 0;
    var number_of_teams = 0;
    var total_age = 0;
    var i;

    var team;
    var age;

    // Loop all assets
    for (i = 0; i < assets.length; i++) {

      // Find owner
      if (typeof assets[i].owner !== 'undefined') {
        team = assets[i].owner;
      }
      else {
        team = "Owner Undefined";
      }

      // Create Team
      if (typeof teams[team] === 'undefined') {
        teams[team] = {};
        teams[team].vms = 0;
        teams[team].physical = 0;
        teams[team].u = 0;
        number_of_teams++;
      }

      // Process Physical servers
      if (assets[i].asset_type === "server") {
        number_of_physical_servers++;
        teams[team].physical++;
        if (typeof assets[i].parent_position !== 'undefined') {
          teams[team].u = teams[team].u + assets[i].parent_position.length;
        }
        if (typeof assets[i].warranty !== 'undefined' && typeof assets[i].warranty.shipping_date !== 'undefined') {
          age = calculateAge(assets[i].warranty.shipping_date);
        }
        else {
          age = 0;
        }
        if (typeof ages[age] === 'undefined') {
          ages[age] = 1;
        }
        else if (age !== 0) {
          ages[age]++;
        }
        else {
          number_of_physical_servers_without_warranty_info++;
        }
        total_age += age;
      }
      // Proccess VMs
      else if (assets[i].asset_type === "vm") {
        teams[team].vms++;
        number_of_vms++;
      }
    }

    // Get our data for chart
    var physical_x_categories = [];
    var physical_data = [];
    var virtual_x_categories = [];
    var virtual_data = [];
    var u_x_categories = [];
    var u_data = [];

    // Sort teams on number of  Physical Servers
    var sorted_teams = Object.keys(teams);
    sorted_teams.sort((a, b) => { return teams[b].physical - teams[a].physical; });

    // Loop teams
    for (i = 0; i < sorted_teams.length; i++) {
      if (teams[sorted_teams[i]].physical !== 0) {
        physical_x_categories.push(sorted_teams[i]);
        physical_data.push(teams[sorted_teams[i]].physical);
      }
    }

    // Sort teams on number of  Virtual Servers
    sorted_teams = Object.keys(teams);
    sorted_teams.sort((a, b) => { return teams[b].vms - teams[a].vms; });

    // Loop teams
    for (i = 0; i < sorted_teams.length; i++) {
      if (teams[sorted_teams[i]].vms !== 0) {
        virtual_x_categories.push(sorted_teams[i]);
        virtual_data.push(teams[sorted_teams[i]].vms);
      }
    }

    // Sort teams on number of U
    sorted_teams = Object.keys(teams);
    sorted_teams.sort((a, b) => { return teams[b].u - teams[a].u; });

    // Loop teams
    for (i = 0; i < sorted_teams.length; i++) {
      if (teams[sorted_teams[i]].u !== 0) {
        u_x_categories.push(sorted_teams[i]);
        u_data.push(teams[sorted_teams[i]].u);
      }
    }

    const config = {
      showLink: false,
      displayModeBar: false
    };

    // Create Graph: physical
    const physical_layout = {
      title: '',
      xaxis: {
        title: 'Team',
        tickangle: -45
      },
      yaxis: {
        title: 'Number of Servers'
      }
    };
    const physical_graphs = [{
      x: physical_x_categories,
      y: physical_data,
      name: 'Servers',
      type: 'bar'
    }];

    const virtual_layout = {
      title: '',
      xaxis: {
        title: 'Team',
        tickangle: -45
      },
      yaxis: {
        title: 'Number of Servers'
      }
    };
    const virtual_graphs = [{
      x: virtual_x_categories,
      y: virtual_data,
      name: 'Servers',
      type: 'bar'
    }];

    const u_layout = {
      title: '',
      xaxis: {
        title: 'Team',
        tickangle: -45
      },
      yaxis: {
        title: 'Number of Rack units occupied'
      }
    };
    const u_graphs = [{
      x: u_x_categories,
      y: u_data,
      name: 'U',
      type: 'bar'
    }];

    const age_layout = {
      title: '',
      xaxis: {
        title: 'Age'
      },
      yaxis: {
        title: 'Number of Servers'
      }
    };
    const age_graphs = [{
      x: ages.keys(),
      y: ages,
      name: 'Servers',
      type: 'bar'
    }];

    var median_age = myRound(total_age / number_of_physical_servers, 2);
    return (
      <div>
        <h1>Stats</h1>
        <div>
          <ul>
            <li id="number_of_physical_servers">Number of Physical Servers: {number_of_physical_servers}</li>
            <li id="median_age">Median Age of The Physical Servers: {median_age}</li>
            <li id="number_of_physical_servers_without_warranty_info">Number of Physical Servers without warranty info: {number_of_physical_servers_without_warranty_info}</li>
            <li id="number_of_vms">Number of Virtual Servers: {number_of_vms}</li>
            <li id="number_of_teams">Number of Teams: {number_of_teams}</li>
          </ul>
        </div>
        <h2>Number of Physical Servers per Team</h2>
        <PlotlyComponent config={config} layout={physical_layout} data={physical_graphs} />
        <h2>Number of Virtual Servers per Team</h2>
        <PlotlyComponent config={config} layout={virtual_layout} data={virtual_graphs} />
        <h2>Number of Rack Units per Team</h2>
        <PlotlyComponent config={config} layout={u_layout} data={u_graphs} />
        <h2>Physical Servers Age</h2>
        <PlotlyComponent config={config} layout={age_layout} data={age_graphs} />

      </div>
    );
  }
}
