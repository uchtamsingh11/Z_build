import React from 'react'
import { render, screen } from '@testing-library/react'
import DashboardPage from './page'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Mock the necessary components and utilities
jest.mock('@/components/app-sidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar">Mocked App Sidebar</div>
}))

jest.mock('@/components/ui/breadcrumb', () => ({
  Breadcrumb: ({ children }) => <div data-testid="breadcrumb">{children}</div>,
  BreadcrumbItem: ({ children, className }) => <div className={className}>{children}</div>,
  BreadcrumbList: ({ children }) => <div>{children}</div>,
  BreadcrumbPage: ({ children }) => <div>{children}</div>
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

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children, className }) => <div data-testid="card-content" className={className}>{children}</div>,
  CardDescription: ({ children }) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <div data-testid="card-title">{children}</div>
}))

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children, value }) => <div data-testid="tabs-content" data-value={value}>{children}</div>,
  TabsList: ({ children }) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }) => <div data-testid="tabs-trigger" data-value={value}>{children}</div>
}))

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }) => <tbody>{children}</tbody>,
  TableCell: ({ children }) => <td>{children}</td>,
  TableHead: ({ children }) => <th>{children}</th>,
  TableHeader: ({ children }) => <thead>{children}</thead>,
  TableRow: ({ children }) => <tr>{children}</tr>
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }) => <span data-testid="badge">{children}</span>
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, className }) => (
    <button data-testid="button" data-variant={variant} data-size={size} className={className}>{children}</button>
  )
}))

jest.mock('lucide-react', () => ({
  Activity: () => <div data-testid="icon-activity">Activity Icon</div>,
  ArrowDown: () => <div data-testid="icon-arrow-down">Arrow Down Icon</div>,
  ArrowUp: () => <div data-testid="icon-arrow-up">Arrow Up Icon</div>,
  Bitcoin: () => <div data-testid="icon-bitcoin">Bitcoin Icon</div>,
  BookOpen: () => <div data-testid="icon-book-open">Book Open Icon</div>,
  ChevronDown: () => <div data-testid="icon-chevron-down">Chevron Down Icon</div>,
  Clock: () => <div data-testid="icon-clock">Clock Icon</div>,
  Cpu: () => <div data-testid="icon-cpu">Cpu Icon</div>,
  DollarSign: () => <div data-testid="icon-dollar-sign">Dollar Sign Icon</div>,
  Euro: () => <div data-testid="icon-euro">Euro Icon</div>,
  Globe: () => <div data-testid="icon-globe">Globe Icon</div>,
  Newspaper: () => <div data-testid="icon-newspaper">Newspaper Icon</div>,
  PieChart: () => <div data-testid="icon-pie-chart">Pie Chart Icon</div>,
  Plus: () => <div data-testid="icon-plus">Plus Icon</div>,
  Settings: () => <div data-testid="icon-settings">Settings Icon</div>,
  Sigma: () => <div data-testid="icon-sigma">Sigma Icon</div>,
  Star: () => <div data-testid="icon-star">Star Icon</div>,
  TrendingDown: () => <div data-testid="icon-trending-down">Trending Down Icon</div>,
  TrendingUp: () => <div data-testid="icon-trending-up">Trending Up Icon</div>,
  TerminalIcon: () => <div data-testid="icon-terminal">Terminal Icon</div>,
  ServerIcon: () => <div data-testid="icon-server">Server Icon</div>,
  BarChartIcon: () => <div data-testid="icon-bar-chart">Bar Chart Icon</div>
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}))

// Mock createClient
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set default auth behavior - authenticated user
    createClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null
        })
      }
    })
  })

  it('redirects to login page when user is not authenticated', async () => {
    // Set up mocks for unauthenticated user
    createClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated')
        })
      }
    })

    render(await DashboardPage())
    
    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })

  it('renders the dashboard page with all key components when authenticated', async () => {
    render(await DashboardPage())
    
    // Check that the page structure is rendered correctly
    expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument()
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-inset')).toBeInTheDocument()
    expect(screen.getByTestId('coin-balance')).toBeInTheDocument()
    
    // Check that the dashboard sections are rendered
    expect(screen.getByText('MARKET_OVERVIEW')).toBeInTheDocument()
    expect(screen.getByText('PORTFOLIO_SNAPSHOT')).toBeInTheDocument()
  })

  it('displays correct market data cards', async () => {
    render(await DashboardPage())
    
    // Instead of using getByText, we'll look for the market card titles using more specific criteria
    const headings = screen.getAllByRole('heading', { level: 3 })
    
    // Check for NIFTY in the headings
    expect(headings.some(h => h.textContent === 'NIFTY')).toBeTruthy()
    
    // Check for BANKNIFTY in the headings
    expect(headings.some(h => h.textContent === 'BANKNIFTY')).toBeTruthy()
    
    // Check for Bitcoin in the headings 
    expect(headings.some(h => h.textContent === 'Bitcoin')).toBeTruthy()
    
    // Check for XAUUSD in the headings
    expect(headings.some(h => h.textContent === 'XAUUSD')).toBeTruthy()
  })
  
  it('displays portfolio value information', async () => {
    render(await DashboardPage())
    
    expect(screen.getByText('TOTAL_VALUE')).toBeInTheDocument()
    expect(screen.getByText('$0.00')).toBeInTheDocument()
    expect(screen.getByText('0.0% (24h)')).toBeInTheDocument()
  })
}) 