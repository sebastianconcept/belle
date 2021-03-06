"use strict";

import React, {Component} from 'react';
import {omit, extend, filter, find, first, isEmpty, isUndefined, findIndex, last, size, some, uniqueId} from 'underscore';
import unionClassNames from '../utils/union-class-names';
import {injectStyles, removeStyle} from '../utils/inject-style';
import style from '../style/select';
import config from '../config/select';
import isComponentTypeOf from '../utils/is-component-of-type.js';

// Enable React Touch Events
React.initializeTouchEvents(true);

/**
 * Select component.
 *
 * In its simplest form the select component behaves almost identical to the
 * native HTML select which the exception that it comes with beautiful styles.
 *
 * Example:
 *
 *     <Select defaultValue="rome">
 *       <Option value="vienna">Vienna</Option>
 *       <Option value="rome">Rome</Option>
 *     </Select>
 *
 * For more advanced examples please see:
 * nikgraf.github.io/belle/#/component/select
 *
 * This component was inpired by:
 * - Jet Watson: https://github.com/JedWatson/react-select
 * - Instructure React Team: https://github.com/instructure-react/react-select-box
 */
export default class Select extends Component {

  /*
   * Initialize the component based on the provided properties.
   *
   * By default the Select is closed & the focused option in case the user opens
   * it will be the selected option.
   */
  constructor (properties) {
    super(properties);

    let selectedValue, focusedOptionValue;

    if (this.props.valueLink) {
      selectedValue = this.props.valueLink.value;
      focusedOptionValue = selectedValue;
    } else if (this.props.value) {
      selectedValue = this.props.value;
      focusedOptionValue = selectedValue;
    } else if (this.props.defaultValue) {
      selectedValue = this.props.defaultValue;
      focusedOptionValue = selectedValue;
    } else if (!isEmpty(this.props.children) && !some(this.props.children, isPlaceholder)) {
      selectedValue = first(filter(this.props.children, isOption)).props.value;
      focusedOptionValue = selectedValue;
    } else if (!isEmpty(this.props.children)) {
      focusedOptionValue = first(filter(this.props.children, isOption)).props.value;
    }

    this.state = {
      isOpen: false,
      isFocused: false,
      selectedValue: selectedValue,
      focusedOptionValue: focusedOptionValue,
      selectedOptionWrapperProperties: sanitizePropertiesForSelectedOptionWrapper(properties),
      wrapperProperties: sanitizePropertiesForWrapper(properties.wrapperProps),
      menuProperties: sanitizePropertiesForMenu(properties.menuProps),
      caretProperties: sanitizePropertiesForCaret(properties.caretProps),
      selectedOptionWrapperId: properties.id ? properties.id : `belle-select-id-${uniqueId()}`,
      isTouchedToToggle: false
    };
  }

  componentWillReceiveProps(properties) {
    if (properties.valueLink) {
      this.setState({
        selectedValue: properties.valueLink.value,
        focusedOptionValue: properties.valueLink.value,
        selectedOptionWrapperProperties: sanitizePropertiesForSelectedOptionWrapper(properties),
        wrapperProperties: sanitizePropertiesForWrapper(properties.wrapperProps),
        menuProperties: sanitizePropertiesForMenu(properties.menuProps),
        caretProperties: sanitizePropertiesForCaret(properties.caretProps),
        selectedOptionWrapperId: properties.id ? properties.id : `belle-select-id-${uniqueId()}`
      });
    } else if (properties.value) {
      this.setState({
        selectedValue: properties.value,
        focusedOptionValue: properties.value,
        selectedOptionWrapperProperties: sanitizePropertiesForSelectedOptionWrapper(properties),
        wrapperProperties: sanitizePropertiesForWrapper(properties.wrapperProps),
        menuProperties: sanitizePropertiesForMenu(properties.menuProps),
        caretProperties: sanitizePropertiesForCaret(properties.caretProps),
        selectedOptionWrapperId: properties.id ? properties.id : `belle-select-id-${uniqueId()}`
      });
    }

    updatePseudoClassStyle(this._styleId, properties);
  }

