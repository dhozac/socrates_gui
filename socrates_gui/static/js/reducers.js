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

import { combineReducers } from 'redux';

const assets = (state={
  loaded: false,
  assets: []
}, action) => {
  switch (action.type) {
    case 'SET_ASSETS':
      return {
        loaded: true,
        assets: action.assets
      };
    default:
      return state;
  }
};

const user = (state={
  username: undefined,
  logged_in: false,
  is_superuser: false,
  is_console_user: false,
  session_id: undefined,
}, action) => {
  switch (action.type) {
    case 'SET_USER':
      return {
        username: action.username,
        logged_in: action.logged_in,
        is_superuser: action.is_superuser,
        is_console_user: action.is_console_user,
        session_id: action.session_id,
      };
    default:
      return state;
  }
};

const quotas = (state={
  loaded: false,
  quotas: []
}, action) => {
  switch (action.type) {
    case 'SET_QUOTAS':
      return {
        loaded: true,
        quotas: action.quotas
      };
    default:
      return state;
  }
};

const tasks = (state={
  loaded: false,
  tasks: []
}, action) => {
  function sorter(tasks) {
    tasks.sort(function (a, b) {
      if (a.hasOwnProperty("date_done") && b.hasOwnProperty("date_done"))
        return (a.date_done < b.date_done) ? -1 : (a.date_done > b.date_done ? 1 : 0);
      else
        return 0;
    });
    return tasks;
  };
  switch (action.type) {
    case 'SET_TASKS':
      return {
        tasks: sorter(action.tasks),
        loaded: true,
      };
    case 'SET_TASK':
      return {
        tasks: sorter(state.tasks.filter((task) => { return task.id !== action.task.id; }).concat([action.task])),
        loaded: true,
      };
    default:
      return state;
  }
};

const blocks = (state={
  loaded: false,
  blocks: []
}, action) => {
  switch (action.type) {
    case 'SET_BLOCKS':
      return {
        loaded: true,
        blocks: action.blocks
      };
    default:
      return state;
  }
};

const prefixes = (state={
  loaded: false,
  prefixes: []
}, action) => {
  switch (action.type) {
    case 'SET_PREFIXES':
      return {
        loaded: true,
        prefixes: action.prefixes
      };
    default:
      return state;
  }
};

const addresses = (state={
  loaded: false,
  addresses: []
}, action) => {
  switch (action.type) {
    case 'SET_ADDRESSES':
      return {
        loaded: true,
        addresses: action.addresses
      };
    default:
      return state;
  }
};

const zones = (state={
  loaded: false,
  zones: []
}, action) => {
  switch (action.type) {
    case 'SET_ZONES':
      return {
        loaded: true,
        zones: action.zones
      };
    default:
      return state;
  }
};

const records = (state={
  loaded: false,
  records: []
}, action) => {
  switch (action.type) {
    case 'SET_RECORDS':
      return {
        loaded: true,
        records: action.records
      };
    default:
      return state;
  }
};

const networks = (state={
  loaded: false,
  networks: [],
}, action) => {
  switch (action.type) {
    case 'SET_NETWORKS':
      return {
        loaded: true,
        networks: action.networks
      };
    default:
      return state;
  }
};

const reviews = (state={
  loaded: false,
  reviews: []
}, action) => {
  switch (action.type) {
    case 'SET_REVIEWS':
      return {
        loaded: true,
        reviews: action.reviews
      };
    case 'SET_REVIEW':
      return {
        reviews: state.reviews.filter((review) => { return review.id !== action.review.id; }).concat([action.review]),
      };
    default:
      return state;
  }
};

const socratesApp = combineReducers({
  assets,
  user,
  quotas,
  tasks,
  blocks,
  prefixes,
  addresses,
  zones,
  records,
  networks,
  reviews,
});
export default socratesApp;
