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
import ReactDOM from 'react-dom';
import { BrowserRouter, Switch, Route, Link } from 'react-router-dom';
import { createStore, applyMiddleware } from 'redux';
import { connect, Provider } from 'react-redux';
import thunkMiddleware from 'redux-thunk';

import './SocratesApp.css';
import socratesApp from './reducers.js';
import QuotasView from './quotas.js';
import { AssetsView, AssetView, RackspaceView } from './assets.js';
import TasksView from './tasks.js';
import ReQLView from './reql.js';
import StatsView from './stats.js';
import BonkView from './bonk.js';
import { ReviewsView, ReviewView } from './reviews.js';
import {
  fetchAssets, fetchMe, fetchTasks, fetchQuotas, fetchBlocks, fetchPrefixes,
  fetchAddresses, fetchZones, fetchRecords, fetchNetworks, fetchReviews
} from './actions.js';

class HomeView extends React.Component {
  render() {
    return (
      <div>
        <p>Socrates, providing information that is consistent with reality.</p>
        <a href="https://confluence.internal.machines/display/teamitopscs/Socrates">Read the docs!</a>
      </div>
    );
  }
}

class BaseView extends React.Component {
  componentWillMount() {
    this.props.dispatch(fetchMe());
    this.props.dispatch(fetchAssets());
  }
  onRefresh(event) {
    event.preventDefault();
    this.props.dispatch(fetchAssets());
    this.props.dispatch(fetchTasks());
  }
  render() {
    var menu = [
      (<li key="menu_assets"><Link to="/gui/asset">Assets</Link></li>),
      (<li key="menu_quotas"><Link to="/gui/quota">Quotas</Link></li>),
    ];
    if (this.props.is_superuser) {
      menu.push(<li key="menu_rackspace"><Link to="/gui/rackspace">Rackspace</Link></li>);
      menu.push(<li key="menu_tasks"><Link to="/gui/tasks">Tasks</Link></li>);
      menu.push(<li key="menu_reql"><Link to="/gui/reql">ReQL</Link></li>);
    }
    menu.push(<li key="menu_reviews"><Link to="/gui/review">Reviews</Link></li>);
    menu.push(<li key="menu_stats"><Link to="/gui/stats">Stats</Link></li>);
    menu.push(<li key="menu_bonk"><Link to="/gui/bonk">Bonk</Link></li>);
    var menu_right = [
      (<li key="menu_right_refresh"><a href="#" onClick={this.onRefresh.bind(this)}>Refresh</a></li>),
    ];
    return (
      <div>
        <nav className="navbar navbar-default navbar-fixed-top">
          <div className="container">
            <div className="navbar-header">
              <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
                <span className="sr-only">Toggle navigation</span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
              </button>
              <Link className="navbar-brand" to="/gui"><b>Socrates</b></Link>
            </div>
            <div id="navbar" className="navbar-collapse collapse">
              <ul className="nav navbar-nav">
                {menu}
              </ul>
              <ul className="nav navbar-nav navbar-right">
                {menu_right}
              </ul>
            </div>
          </div>
        </nav>
        <div className="container" style={{paddingTop: "70px"}}>
          <Switch>
            <Route exact path="/gui" component={HomeView} />
            <Route path="/gui/asset/:service_tag" component={AssetViewRedux} />
            <Route path="/gui/asset" component={AssetsViewRedux} />
            <Route path="/gui/quota" component={QuotasViewRedux} />
            <Route path="/gui/rackspace" component={RackspaceViewRedux} />
            <Route path="/gui/tasks" component={TasksViewRedux} />
            <Route path="/gui/reql" component={ReQLView} />
            <Route path="/gui/stats" component={StatsViewRedux} />
            <Route path="/gui/review/:id" component={ReviewViewRedux} />
            <Route path="/gui/review" component={ReviewsViewRedux} />
            <Route path="/gui/bonk" component={BonkViewRedux} />
          </Switch>
        </div>
      </div>
    );
  }
}

