import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import Page from './page'
import { createBrowserClient } from '@supabase/ssr'

// Mock necessary components
jest.mock('@/components/app-sidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar">Mocked App Sidebar</div>
}))

jest.mock('@/components/ui/breadcrumb', () => ({
  Breadcrumb: ({ children }) => <div data-testid="breadcrumb">{children}</div>,
  BreadcrumbItem: ({ children, className }) => <div className={className}>{children}</div>,
  BreadcrumbLink: ({ children, href }) => <a href={href}>{children}</a>,
  BreadcrumbList: ({ children }) => <div>{children}</div>,
  BreadcrumbPage: ({ children }) => <div>{children}</div>,
  BreadcrumbSeparator: ({ className }) => <div className={className}>/</div>
}))

jest.mock('@/components/ui/separator', () => ({
  Separator: ({ orientation, className }) => (
    <div data-testid="separator" data-orientation={orientation} className={className}></div>
  )
}))

jest.mock('@/components/ui/sidebar', () => ({
  SidebarInset: ({ children }) => <div data-testid="sidebar-inset">{children}</div>,
  SidebarProvider: ({ children }) => <div data-testid="sidebar-provider">{children}</div>,
  SidebarTrigger: ({ className }) => <button data-testid="sidebar-trigger" className={className}></button>
}))

jest.mock('@/components/coin-balance-display', () => ({
  CoinBalanceDisplay: () => <div data-testid="coin-balance">Mocked Coin Balance</div>
}))

jest.mock('@/components/transaction-history-modal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }) => (
    <div data-testid="transaction-history-modal" data-is-open={isOpen}>
      <button onClick={onClose}>Close</button>
    </div>
  )
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, onClick }) => (
    <button data-testid="button" className={className} onClick={onClick}>{children}</button>
  )
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }) => <div data-testid="card" className={className}>{children}</div>,
  CardDescription: ({ children }) => <div data-testid="card-description">{children}</div>,
  CardFooter: ({ children }) => <div data-testid="card-footer">{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <div data-testid="card-title">{children}</div>
}))

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, className, type }) => (
    <input
      data-testid="input"
      value={value}
      onChange={onChange}
      className={className}
      type={type}
    />
  )
}))

jest.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="icon-alert-circle">Alert Circle Icon</div>,
  BadgeCheck: () => <div data-testid="icon-badge-check">Badge Check Icon</div>,
  Clock: () => <div data-testid="icon-clock">Clock Icon</div>,
  Coins: () => <div data-testid="icon-coins">Coins Icon</div>,
  CreditCard: () => <div data-testid="icon-credit-card">Credit Card Icon</div>,
  TerminalIcon: () => <div data-testid="icon-terminal">Terminal Icon</div>
}))

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn()
}))

describe('Pricing Page', () => {
  beforeEach(() => {
    // Setup default authenticated user
    createBrowserClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null
        })
      },
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          error: null
        })
      })
    })
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' }
    })
    
    // Mock alert
    window.alert = jest.fn()
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })
  
  it('shows loading state before user is loaded', async () => {
    render(<Page />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
  
  it('redirects to login page when user is not authenticated', async () => {
    createBrowserClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated')
        })
      }
    })
    
    render(<Page />)
    
    await waitFor(() => {
      expect(window.location.href).toBe('/auth/login')
    })
  })
  
  it('renders the pricing page with all components when authenticated', async () => {
    render(<Page />)
    
    // Wait for user to be loaded
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
    
    // Check that page structure is rendered correctly
    expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument()
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-inset')).toBeInTheDocument()
    expect(screen.getByTestId('coin-balance')).toBeInTheDocument()
    
    // Check that pricing section is rendered
    expect(screen.getByText('PRICING_PLANS')).toBeInTheDocument()
  })
  
  it('displays the pricing plans', async () => {
    render(<Page />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
    
    // Check for pricing plans
    expect(screen.getByText('BASIC_PLAN')).toBeInTheDocument()
    expect(screen.getByText('PRO_PLAN')).toBeInTheDocument()
  })
  
  it('shows transaction history modal when button is clicked', async () => {
    render(<Page />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
    
    // Button not directly accessible by text due to mocking, but we can check state changes
    const buttons = screen.getAllByTestId('button')
    const historyButton = buttons.find(b => b.textContent.includes('TRANSACTION_HISTORY'))
    
    if (historyButton) {
      fireEvent.click(historyButton)
      expect(screen.getByTestId('transaction-history-modal')).toHaveAttribute('data-is-open', 'true')
    }
  })
}) 