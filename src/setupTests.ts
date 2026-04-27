// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// ResizeObserver is not implemented in JSDOM — provide a no-op class
class ResizeObserverStub {
  observe(_el: Element): void {
    /* noop */
  }

  unobserve(_el: Element): void {
    /* noop */
  }

  disconnect(): void {
    /* noop */
  }
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

// Mock matchMedia if needed (common in some React components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})
