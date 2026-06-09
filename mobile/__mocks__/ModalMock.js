'use strict'

const React = require('react')

// Minimal Modal stub used via moduleNameMapper to break the circular
// mock-initialization chain that appears when expo 56 changes the order
// in which react-native modules are resolved during jest setup.
//
// Without this, mockComponent.js loads the real Modal → AppContainer-dev →
// LogBox → Text, and Text's requireActual returns a partially-initialized
// export (circular dep), causing "Cannot read properties of undefined
// (reading 'constructor')" at mockComponent.js line 42.
class Modal extends React.Component {
  static displayName = 'Modal'

  render() {
    const { children, visible } = this.props
    return visible === false ? null : React.createElement(React.Fragment, null, children)
  }
}

module.exports = Modal
