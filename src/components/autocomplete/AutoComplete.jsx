"use strict";

import React, {Component} from 'react';
import {injectStyles, removeStyle} from '../../utils/inject-style';
import unionClassNames from '../../utils/union-class-names';
import {omit, extend, filter} from 'underscore';
import style from '../../style/auto-complete';

/**
 * AutoComplete React Component.
 */
export default class AutoComplete extends Component {


  /*
   TODO:
   - checking the behavior of auto-complete for arrow keys.
   - styling
   - creating separate option component
   - handling mouse events on options
   */

  constructor(properties) {
    super(properties);
    this.state = {
      inputProperties: sanitizeInputProperties(properties),
      options: this._filterOptions(this.props.defaultValue),
      showOptions: false
    };
  }

  /**
   * The method will filter options for auto-complete from the list of
   * options provided in properties for the value of input box.
   */
  _filterOptions(value) {
    return filter(this.props.options, function(option) {
      return (option.indexOf(value) === 0);
    })
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
   * Reinitialize component state when properties are changed.
   */
  componentWillReceiveProps(properties) {
    this.setState({
      inputProperties: sanitizeInputProperties(properties),
      options: this._filterOptions(this.props.defaultValue),
      showOptions: false
    });
    updatePseudoClassStyle(this._styleId, properties);
  }

  /**
   * This callback will be executed when the value on input changes.
   */
  _onChange(event) {
    const value = event.target.value;
    this.setState({
      options: this._filterOptions(value),
      showOptions: true
    });
    if (this.props.onKeyDown) {
      this.props.onKeyDown(event);
    }
  }

  /**
   * This callback will be executed when input box is focused and some key is pressed.
   */
  _onKeyDown(event) {
    if(!this.props.disabled) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this._onArrowDownKeyDown();
      }
      else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this._onArrowUpKeyDown();
      }
      else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this._onEnterOrSpaceKeyDown(event);
      }
    }
    if (this.props.onKeyDown) {
      this.props.onKeyDown(event);
    }
  }

  /**
   * This callback will be executed when arrow up key is pressed.
   */
  _onArrowUpKeyDown() {
    if(this.state.showOptions) {
      const highlightedOptionIndex = this.state.highlightedOptionIndex <= 0 ? this.state.options.length -1 : this.state.highlightedOptionIndex - 1;
      this.setState({
        highlightedOptionIndex: highlightedOptionIndex
      });
    }
  }

  /**
   * This callback will be executed when arrow down key is pressed.
   */
  _onArrowDownKeyDown() {
    if(!this.state.showOptions) {
      this.setState({
        showOptions: true,
        highlightedOptionIndex: -1
      });
    }
    else {
      const highlightedOptionIndex = this.state.highlightedOptionIndex === this.state.options.length -1 ? 0 : this.state.highlightedOptionIndex + 1;
      this.setState({
        highlightedOptionIndex: highlightedOptionIndex
      });
    }
  }

  /**
   * This callback will be executed when enter or space key is pressed.
   */
  _onEnterOrSpaceKeyDown(event) {
    if(this.state.highlightedOptionIndex !== undefined) {
      event.target.value = this.state.options[this.state.highlightedOptionIndex];
    }
    this._hideOptions();
  }

  /**
   * This callback will focus moves away from input box.
   */
  _onBlur(event) {
    this._hideOptions();
    if (this.props.onBlur) {
      this.props.onBlur(event);
    }
  }

  _hideOptions() {
    this.setState({
      showOptions: false,
      highlightedOptionIndex: undefined
    });
  }

  render() {

    const computedMenuStyle = this.state.showOptions && !this.props.disabled ? style.menuStyle : { display: 'none' };

    return <span>
            <input onChange={ this._onChange.bind(this) }
                   onBlur = { this._onBlur.bind(this) }
                   onKeyDown = { this._onKeyDown.bind(this) }
                   { ...this.state.inputProperties }></input>
            <ul style={ computedMenuStyle }>
              {
                React.Children.map(this.state.options, (entry, index) => {
                  const computedOptionsStyle = this.state.highlightedOptionIndex === index ? style.highlightedOption : {};
                  return (
                    <li style={ computedOptionsStyle }> {entry} </li>
                  );
                })
              }
            </ul>
           </span>;
  }
}

AutoComplete.displayName = 'Belle AutoComplete';

AutoComplete.propTypes = {
  options: React.PropTypes.array,
  disabled: React.PropTypes.bool,
  onKeyDown: React.PropTypes.func,
  onBlur: React.PropTypes.func,
  onChange: React.PropTypes.func
};

AutoComplete.defaultProps = {
  disabled: false
};

/**
 * Sanitize properties for input component in the auto-complete.
 */
function sanitizeInputProperties(properties) {
  return omit(properties, [
    'options',
    'onKeyDown',
    'onBlur',
    'onChange'
  ]);
}

/**
 * Update hover & focus style for the specified styleId.
 */
function updatePseudoClassStyle(styleId, properties) {
}