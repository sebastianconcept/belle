"use strict";

/* jslint node: true */

import Button from './components/Button';
import Card from './components/Card';
import Option from './components/Option';
import Placeholder from './components/Placeholder';
import Select from './components/Select';
import Separator from './components/Separator';
import TextInput from './components/TextInput';
import Rating from './components/Rating';
import AutoComplete from './components/autocomplete/AutoComplete';

import buttonStyle from './style/button';
import cardStyle from './style/card';
import placeholderStyle from './style/placeholder';
import optionStyle from './style/option';
import selectStyle from './style/select';
import separatorStyle from './style/separator';
import textInputStyle from './style/text-input';
import ratingStyle from './style/rating';
import autoCompleteStyle from './style/auto-complete';

import selectConfig from './config/select';

module.exports = {
  Button: Button,
  Card: Card,
  Option: Option,
  Placeholder: Placeholder,
  Select: Select,
  Separator: Separator,
  TextInput: TextInput,
  Rating: Rating,
  AutoComplete: AutoComplete,
  style: {
    button: buttonStyle,
    card: cardStyle,
    placeholder: placeholderStyle,
    option: optionStyle,
    select: selectStyle,
    separator: separatorStyle,
    textInput: textInputStyle,
    ratingStyle: ratingStyle,
    autoComplete: autoCompleteStyle
  },
  config: {
    select: selectConfig
  }
};