const BaseViewRedux = connect(
  (state) => {
    return {
      logged_in: state.user.logged_in,
      is_superuser: state.user.is_superuser,
    };
  },
  (dispatch) => {
    return {dispatch: dispatch};
  }
)(BaseView);

const AssetsViewRedux = connect(
  (state) => {
    return {
      assets: state.assets.assets,
      user: state.user,
    };
  },
  (dispatch) => {
    return {};
  }
)(AssetsView);

const AssetViewRedux = connect(
  (state) => {
    return {
      assets: state.assets.assets,
      user: state.user,
    };
  },
  (dispatch) => {
    return {};
  }
)(AssetView);

const RackspaceViewRedux = connect(
  (state) => {
    return {
      assets: state.assets.assets,
      user: state.user,
    };
  },
  (dispatch) => {
    return {};
  }
)(RackspaceView);

const QuotasViewRedux = connect(
  (state) => {
    return {
      assets: state.assets.assets,
      quotas: state.quotas.quotas,
    };
  },
  (dispatch) => {
    return {
      triggerFetchQuotas: () => {
        return dispatch(fetchQuotas());
      },
    };
  }
)(QuotasView);

const TasksViewRedux = connect(
  (state) => {
    return {
      tasks: state.tasks.tasks,
      loaded: state.tasks.loaded,
    };
  },
  (dispatch) => {
    return {
      triggerFetchTasks: () => {
        return dispatch(fetchTasks());
      },
      onSetTask: (task) => {
        return dispatch({
          type: 'SET_TASK',
          task: task,
        });
      },
    };
  }
)(TasksView);

const StatsViewRedux = connect(
  (state) => {
    return {
      assets: state.assets.assets,
    };
  },
  (dispatch) => {
    return {};
  }
)(StatsView);

const BonkViewRedux = connect(
  (state) => {
    return {
      blocks: state.blocks.blocks,
      prefixes: state.prefixes.prefixes,
      addresses: state.addresses.addresses,
      zones: state.zones.zones,
      records: state.records.records,
      networks: state.networks.networks,
      loaded: state.blocks.loaded + state.prefixes.loaded +
        state.addresses.loaded + state.zones.loaded + state.records.loaded +
        state.networks.loaded,
    };
  },
  (dispatch) => {
    return {
      triggerFetchBlocks: () => {
        return dispatch(fetchBlocks());
      },
      triggerFetchPrefixes: () => {
        return dispatch(fetchPrefixes());
      },
      triggerFetchAddresses: () => {
        return dispatch(fetchAddresses());
      },
      triggerFetchZones: () => {
        return dispatch(fetchZones());
      },
      triggerFetchRecords: () => {
        return dispatch(fetchRecords());
      },
      triggerFetchNetworks: () => {
        return dispatch(fetchNetworks());
      },
    };
  }
)(BonkView);

const ReviewsViewRedux = connect(
  (state) => {
    return {
      reviews: state.reviews.reviews,
    };
  },
  (dispatch) => {
    return {
      triggerFetchReviews: () => {
        return dispatch(fetchReviews());
      },
    };
  }
)(ReviewsView);

const ReviewViewRedux = connect(
  (state) => {
    return {
      loaded: state.reviews.loaded,
      reviews: state.reviews.reviews,
      user: state.user,
    };
  },
  (dispatch) => {
    return {
      triggerFetchReviews: () => {
        return dispatch(fetchReviews());
      },
      setReview: (review) => {
        return dispatch({
          type: 'SET_REVIEW',
          review: review,
        });
      },
    };
  }
)(ReviewView);

var store = createStore(socratesApp, applyMiddleware(thunkMiddleware));

export default class SocratesApp extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <Route path="/gui" app={this} component={BaseViewRedux} />
        </BrowserRouter>
      </Provider>
    );
  }
}

