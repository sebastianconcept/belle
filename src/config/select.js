"use strict";

/* jslint browser: true */

import React from 'react';
import isComponentTypeOf from '../utils/is-component-of-type.js';
import {filter, findIndex} from 'underscore';

var selectConfig = {

  shouldPositionOptions: true,

  /**
   * Repositions to the menu to position the focusedOption right on top
   * of the selected one.
   *
   * @param selectComponent {object} - the Select component itself accessible with `this`
   */
  repositionMenu (selectComponent) {
    const menuNode = React.findDOMNode(selectComponent.refs.menu);
    const menuStyle = window.getComputedStyle(menuNode, null);
    const menuWidth = parseFloat(menuStyle.getPropertyValue('width'));

    // In case of a placeholder no option is focused on initially
    let option, optionIndex;

    if (selectComponent.state.selectedValue) {
      optionIndex = findIndexOfSelectedOption(selectComponent);
    } else {
      optionIndex = 0;
    }
    option = menuNode.children[optionIndex];

    const menuHeight = parseFloat(menuStyle.getPropertyValue('height'));
    const menuTopBorderWidth = parseFloat(menuStyle.getPropertyValue('border-top-width'));

    // In order to work with legacy browsers the second paramter for pseudoClass
    // has to be provided http://caniuse.com/#feat=getcomputedstyle
    const optionStyle = window.getComputedStyle(option.children[0], null);
    const optionPaddingTop = parseFloat(optionStyle.getPropertyValue('padding-top'));
    const optionPaddingLeft = parseFloat(optionStyle.getPropertyValue('padding-top'));

    const selectedOptionWrapperNode = React.findDOMNode(selectComponent.refs.selectedOptionWrapper);
    const selectedOptionWrapperStyle = window.getComputedStyle(selectedOptionWrapperNode, null);
    const selectedOptionWrapperPaddingTop = parseFloat(selectedOptionWrapperStyle.getPropertyValue('padding-top'));
    const selectedOptionWrapperPaddingLeft = parseFloat(selectedOptionWrapperStyle.getPropertyValue('padding-top'));

    const newTop = option.offsetTop + optionPaddingTop - selectedOptionWrapperPaddingTop + menuTopBorderWidth;
    const newLeft = option.offsetLeft + optionPaddingLeft;

    // Top positioning
    if (menuHeight < menuNode.scrollHeight) {
      if(newTop + menuHeight > menuNode.scrollHeight) {
        // In case scrolling is not enough the box needs to be moved more to
        // the top to match the same position.
        const maxScrollTop = menuNode.scrollHeight - menuHeight;
        menuNode.scrollTop = maxScrollTop;
        menuNode.style.top = `-${newTop - maxScrollTop}px`;
      } else {
        // In case it's the first entry scrolling is not used to respect the
        // menu's paddingTop.
        if (optionIndex === 0) {
          menuNode.scrollTop = 0;
          menuNode.style.top = `-${newTop}px`;
        } else {
          menuNode.scrollTop = newTop;
        }
      }
    } else {
      menuNode.style.top = `-${newTop}px`;
    }

    // Left positioning
    menuNode.style.left = `-${newLeft}px`;

    // Increasing the width
    //
    // Pro:
    // - It gives a option in the menu the same width
    // as in the selectedOptionWrapper.
    // - There is space to keep the text of the option on the exact same pixel
    // when opening. The menu is symetric in relation to the
    // selectedOptionWrapper.
    //
    // Con:
    // - Adding the padding could cause issue with design as it gets wider than
    // the original field.
    menuNode.style.width = `${menuWidth + newLeft * 2}px`;
  }
};

/**
 * Returns the index of the entry with a certain value from the component's
 * children.
 *
 * The index search includes separator & option components.
 */
const findIndexOfSelectedOption = (component) => {
  const filterFunction = (child) => (isComponentTypeOf('Option', child) || isComponentTypeOf('Separator', child));
  return findIndex(filter(component.props.children, filterFunction), (element) => {
    return element.props.value === component.state.selectedValue;
  });
};

export default selectConfig;
