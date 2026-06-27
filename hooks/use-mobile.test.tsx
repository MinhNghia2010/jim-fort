import { act, renderHook } from '@testing-library/react'
import { useIsMobile } from './use-mobile'

function mockMatchMedia() {
  const listeners: Array<() => void> = []

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      matches: window.innerWidth < 768,
      media: '',
      onchange: null,
      addEventListener: jest.fn((event: string, callback: () => void) => {
        if (event === 'change') listeners.push(callback)
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  return {
    triggerChange: () => {
      listeners.forEach((callback) => callback())
    },
  }
}

describe('useIsMobile', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  it('should return false when screen width is desktop', () => {
    mockMatchMedia()

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it('should return true when screen width is mobile', () => {
    window.innerWidth = 375
    mockMatchMedia()

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('should update value when screen size changes', () => {
    const { triggerChange } = mockMatchMedia()

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    act(() => {
      window.innerWidth = 500
      triggerChange()
    })

    expect(result.current).toBe(true)
  })
})