"use strict";

/* jslint browser: true */

import React, {Component} from 'react';
import {TextInput, Card, Button, style, Rating} from 'belle';
import {extend} from 'underscore';
import ButtonPlayground from './ButtonPlayground';
import CardPlayground from './CardPlayground';
import SelectPlayground from './SelectPlayground';
import RatingPlayground from './RatingPlayground';
import TextInputPlayground from './TextInputPlayground';
import AutoCompletePlayground from './AutoCompletePlayground';

style.button.style = {
  boxSizing: 'border-box',
  borderRadius: 2,
  cursor: 'pointer',
  padding: '8px 12px 6px 12px',
  textAlign: 'center',
  textDecoration: 'none',
  display: 'inline-block',
  background: 'red',
  border: '1px solid #EFEFEF',
  borderBottomColor: '#D0D0D0',
  color: 'brown',
  verticalAlign: 'bottom',
  fontSize: 16,
  lineHeight: '26px'
};

style.card.style = extend(style.card.style, {
  border: '1px solid black'
});

style.textInput.style = extend(style.textInput.style, {
  color: 'blue'
});

// export for http://fb.me/react-devtools
window.React = React;

class App extends Component {

  render() {
    return <div style={ {margin: '0 auto', width: 300} }>
      <h1>Belle Playground</h1>

      <SelectPlayground />

      <ButtonPlayground />

      <TextInputPlayground />

      <CardPlayground />

      <RatingPlayground />

      <AutoCompletePlayground />

    </div>;
  }
}

React.render(<App/>, document.getElementById('react'));
