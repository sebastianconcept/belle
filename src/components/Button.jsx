"use strict";

import React, {Component} from 'react';
import {omit, extend, contains} from 'underscore';
import style from '../style/button';
import unionClassNames from '../utils/union-class-names';
import {injectStyles, removeStyle} from '../utils/inject-style';
import config from '../config/button';

const buttonTypes = ['button', 'submit', 'reset'];

// Enable React Touch Events
React.initializeTouchEvents(true);

/**
 * Button component
 *
 * The button behaves exactly like a normal html button except:
 * - Once a user clicks on the button it will loose focus
 * - By default every button is of type="button" instead of "submit"
 */
export default class Button extends Component {

  constructor(properties) {
    super(properties);
    this.state = {
      childProperties: sanitizeChildProperties(properties),
      // used for touch devices like iOS Chrome/Safari where the active
      // pseudoClass is not supported on touch
      active: false
    };
    // The focused attribute is used to apply the one-time focus animation.
    // As it is reset after every render it can't be set inside state as this
    // would trigger an endless loop.
    this.focused = false;
  }

  /**
   * Generates the style-id & inject the focus, hover & active style.
   *
   * The style-id is based on React's unique DOM node id.
   */
  componentWillMount() {
    const id = this._reactInternalInstance._rootNodeID.replace(/\./g, '-');
    this.styleId = `style-id${id}`;
    updatePseudoClassStyle(this.styleId, this.props);
  }

  /**
   * Remove a component's associated styles whenever it gets removed from the DOM.
   */
  componentWillUnmount() {
    removeStyle(this.styleId);
  }

  /**
   * Deactivate the focused attribute in order to make sure the focus animation
   * only runs once when the component is focused on & not after rerendering
   * e.g when the user clicks the button.
   */
  componentDidUpdate() {
    this.focused = false;
  }

  /**
   * Update the childProperties based on the updated properties of the button.
   */
  componentWillReceiveProps(properties) {
    this.setState({ childProperties: sanitizeChildProperties(properties) });
    updatePseudoClassStyle(this.styleId, properties);
  }

  /**
   * Activate the focused attribute used to determine when to show the
   * one-time focus animation and trigger a render.
   */
  _onFocus(event) {
    this.focused = true;
    this.forceUpdate();

    if (this.props.onFocus) {
      this.props.onFocus(event);
    }
  }

  /**
   * Deactivate the focused attribute used to determine when to show the
   * one-time focus animation and trigger a render.
   */
  _onBlur(event) {
    this.focused = false;
    this.forceUpdate();

    if (this.props.onBlur) {
      this.props.onBlur(event);
    }
  }

  /**
   * Updates the button to be pressed.
   */
  _onMouseDown(event) {
    this.setState({ active: true });

    if (this.props.onMouseDown) {
      this.props.onMouseDown(event);
    }
  }

  /**
   * Updates the button to be released.
   */
  _onMouseUp(event) {
    this.setState({ active: false });

    if (this.props.onMouseUp) {
      this.props.onMouseUp(event);
    }
  }

  /**
   * Updates the button to be pressed.
   */
  _onTouchStart(event) {
    this.setState({ active: true });

    if (this.props.onTouchStart) {
      this.props.onTouchStart(event);
    }
  }

  /**
   * Updates the button to be release.
   */
  _onTouchEnd(event) {
    this.setState({ active: false });

    if (this.props.onTouchEnd) {
      this.props.onTouchEnd(event);
    }
  }

  /**
   * Updates the button to be release.
   */
  _onTouchCancel(event) {
    this.setState({ active: false });

    if (this.props.onTouchEnd) {
      this.props.onTouchEnd(event);
    }
  }

