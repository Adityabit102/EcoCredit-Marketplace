import '@testing-library/jest-dom'

// jsdom doesn't implement these — stub them so framer-motion / hooks don't crash.
class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as any).IntersectionObserver = IO
;(globalThis as any).ResizeObserver = IO

if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false, media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false },
  }) as any
}
