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
import { diffJson } from 'diff';

export default class ReactDiff extends React.Component {
  render() {
    var diff = diffJson(this.props.before, this.props.after);
    var result = diff.map((part, index) => {
      return (<span style={{backgroundColor: part.added ? 'lightgreen' : part.removed ? 'salmon' : 'lightgrey'}} key={index}>{part.value}</span>);
    });
    return (<pre className="diff">{result}</pre>);
  }
}
