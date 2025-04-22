import React from 'react'
import { render, screen } from '@testing-library/react'
import Home from './page'

// Mock all the imported components
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, asChild, size, variant }) => (
    <button className={className} data-size={size} data-variant={variant}>{children}</button>
  )
}))

jest.mock('@/components/motion-primitives/text-effect', () => ({
  TextEffect: ({ children, className }) => <div className={className} data-testid="text-effect">{children}</div>
}))

jest.mock('@/components/motion-primitives/animated-group', () => ({
  AnimatedGroup: ({ children, className, variants }) => <div className={className} data-testid="animated-group">{children}</div>
}))

jest.mock('@/components/hero5-header', () => ({
  HeroHeader: () => <div data-testid="hero-header">Mocked Hero Header</div>
}))

jest.mock('@/components/logo-cloud', () => ({
  __esModule: true,
  default: () => <div data-testid="logo-cloud">Mocked Logo Cloud</div>
}))

jest.mock('@/components/features-3', () => ({
  __esModule: true,
  default: () => <div data-testid="features">Mocked Features</div>
}))

jest.mock('@/components/integrations-section', () => ({
  __esModule: true,
  default: () => <div data-testid="integrations">Mocked Integrations</div>
}))

jest.mock('@/components/testimonials-2', () => ({
  __esModule: true,
  default: () => <div data-testid="testimonials">Mocked Testimonials</div>
}))

jest.mock('@/components/dashboard-pricing', () => ({
  __esModule: true,
  default: () => <div data-testid="pricing">Mocked Pricing</div>
}))

jest.mock('@/components/footer', () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Mocked Footer</div>
}))

jest.mock('lucide-react', () => ({
  ArrowRight: () => <div data-testid="arrow-right">→</div>
}))

describe('Home Page', () => {
  it('renders the home page with all components', () => {
    render(<Home />)
    
    // Check if all major components are rendered
    expect(screen.getByTestId('hero-header')).toBeInTheDocument()
    expect(screen.getByTestId('logo-cloud')).toBeInTheDocument()
    expect(screen.getByTestId('features')).toBeInTheDocument()
    expect(screen.getByTestId('integrations')).toBeInTheDocument()
    expect(screen.getByTestId('testimonials')).toBeInTheDocument()
    expect(screen.getByTestId('pricing')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })
  
  it('renders the main headline and description text', () => {
    render(<Home />)
    
    // Check for main headline and description
    const textEffects = screen.getAllByTestId('text-effect')
    const headlineText = textEffects.find(el => el.textContent.includes('ALGOZ: TRADING_SMARTER'))
    const descriptionText = textEffects.find(el => el.textContent.includes('HARNESS THE POWER OF ALGORITHMIC TRADING'))
    
    expect(headlineText).toBeInTheDocument()
    expect(descriptionText).toBeInTheDocument()
  })
  
  it('contains the correct navigation links', () => {
    render(<Home />)
    
    const startTradingLink = screen.getByText('START_TRADING')
    const learnMoreLink = screen.getByText('LEARN_MORE')
    
    expect(startTradingLink).toBeInTheDocument()
    expect(learnMoreLink).toBeInTheDocument()
  })
}) 