  /**
   * Generates the style-id & inject the focus & hover style.
   *
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
   * In case shouldPositionOptions is active the scrollTop position is stored
   * to be applied later on. The menu is hidden to make sure it is
   * not displayed beofre repositioned.
   */
  componentWillUpdate(nextProperties, nextState) {
    if (nextProperties.shouldPositionOptions) {
      const menuNode = React.findDOMNode(this.refs.menu);
      this.cachedMenuScrollTop = menuNode.scrollTop;
      menuNode.style.display = 'none';
    }
  }

  /**
   * In case shouldPositionOptions is active when opening the menu it is
   * repositioned & switched to be visible.
   */
  componentDidUpdate(previousProperties, previousState) {
    if (this.props.shouldPositionOptions & !this.props.disabled) {
      const menuNode = React.findDOMNode(this.refs.menu);

      // the menu was just opened
      if (!previousState.isOpen && this.state.isOpen) {
        this.props.positionOptions(this);
      // restore the old scrollTop position
      } else {
        menuNode.scrollTop = this.cachedMenuScrollTop;
      }

      if (this.state.isOpen) {
        const menuStyle = extend({}, style.menuStyle, this.props.menuStyle);
        menuNode.style.display = menuStyle.display;
      }
    }
  }

  /**
   * Update the focusedOption based on Option the user is touching.
   *
   * Unfortunately updating the focusedOption only works in case the menu
   * is not scrollable.
   * If a setState would be triggered during a touch with the intention to
   * scroll the setState would trigger a re-render & prevent the scrolling.
   */
  _onTouchStartAtOption (event) {
    if (event.touches.length === 1) {
      const entry = event.currentTarget.querySelector('[data-belle-value]');
      this._touchStartedAt = entry.getAttribute('data-belle-value');

      // save the scroll position
      const menuNode = React.findDOMNode(this.refs.menu);
      if (menuNode.scrollHeight > menuNode.offsetHeight) {
        this._scrollTopPosition = menuNode.scrollTop;
        // Note: don't use setState in here as it would prevent the scrolling
      } else {
        this._scrollTopPosition = 0;
        this.setState({ focusedOptionValue: this._touchStartedAt });
      }
      // reset interaction
      this._scrollActive = false;
    }
  }

  /**
   * Identifies if the menu is scrollable.
   */
  _onTouchMoveAtOption (event) {
    const menuNode = React.findDOMNode(this.refs.menu);
    if (menuNode.scrollTop !== this._scrollTopPosition) {
      this._scrollActive = true;
    }
  }


  /**
   * Triggers a change event after the user touched on an Option.
   */
  _onTouchEndAtOption (event) {
    if (this._touchStartedAt && !this._scrollActive) {
      const entry = event.currentTarget.querySelector('[data-belle-value]');
      const value = entry.getAttribute('data-belle-value');
      if (this._touchStartedAt === value) {
        event.preventDefault();
        this._triggerChange(value);
      }
    }
    this._touchStartedAt = undefined;
  }

  /**
   * Triggers a change event after the user touched on an Option.
   */
  _onTouchCancelAtOption (event) {
    this._touchStartedAt = undefined;
  }

  /**
   * Triggers a change event after the user clicked on an Option.
   */
  _onClickAtOption (event) {
    const entry = event.currentTarget.querySelector('[data-belle-value]');
    this._triggerChange(entry.getAttribute('data-belle-value'));
  }

  /**
   * After an option has been selected the menu gets closed and the
   * selection processed.
   *
   * Depending on the component's properties the value gets updated and the
   * provided change callback for onChange or valueLink is called.
   */
  _triggerChange (value) {
    if(isUndefined(this.props.value)) {
      this.setState({
        focusedOptionValue: value,
        selectedValue: value,
        isOpen: false
      });
    } else {
      this.setState({
        isOpen: false
      });
    }

    if (this.props.valueLink) {
      this.props.valueLink.requestChange(value);
    } else if (this.props.onChange) {
      // TODO investigate how to properly simulate a change event that includes
      // all the usual properties documented here:
      // https://facebook.github.io/react/docs/events.html
      const wrapperNode = React.findDOMNode(this);
      wrapperNode.value = value;
      this.props.onChange({target: wrapperNode});
    }
  }

  /**
   * In order to inform the user which element in the document is active the
   * component keeps track of when it's de-selected and depending on that
   * close the menu.
   */
  _onBlur (event) {
    this.setState({
      isOpen: false,
      isFocused: false
    });

    if (this.props.wrapperProperties && this.props.wrapperProperties.onBlur) {
      this.props.wrapperProperties.onBlur(event);
    }
  }

