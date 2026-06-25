import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NotFound from '../NotFound'
import GradientButton from '../ui/GradientButton'
import CountUp from '../ui/CountUp'

describe('NotFound', () => {
  it('renders the 404 message and triggers onHome', () => {
    const onHome = vi.fn()
    render(<NotFound onHome={onHome} />)
    expect(screen.getByText('404')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Back to home'))
    expect(onHome).toHaveBeenCalled()
  })
})

describe('GradientButton', () => {
  it('renders its children and fires onClick', () => {
    const onClick = vi.fn()
    render(<GradientButton onClick={onClick}>Get Started</GradientButton>)
    const btn = screen.getByText('Get Started')
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalled()
  })
})

describe('CountUp', () => {
  it('renders prefix and suffix around the value', () => {
    render(<CountUp value={42} prefix="$" suffix="M+" />)
    // value animates from 0 on view; prefix/suffix are always present
    expect(screen.getByText(/\$/)).toBeInTheDocument()
    expect(screen.getByText(/M\+/)).toBeInTheDocument()
  })
})