  render() {
    const baseStyle = this.props.primary ? style.primaryStyle : style.style;
    const baseButtonStyle = extend({}, baseStyle, this.props.style);
    const baseFocusStyle = this.props.primary ? style.primaryFocusStyle : style.focusStyle;
    const focusStyle = extend({}, baseFocusStyle, this.props.focusStyle);

    let buttonStyle;
    if (this.props.disabled) {
      if (this.props.primary) {
        const primaryDisabledStyle = extend({}, style.primaryDisabledStyle, this.props.disabledStyle);
        buttonStyle = extend({}, baseButtonStyle, primaryDisabledStyle);
      } else {
        const disabledStyle = extend({}, style.disabledStyle, this.props.disabledStyle);
        buttonStyle = extend({}, baseButtonStyle, disabledStyle);
      }
    } else {
      if (this.state.active) {
        const baseActiveStyle = this.props.primary ? style.primaryActiveStyle : style.activeStyle;
        const activeStyle = extend({}, baseButtonStyle, baseActiveStyle, this.props.activeStyle);
        buttonStyle = activeStyle;
      } else if (this.focused && !this.state.active && this.props.preventFocusStyleForTouchAndClick) {
        buttonStyle = extend({}, baseButtonStyle, focusStyle);
      } else {
        buttonStyle = baseButtonStyle;
      }
    }

    return <button style={ buttonStyle }
                   className={ unionClassNames(this.props.className, this.styleId) }
                   onTouchStart={ this._onTouchStart.bind(this) }
                   onTouchEnd={ this._onTouchEnd.bind(this) }
                   onTouchCancel={ this._onTouchCancel.bind(this) }
                   onFocus={ this._onFocus.bind(this) }
                   onBlur={ this._onBlur.bind(this) }
                   onMouseDown={ this._onMouseDown.bind(this) }
                   onMouseUp={ this._onMouseUp.bind(this) }
                   {...this.state.childProperties}>
      { this.props.children }
    </button>;
  }
}

Button.displayName = 'Belle Button';

Button.propTypes = {
  primary: React.PropTypes.bool,
  disabled: React.PropTypes.bool,
  type: React.PropTypes.oneOf(buttonTypes),
  style: React.PropTypes.object,
  focusStyle: React.PropTypes.object,
  hoverStyle: React.PropTypes.object,
  disabledStyle: React.PropTypes.object,
  disabledHoverStyle: React.PropTypes.object,
  onTouchStart: React.PropTypes.func,
  onTouchEnd: React.PropTypes.func,
  onTouchCancel: React.PropTypes.func,
  onMouseDown: React.PropTypes.func,
  onMouseUp: React.PropTypes.func,
  onFocus: React.PropTypes.func,
  onBlur: React.PropTypes.func
};

Button.defaultProps = {
  primary: false,
  disabled: false,
  type: 'button',
  preventFocusStyleForTouchAndClick: config.preventFocusStyleForTouchAndClick
};

/**
 * Returns an object with properties that are relevant for the button element.
 *
 * In case a wrong or no type is defined the type of the child button will be
 * set to `button`.
 */
function sanitizeChildProperties(properties) {
  let childProperties = omit(properties, [
    'className',
    'style',
    'hoverStyle',
    'focusStyle',
    'activeStyle',
    'disabledStyle',
    'disabledHoverStyle',
    'primary',
    'onTouchStart',
    'onTouchEnd',
    'onTouchCancel',
    'onMouseDown',
    'onMouseUp',
    'onFocus',
    'onBlur'
  ]);
  return childProperties;
}

/**
 * Update hover, focus & active style for the speficied styleId.
 *
 * @param styleId {string} - a unique id that exists as class attribute in the DOM
 * @param properties {object} - the components properties optionally containing custom styles
 */
function updatePseudoClassStyle(styleId, properties) {
  const baseHoverStyle = properties.primary ? style.primaryHoverStyle : style.hoverStyle;
  const baseActiveStyle = properties.primary ? style.primaryActiveStyle : style.activeStyle;
  const baseDisabledHoverStyle = properties.primary ? style.primaryDisabledHoverStyle : style.disabledHoverStyle;
  const hoverStyle = extend({}, baseHoverStyle, properties.hoverStyle);
  const activeStyle = extend({}, baseActiveStyle, properties.activeStyle);
  const disabledHoverStyle = extend({}, baseDisabledHoverStyle, properties.disabledHoverStyle);

  let focusStyle;
  if (properties.preventFocusStyleForTouchAndClick) {
    focusStyle = { outline: 0 };
  } else {
    const baseFocusStyle = properties.primary ? style.primaryFocusStyle : style.focusStyle;
    focusStyle = extend({}, baseFocusStyle, properties.focusStyle);
  }

  const styles = [
    {
      id: styleId,
      style: hoverStyle,
      pseudoClass: 'hover'
    },
    {
      id: styleId,
      style: activeStyle,
      pseudoClass: 'active'
    },
    {
      id: styleId,
      style: disabledHoverStyle,
      pseudoClass: 'hover',
      disabled: true
    },
    {
      id: styleId,
      style: focusStyle,
      pseudoClass: 'focus'
    }
  ];

  injectStyles(styles);
}