  /**
   * In order to inform the user which element in the document is active the
   * component keeps track of when it's de-selected and depending on that
   * close the menu.
   */
  _onFocus (event) {
    this.setState({
      isFocused: true
    });

    if (this.props.wrapperProperties && this.props.wrapperProperties.onFocus) {
      this.props.wrapperProperties.onFocus(event);
    }
  }

  /**
   * In order to inform the user which Option is active the component keeps
   * track of when an option is in focus by the user and depending on that
   * provide a visual indicator.
   */
  _onMouseEnterAtOption (event) {
    const entry = event.currentTarget.querySelector('[data-belle-value]');
    this.setState({
      focusedOptionValue: entry.getAttribute('data-belle-value')
    });
  }

  /**
   * Toggle the menu after a user clicked on it.
   */
  _toggleMenuOnClick (event) {
    if(!this.props.disabled) {
      if (this.state.isOpen) {
        this.setState({ isOpen: false });
      } else {
        this.setState({ isOpen: true });
      }
    }

    if (this.props.onClick) {
      this.props.onClick(event);
    }
  }

  /**
   * Initiate the toggle for the menu.
   */
  _initiateToggleMenuOnTouchStart (event) {
    if (event.touches.length === 1) {
      this.setState({ isTouchedToToggle: true });
    } else {
      this.setState({ isTouchedToToggle: false });
    }

    if (this.props.onTouchStart) {
      this.props.onTouchStart(event);
    }
  }

  /**
   * Toggle the menu after a user touched it & resets the pressed state
   * for to toggle.
   */
  _toggleMenuOnTouchEnd (event) {
    // In case touch events are used preventDefault is applied to avoid
    // triggering the click event which would cause trouble for toggling.
    // In any case calling setState triggers a render. This leads to the fact
    // that the click event won't be triggered anyways. Nik assumes it's due the
    // element won't be in the DOM anymore.
    // This also means the Select's onClick won't be triggered for touchDevices.
    event.preventDefault();

    /* To avoid weird behaviour we check before focusing again - no specific use-case found */
    const wrapperNode = React.findDOMNode(this.refs.wrapper);
    if (document.activeElement != wrapperNode) {
      wrapperNode.focus();
    }

    if (this.state.isTouchedToToggle) {
      if (this.state.isOpen) {
        this.setState({ isOpen: false });
      } else {
        this.setState({ isOpen: true });
      }
    }
    this.setState({ isTouchedToToggle: false });

    if (this.props.onTouchEnd) {
      this.props.onTouchEnd(event);
    }
  }

  /**
   * Reset the precondition to initialize a toggle of the menu.
   */
  _cancelToggleMenuOnTouchCancel (event) {
    this.setState({ isTouchedToToggle: false });

    if (this.props.onTouchCancel) {
      this.props.onTouchCancel(event);
    }
  }

  /**
   * Update focus for the options for an already open menu.
   *
   * The user experience of HTML's native select is good and the goal here is to
   * achieve the same behaviour.
   *
   * - Focus on the first entry in case no options is focused on.
   * - Switch focus to the next option in case one option already has focus.
   */
  _onArrowDownKeyDown () {
    if (this.state.focusedOptionValue) {
      const indexOfFocusedOption = findIndexOfFocusedOption(this);

      if (hasNext(filter(this.props.children, isOption), indexOfFocusedOption)) {
        this.setState({
          focusedOptionValue: filter(this.props.children, isOption)[indexOfFocusedOption + 1].props.value
        });
      }
    } else {
      this.setState({
        focusedOptionValue: first(filter(this.props.children, isOption)).props.value
      });
    }
  }

  /**
   * Update focus for the options for an already open menu.
   *
   * The user experience of HTML's native select is good and the goal here is to
   * achieve the same behaviour.
   *
   * - Focus on the last entry in case no options is focused on.
   * - Switch focus to the previous option in case one option already has focus.
   */
  _onArrowUpKeyDown () {
    if (this.state.focusedOptionValue) {
      const indexOfFocusedOption = findIndexOfFocusedOption(this);

      if (hasPrevious(filter(this.props.children, isOption), indexOfFocusedOption)) {
        this.setState({
          focusedOptionValue: filter(this.props.children, isOption)[indexOfFocusedOption - 1].props.value
        });
      }
    } else {
      this.setState({
        focusedOptionValue: last(filter(this.props.children, isOption)).props.value
      });
    }
  }

