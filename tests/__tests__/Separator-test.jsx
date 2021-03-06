"use strict";

jest.dontMock('../lib/components/Separator');

import React from 'react/addons';
const TestUtils = React.addons.TestUtils;

// Babel would move an import in front of the jest.dontMock. That's why require
// is used instead of import.
const Separator = require('../lib/components/Separator');

describe('Separator', () => {

  it('should come with a set of default styles', () => {
    const separator = TestUtils.renderIntoDocument(
      <Separator>Europe</Separator>
    );

    const div = TestUtils.findRenderedDOMComponentWithTag(separator, 'div');
    expect(div.props.style.color).toBe('#666');
  });

  it('should be able to overwrite the default styles', () => {
    const separator = TestUtils.renderIntoDocument(
      <Separator style={ { color: '#F00'} }>Please select a city</Separator>
    );

    const div = TestUtils.findRenderedDOMComponentWithTag(separator, 'div');
    expect(div.props.style.color).toBe('#F00');
  });

  it('should be able to provide custom properties', () => {
    const separator = TestUtils.renderIntoDocument(
      <Separator data-custom="example">Please select a city</Separator>
    );

    const div = TestUtils.findRenderedDOMComponentWithTag(separator, 'div');
    expect(div.props['data-custom']).toBe('example');
  });

});
