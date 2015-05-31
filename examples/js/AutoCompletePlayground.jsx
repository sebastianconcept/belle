"use strict";

import React from 'react';
import {Card, AutoComplete} from 'belle';

export default React.createClass({

  render () {
    return (
      <div>
        <h2>AutoComplete</h2>

        <Card>

          <div style={ { 'marginBottom': '20px' } }>
            <AutoComplete defaultValue={'testing...'}></AutoComplete>
          </div>

          <div style={ { 'marginBottom': '20px' } }>
            <AutoComplete disabled></AutoComplete>
          </div>

          <div>
            <AutoComplete defaultValue={'this is defaultValue'} disabled></AutoComplete>
          </div>

        </Card>

      </div>
    );
  }
});