  /**
   * After the user pressed the `Enter` or `Space` key for an already open
   * menu the focused option is selected.
   *
   * Same as _onClickAtOption this update the state & dispatches a change event.
   */
  _onEnterOrSpaceKeyDown () {
    this._triggerChange(this.state.focusedOptionValue);
  }

  /**
   * Manages the keyboard events.
   *
   * In case the Select is in focus, but closed ArrowDown, ArrowUp, Enter and
   * Space will result in opening the menu.
   *
   * In case the menu is already open each key press will have
   * different effects already documented in the related methods.
   *
   * Pressing Escape will close the menu.
   */
  _onKeyDown (event) {
    if (!this.props.disabled) {
      if(filter(this.props.children, isOption).length > 0) {

        if (!this.state.isOpen) {
          if (event.key === 'ArrowDown' ||
              event.key === 'ArrowUp' ||
              event.key === ' ') {
            event.preventDefault();
            this.setState({ isOpen: true });
          }
        } else {
          // Updates the state to set focus on the next option
          // In case no option is active it should jump to the first.
          // In case it is the last it should stop there.
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            this._onArrowDownKeyDown();
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            this._onArrowUpKeyDown();
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this._onEnterOrSpaceKeyDown();
          }
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          this.setState({ isOpen: false });
        }
      }
    }

    if (this.props.wrapperProperties && this.props.wrapperProperties.onKeyDown) {
      this.props.wrapperProperties.onKeyDown(event);
    }
  }

  render () {
    const defaultStyle = extend({}, style.style, this.props.style);
    const hoverStyle = extend({}, style.hoverStyle, this.props.hoverStyle);
    const focusStyle = extend({}, style.focusStyle, this.props.focusStyle);
    const disabledStyle = extend({}, style.disabledStyle, this.props.disabledStyle);
    const disabledHoverStyle = extend({}, style.disabledHoverStyle, this.props.disabledHoverStyle);
    const menuStyle = extend({}, style.menuStyle, this.props.menuStyle);
    const caretToOpenStyle = extend({}, style.caretToOpenStyle, this.props.caretToOpenStyle);
    const caretToCloseStyle = extend({}, style.caretToCloseStyle, this.props.caretToCloseStyle);
    const disabledCaretToOpenStyle = extend({}, style.disabledCaretToOpenStyle, this.props.disabledCaretToOpenStyle);
    const wrapperStyle = extend({}, style.wrapperStyle, this.props.wrapperStyle);

    let selectedOptionOrPlaceholder;
    if (this.state.selectedValue) {
      const selectedEntry = find(this.props.children, (entry) => {
        return entry.props.value == this.state.selectedValue;
      });

      if (selectedEntry) {
        selectedOptionOrPlaceholder = React.addons.cloneWithProps(selectedEntry, {
          _isDisplayedAsSelected: true
        });
      }
    } else {
      selectedOptionOrPlaceholder = find(this.props.children, isPlaceholder);
    }

    const computedMenuStyle = this.state.isOpen && !this.props.disabled ? menuStyle : { display: 'none' };
    const hasCustomTabIndex = this.props.wrapperProperties && this.props.wrapperProperties.tabIndex;
    let tabIndex = hasCustomTabIndex ? this.props.wrapperProperties.tabIndex : '0';

    let selectedOptionWrapperStyle;
    if(this.props.disabled) {
      selectedOptionOrPlaceholder = React.addons.cloneWithProps(selectedOptionOrPlaceholder, {
        _isDisabled: true
      });
      if (this.state.isTouchedToToggle) {
        selectedOptionWrapperStyle = disabledHoverStyle;
      } else {
        selectedOptionWrapperStyle = disabledStyle;
      }
      tabIndex = -1;
    } else {
      if (this.state.isFocused) {
        selectedOptionWrapperStyle = focusStyle;
      } else if (this.state.isTouchedToToggle) {
        selectedOptionWrapperStyle = hoverStyle;
      } else {
        selectedOptionWrapperStyle = defaultStyle;
      }
    }

    let caretStyle;
    if (this.props.disabled) {
      caretStyle = disabledCaretToOpenStyle;
    } else if (this.state.isOpen) {
      caretStyle = caretToCloseStyle;
    } else {
      caretStyle = caretToOpenStyle;
    }

    return (
      <div style={ wrapperStyle }
           tabIndex={ tabIndex }
           onKeyDown={ this._onKeyDown.bind(this) }
           onBlur={ this._onBlur.bind( this) }
           onFocus={ this._onFocus.bind( this) }
           ref="wrapper"
           {...this.state.wrapperProperties} >

        <div onClick={ this._toggleMenuOnClick.bind(this) }
             onTouchStart={ this._initiateToggleMenuOnTouchStart.bind(this) }
             onTouchEnd={ this._toggleMenuOnTouchEnd.bind(this) }
             onTouchCancel={ this._cancelToggleMenuOnTouchCancel.bind(this) }
             style={ selectedOptionWrapperStyle }
             className={ unionClassNames(this.props.className, this._styleId) }
             ref="selectedOptionWrapper"
             role="button"
             aria-expanded={ this.state.isOpen }
             id={ this.state.selectedOptionWrapperId }
             {...this.state.selectedOptionWrapperProperties} >
          { selectedOptionOrPlaceholder }
          <span style={ caretStyle }
            {...this.state.caretProperties}>
          </span>
        </div>

        <ul style={ computedMenuStyle }
            role="listbox"
            aria-labelledby={ this.state.selectedOptionWrapperId }
            ref="menu"
            {...this.state.menuProperties} >
          {
            React.Children.map(this.props.children, (entry, index) => {
              // filter out all non-Option Components
              if (isOption(entry)) {
                const isHovered = entry.props.value == this.state.focusedOptionValue;
                const option = React.addons.cloneWithProps(entry, {
                  _isHovered: isHovered
                });

                return (
                  <li onClick={ this._onClickAtOption.bind(this) }
                      onTouchStart={ this._onTouchStartAtOption.bind(this) }
                      onTouchMove={ this._onTouchMoveAtOption.bind(this) }
                      onTouchEnd={ this._onTouchEndAtOption.bind(this) }
                      onTouchCancel={ this._onTouchCancelAtOption.bind(this) }
                      key={ index }
                      onMouseEnter={ this._onMouseEnterAtOption.bind(this) }
                      role="option"
                      aria-selected={ isHovered }>
                    { option }
                  </li>
                );
              } else if (isSeparator(entry)) {
                return (
                  <li key={ index }
                      role="presentation">
                    { entry }
                  </li>
                );
              }
            })
          }
        </ul>

      </div>
    );
  }
}

