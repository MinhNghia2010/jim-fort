import { cn } from './utils'

describe('cn', () => {
  it('should merge normal class names', () => {
    expect(cn('base', 'valid-class')).toBe('base valid-class')
  })

  it('should ignore null, undefined, and false values', () => {
    expect(cn('base', null, undefined, false, 'valid-class')).toBe(
      'base valid-class',
    )
  })

  it('should merge Tailwind classes correctly', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const isDisabled = false

    expect(cn('btn', isActive && 'active', isDisabled && 'disabled')).toBe(
      'btn active',
    )
  })

  it('should return an empty string when no input is provided', () => {
    expect(cn()).toBe('')
  })
})