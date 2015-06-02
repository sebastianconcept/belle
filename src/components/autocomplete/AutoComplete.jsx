"use strict";

import React, {Component} from 'react';
import {injectStyles, removeStyle} from '../../utils/inject-style';
import unionClassNames from '../../utils/union-class-names';
import {omit, extend, filter} from 'underscore';
import style from '../../style/auto-complete';
import textInputStyle from '../../style/text-input';

/**
 * AutoComplete React Component.
 */
export default class AutoComplete extends Component {


  /*
   TODO:
   - adding touch support
   - creating separate option component
   - styling
   - adding properties for various styles and event callbacks
   - hide focus style when active
   - I have copied styling from TextInput - how about using components: TextInput, Option as it is here
   */

  constructor(properties) {
    super(properties);
    this.state = {
      inputProperties: sanitizeInputProperties(properties),
      options: this.props.options,
      highlightedOptionIndex: -2
    };
  }

  /**
   * The method will filter options for auto-complete from the list of
   * options provided in properties for the value of input box.
   */
  _filterOptions(value) {
    return filter(this.props.options, function(option) {
      return (option.indexOf(value) === 0 && option !== value);
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
      highlightedOptionIndex: -2
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
      highlightedOptionIndex: -1
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
      else if (event.key === 'Escape') {
        event.preventDefault();
        this._hideOptions();
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
    if(this.state.highlightedOptionIndex > -2) {
      const highlightedOptionIndex = this.state.highlightedOptionIndex <= 0 ? this.state.options.length - 1 : this.state.highlightedOptionIndex - 1;
      this.setState({
        highlightedOptionIndex: highlightedOptionIndex
      });
    }
  }

  /**
   * This callback will be executed when arrow down key is pressed.
   */
  _onArrowDownKeyDown() {
    const highlightedOptionIndex = this.state.highlightedOptionIndex === this.state.options.length -1 ? 0 : this.state.highlightedOptionIndex + 1;
    this.setState({
      highlightedOptionIndex: highlightedOptionIndex
    });
  }

  /**
   * This callback will be executed when enter or space key is pressed.
   */
  _onEnterOrSpaceKeyDown(event) {
    const value = this.state.options[this.state.highlightedOptionIndex];
    if(this.state.highlightedOptionIndex !== undefined) {
      event.target.value = value;
    }
    this.setState({
      highlightedOptionIndex: -2
    });
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

  /**
   * This function will hide the options.
   */
  _hideOptions() {
    this.setState({
      highlightedOptionIndex: -2
    });
  }

  _optionOnMouseEnter(index) {
    this.setState({
      highlightedOptionIndex: index
    });
  }

  _optionOnMouseDown() {
    const value = this.state.options[this.state.highlightedOptionIndex];
    const autoCompleteInput = React.findDOMNode(this.refs.autoCompleteInput);
    autoCompleteInput.value = value;
    this.setState({
      highlightedOptionIndex: -2
    });
  }

  _menuOnMouseLeave() {
    if(this.state.highlightedOptionIndex > -1) {
      this.setState({
        highlightedOptionIndex: -1
      });
    }
  }

  _optionOnTouchStart(index) {
    const menuNode = React.findDOMNode(this.refs.menu);
    if (menuNode.scrollHeight > menuNode.offsetHeight) {
      this._scrollTopPosition = menuNode.scrollTop;
    } else {
      this._scrollTopPosition = 0;
    }
    this._scrollActive = false;
    this.setState({
      highlightedOptionIndex: index
    });
  }

  /**
   * Identifies if the menu is scrollable.
   */
  _optionOnTouchMoveAtOption (event) {
    const menuNode = React.findDOMNode(this.refs.menu);
    if (menuNode.scrollTop !== this._scrollTopPosition) {
      this._scrollActive = true;
    }
  }

  /**
   * Triggers a change event after the user touched on an Option.
   */
  _onTouchEndAtOption (event, index) {
    if (event.touches.length === 1 && !this._scrollActive) {
        event.preventDefault();
        //this._triggerChange(value);
    }
    this._touchStartedAt = undefined;
  }

  render() {

    const computedMenuStyle = this.state.highlightedOptionIndex > -2 && !this.props.disabled ? style.menuStyle : { display: 'none' };

    return <span>
              <input ref="autoCompleteInput"
                     style={textInputStyle.style}
                     onChange={ this._onChange.bind(this) }
                     onBlur = { this._onBlur.bind(this) }
                     onKeyDown = { this._onKeyDown.bind(this) }
                     { ...this.state.inputProperties }></input>
              <ul ref="menu"
                  style={ computedMenuStyle }
                  onMouseLeave= { this._menuOnMouseLeave.bind(this) }>
                  {
                    React.Children.map(this.state.options, (entry, index) => {
                      const computedOptionsStyle = this.state.highlightedOptionIndex === index ? style.highlightedOption : {};
                      return (
                        <li value={ this.state.option[index] }
                            style={ computedOptionsStyle }
                            onMouseEnter= { this._optionOnMouseEnter.bind(this, index) }
                            onTouchStart= { this._optionOnTouchStart.bind(this, index) }
                            onMouseDown= { this._optionOnMouseDown.bind(this)}>
                          {entry}
                        </li>
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