Select.displayName = 'Belle Select';

Select.propTypes = {
  children: validateArrayOfOptionsAndMaximumOnePlaceholder,
  value: React.PropTypes.oneOfType([
    React.PropTypes.bool,
    React.PropTypes.string,
    React.PropTypes.number,
    React.PropTypes.instanceOf(Date)
  ]),
  defaultValue: React.PropTypes.oneOfType([
    React.PropTypes.bool,
    React.PropTypes.string,
    React.PropTypes.number
  ]),
  onChange: React.PropTypes.func,
  valueLink: React.PropTypes.shape({
    value: React.PropTypes.string.isRequired,
    requestChange: React.PropTypes.func.isRequired
  }),
  className: React.PropTypes.string,
  shouldPositionOptions: React.PropTypes.bool,
  positionOptions: React.PropTypes.func,
  style: React.PropTypes.object,
  focusStyle: React.PropTypes.object,
  hoverStyle: React.PropTypes.object,
  wrapperStyle: React.PropTypes.object,
  menuStyle: React.PropTypes.object,
  caretToOpenStyle: React.PropTypes.object,
  caretToCloseStyle: React.PropTypes.object,
  wrapperProps: React.PropTypes.object,
  menuProps: React.PropTypes.object,
  caretProps: React.PropTypes.object,
  disabled: React.PropTypes.bool,
  disabledStyle: React.PropTypes.object,
  disabledHoverStyle: React.PropTypes.object,
  disabledCaretToOpenStyle: React.PropTypes.object
};

Select.defaultProps = {
  shouldPositionOptions: config.shouldPositionOptions,
  positionOptions: config.repositionMenu,
  disabled: false
};

/**
 * Returns the index of the entry with a certain value from the component's
 * children.
 *
 * The index search includes only option components.
 */
