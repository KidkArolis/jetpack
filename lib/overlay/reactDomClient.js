import * as ReactDOMClient from '__jetpack_original_react_dom_client__'

export * from '__jetpack_original_react_dom_client__'

export function createRoot(container, options) {
  return ReactDOMClient.createRoot(container, withOverlayCallbacks(options))
}

export function hydrateRoot(container, initialChildren, options) {
  return ReactDOMClient.hydrateRoot(container, initialChildren, withOverlayCallbacks(options))
}

function withOverlayCallbacks(options = {}) {
  return {
    ...options,
    onCaughtError: callOverlayThen(options.onCaughtError),
    onUncaughtError: callOverlayThen(options.onUncaughtError),
    onRecoverableError: callOriginalThen(options.onRecoverableError)
  }
}

function callOverlayThen(original) {
  return (error, errorInfo) => {
    window.__JETPACK_ERROR_OVERLAY__?.show?.(error)

    if (typeof original === 'function') {
      return original(error, errorInfo)
    }
  }
}

function callOriginalThen(original) {
  return (error, errorInfo) => {
    if (typeof original === 'function') {
      return original(error, errorInfo)
    }
  }
}
