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

import fetch from 'isomorphic-fetch';
import { Addr } from 'netaddr';
import { parse } from 'cookie';

export function fetchAPI(request) {
  var cookies = parse(document.cookie || '');
  var csrftoken = cookies.csrftoken;
  var args = {
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'X-CSRFToken': csrftoken,
    },
  };
  if (typeof request.method !== 'undefined')
    args.method = request.method;
  if (typeof request.data !== 'undefined') {
    if (typeof request.method === 'undefined')
      args.method = 'POST';
    args.headers['Content-Type'] = 'application/json';
    args.body = JSON.stringify(request.data);
  }
  return fetch(request.url, args).then(
    (response) => {
      if (response.ok)
        return response.json();
      if (typeof request.onError !== "undefined")
        return request.onError(response);
      console.log("response was not ok", response);
      throw new Error("response was not ok")
    },
    (error) => {
      console.log("Failed to access the API", error);
    }
  );
}

export function fetchAssets() {
  return (dispatch, getState) => {
    return fetchAPI({url: "/asset/"})
      .then(data => dispatch({
        type: "SET_ASSETS",
        assets: data
      }));
  };
}

export function fetchMe() {
  return (dispatch, getState) => {
    return fetchAPI({url: "/user/me"})
      .then(data => dispatch({
        type: 'SET_USER',
        username: data.username,
        logged_in: data.logged_in,
        is_superuser: data.is_superuser,
        is_console_user: data.is_console_user,
        session_id: undefined,
      }));
  };
}

export function fetchTasks() {
  return (dispatch, getState) => {
    return fetchAPI({url: "/task/result/?status=FAILURE&ops_acked="})
      .then(data => {
        dispatch({
          type: 'SET_TASKS',
          tasks: data,
        });
      });
  };
}

export function fetchQuotas() {
  return (dispatch, getState) => {
    return fetchAPI({url: "/quota/"})
      .then(data => {
        dispatch({
          type: 'SET_QUOTAS',
          quotas: data,
        });
      });
  };
}

export function fetchNetworks() {
  return (dispatch, getState) => {
    return fetchAPI({url: "/network/"})
      .then(data => {
        dispatch({
          type: 'SET_NETWORKS',
          networks: data,
        });
      });
  };
}

export function fetchBlocks() {
  return (dispatch, getState) => {
    return fetchAPI({url: "/bonk/block/"})
      .then(data => {
        for (var i = 0; i < data.length; i++)
          data[i].addr = Addr(data[i]["network"] + "/" + data[i]["length"]);
        dispatch({
          type: 'SET_BLOCKS',
          blocks: data,
        });
      });
  };
}

export function fetchPrefixes() {
  return (dispatch, getState) => {
    return fetchAPI({url: "/bonk/prefix/"})
      .then(data => {
        for (var i = 0; i < data.length; i++)
          data[i].addr = Addr(data[i]["network"] + "/" + data[i]["length"]);
        dispatch({
          type: 'SET_PREFIXES',
          prefixes: data,
        });
      });
  };
}

export function fetchAddresses() {
  return (dispatch, getState) => {
    return fetchAPI({url: "/bonk/address/"})
      .then(data => {
        for (var i = 0; i < data.length; i++)
          data[i].addr = Addr(data[i]["ip"]);
        dispatch({
          type: 'SET_ADDRESSES',
          addresses: data,
        });
      });
  };
}

export function fetchZones() {
  return (dispatch, getState) => {
    return fetchAPI({url: "/bonk/zone/"})
      .then(data => {
        dispatch({
          type: 'SET_ZONES',
          zones: data,
        });
      });
  };
}

export function fetchRecords() {
  return (dispatch, getState) => {
    return fetchAPI({url: "/bonk/record/"})
      .then(data => {
        dispatch({
          type: 'SET_RECORDS',
          records: data,
        });
      });
  };
}

export function fetchReviews() {
  return (dispatch, getState) => {
    return fetchAPI({url: "/review/?_include_object=1"})
      .then(data => {
        dispatch({
          type: 'SET_REVIEWS',
          reviews: data,
        });
      });
  };
}
