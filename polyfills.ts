import { Buffer } from 'buffer';

// Many web3 libraries expect Buffer to be a global object.
// @ts-ignore
window.Buffer = Buffer;

// Polyfill for the 'process' object, which is expected by some dependencies of web3 libraries.
// @ts-ignore
if (typeof window.process === 'undefined') {
  // @ts-ignore
  window.process = {
    env: { DEBUG: undefined }, // Provide a minimal 'env' object to prevent errors.
    versions: {},
    nextTick: (callback) => setTimeout(callback, 0), // Basic implementation of nextTick.
    browser: true, // Flag to indicate a browser environment.
  };
}
