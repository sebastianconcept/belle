"use strict";

import React, {Component} from 'react';
import {injectStyles, removeStyle} from '../../utils/inject-style';
import unionClassNames from '../../utils/union-class-names';
import {omit, extend} from 'underscore';
import style from '../../style/auto-complete';

/**
 * AutoComplete React Component.
 */
export default class AutoComplete extends Component {

  constructor(properties) {
    super(properties);
    this.state = {
      inputProperties: sanitizeInputProperties(properties)
    };
  }

  /**
   * Generates the style-id & inject the focus & hover style.
   * The style-id is based on React's unique DOM node id.
   */
  componentWillMount() {
    const id = this._reactInternalInstance._rootNodeID.replace(/\./g, '-');
    this._styleId = `style-id${id}`;
    updatePseudoClassStyle(this._styleId, this.props);
  }

  /**
   * Remove a component's associated styles whenever it gets removed from the DOM.
   */
  componentWillUnmount() {
    removeStyle(this._styleId);
  }

  /**
   */
  componentWillReceiveProps(properties) {
    this.setState({ inputProperties: sanitizeInputProperties(properties) });
    updatePseudoClassStyle(this._styleId, properties);
  }

  /**
   */
  _onKeyDown(event) {
    if (this.props.onKeyDown) {
      this.props.onKeyDown(event);
    }
  }

  /**
   */
  _onChange(event) {
    if (this.props.onChange) {
      this.props.onChange(event);
    }
  }

  render() {

    return <input onChange={ this._onChange.bind(this) }
                  onKeyDown={ this._onKeyDown.bind(this) }
                  { ...this.state.inputProperties }></input>;
  }
}

AutoComplete.displayName = 'Belle AutoComplete';

AutoComplete.propTypes = {
  disabled: React.PropTypes.bool,
  onChange: React.PropTypes.func,
  onKeyDown: React.PropTypes.func
};

AutoComplete.defaultProps = {
  disabled: false
};

function sanitizeInputProperties(properties) {
  return omit(properties, [
    'onChange',
    'onKeyDown'
  ]);
}

/**
 * Update hover & focus style for the specified styleId.
 */
function updatePseudoClassStyle(styleId, properties) {
}