const findIndexOfFocusedOption = (component) => {
  return findIndex(filter(component.props.children, isOption), (element) => {
    return element.props.value === component.state.focusedOptionValue;
  });
};

/**
 * Returns true if the provided property is a Placeholder component from Belle.
 */
function isPlaceholder(reactElement) {
  return isComponentTypeOf('Placeholder', reactElement);
}

/**
 * Returns true if the provided property is a Option component from Belle.
 */
function isOption(reactElement) {
  return isComponentTypeOf('Option', reactElement);
}

/**
 * Returns true if the provided property is a Separator component from Belle.
 */
function isSeparator(reactElement) {
  return isComponentTypeOf('Separator', reactElement);
}

/**
 * Verifies that the children is an array containing only Options & at maximum
 * one Placeholder.
 */
function validateArrayOfOptionsAndMaximumOnePlaceholder (props, propName, componentName) {
  const error = React.PropTypes.arrayOf(optionOrPlaceholderOrSeparatorPropType).isRequired(props, propName, componentName);
  if (error) return error;

  const placeholders = filter(props[propName], isPlaceholder);
  if (size(placeholders) > 1) {
    return new Error(`Invalid children supplied to \`${componentName}\`, expected only one Placeholder component.`);
  }
}

/**
 * Verifies that the provided property is an Option or Placeholder component from Belle.
 */
function optionOrPlaceholderOrSeparatorPropType(props, propName, componentName) {
  if (!(props[propName] &&
        isOption(props[propName]) ||
        isPlaceholder(props[propName]) ||
        isSeparator(props[propName]))
     ) {
    return new Error(`Invalid children supplied to \`${componentName}\`, expected an Option or Placeholder component from Belle.`);
  }
}

/**
 * Update hover style for the speficied styleId.
 *
 * @param styleId {string} - a unique id that exists as class attribute in the DOM
 * @param properties {object} - the components properties optionally containing hoverStyle
 */
function updatePseudoClassStyle(styleId, properties) {
  const hoverStyle = extend({}, style.hoverStyle, properties.hoverStyle);
  const disabledHoverStyle = extend({}, style.disabledHoverStyle, properties.disabledHoverStyle);

  const styles = [
    {
      id: styleId,
      style: hoverStyle,
      pseudoClass: 'hover'
    },
    {
      id: styleId,
      style: disabledHoverStyle,
      pseudoClass: 'hover',
      disabled: true
    }
  ];
  injectStyles(styles);
}

/**
 * Returns true in case there one more element in the list.
 */
const hasNext = (list, currentIndex) => {
  return (currentIndex + 2 <= list.length);
};

/**
 * Returns true in case there is one previous element in the list.
 */
const hasPrevious = (list, currentIndex) => {
  return (currentIndex - 1 >= 0);
};

/**
 * Returns an object with properties that are relevant for the wrapping div of
 * the selected option.
 */
function sanitizePropertiesForSelectedOptionWrapper(properties) {
  return omit(properties, [
    'onClick',
    'style',
    'className',
    'ref',
    'shouldPositionOptions',
    'positionOptions',
    'focusStyle',
    'hoverStyle',
    'wrapperStyle',
    'menuStyle',
    'caretToOpenStyle',
    'caretToCloseStyle',
    'disabledCaretToOpenStyle',
    'value',
    'defaultValue',
    'onChange',
    'valueLink',
    'role',
    'aria-expanded',
    'id',
    'onTouchStart',
    'onTouchEnd',
    'onTouchCancel',
    'disabledStyle',
    'disabledHoverStyle'
  ]);
}

/**
 * Returns an object with properties that are relevant for the wrapping div of
 * the selected option.
 */
function sanitizePropertiesForWrapper(wrapperProperties) {
  return omit(wrapperProperties, [
    'style',
    'ref',
    'tabIndex',
    'onKeyDown',
    'onBlur',
    'onFocus'
  ]);
}

/**
 * Returns an object with properties that are relevant for the wrapping div of
 * the selected option.
 */
function sanitizePropertiesForMenu(menuProperties) {
  return omit(menuProperties, [
    'style',
    'ref',
    'aria-labelledby',
    'role'
  ]);
}

/**
 * Returns an object with properties that are relevant for the wrapping div of
 * the selected option.
 */
function sanitizePropertiesForCaret(caretProperties) {
  return omit(caretProperties, [
    'style',
    'ref'
  ]);
}
