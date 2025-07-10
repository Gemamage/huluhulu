import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SearchForm from '@/components/SearchForm'
import { SearchFilters } from '@/types/search'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
})

const renderWithQueryClient = (component: React.ReactElement) => {
  const testQueryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={testQueryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('SearchForm', () => {
  const mockOnSearch = jest.fn()
  const defaultFilters: SearchFilters = {
    type: '',
    status: '',
    breed: '',
    location: '',
    size: '',
    gender: ''
  }

  beforeEach(() => {
    mockOnSearch.mockClear()
  })

  it('renders all form fields', () => {
    renderWithQueryClient(
      <SearchForm onSearch={mockOnSearch} initialFilters={defaultFilters} />
    )

    expect(screen.getByLabelText(/寵物類型/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/狀態/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/品種/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/地點/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/體型/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/性別/i)).toBeInTheDocument()
  })

  it('displays initial filter values', () => {
    const initialFilters: SearchFilters = {
      type: 'dog',
      status: 'lost',
      breed: '拉布拉多',
      location: '台北市',
      size: 'large',
      gender: 'male'
    }

    renderWithQueryClient(
      <SearchForm onSearch={mockOnSearch} initialFilters={initialFilters} />
    )

    expect(screen.getByDisplayValue('dog')).toBeInTheDocument()
    expect(screen.getByDisplayValue('lost')).toBeInTheDocument()
    expect(screen.getByDisplayValue('拉布拉多')).toBeInTheDocument()
    expect(screen.getByDisplayValue('台北市')).toBeInTheDocument()
    expect(screen.getByDisplayValue('large')).toBeInTheDocument()
    expect(screen.getByDisplayValue('male')).toBeInTheDocument()
  })

  it('calls onSearch when form is submitted', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(
      <SearchForm onSearch={mockOnSearch} initialFilters={defaultFilters} />
    )

    const typeSelect = screen.getByLabelText(/寵物類型/i)
    const submitButton = screen.getByRole('button', { name: /搜尋/i })

    await user.selectOptions(typeSelect, 'dog')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'dog'
        })
      )
    })
  })

  it('updates filters when form fields change', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(
      <SearchForm onSearch={mockOnSearch} initialFilters={defaultFilters} />
    )

    const locationInput = screen.getByLabelText(/地點/i)
    await user.type(locationInput, '台北市信義區')

    const submitButton = screen.getByRole('button', { name: /搜尋/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          location: '台北市信義區'
        })
      )
    })
  })

  it('resets form when reset button is clicked', async () => {
    const user = userEvent.setup()
    const initialFilters: SearchFilters = {
      type: 'dog',
      status: 'lost',
      breed: '拉布拉多',
      location: '台北市',
      size: 'large',
      gender: 'male'
    }

    renderWithQueryClient(
      <SearchForm onSearch={mockOnSearch} initialFilters={initialFilters} />
    )

    const resetButton = screen.getByRole('button', { name: /重置/i })
    await user.click(resetButton)

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(defaultFilters)
    })
  })

  it('handles pet type selection correctly', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(
      <SearchForm onSearch={mockOnSearch} initialFilters={defaultFilters} />
    )

    const typeSelect = screen.getByLabelText(/寵物類型/i)
    await user.selectOptions(typeSelect, 'cat')

    expect(screen.getByDisplayValue('cat')).toBeInTheDocument()
  })

  it('handles status selection correctly', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(
      <SearchForm onSearch={mockOnSearch} initialFilters={defaultFilters} />
    )

    const statusSelect = screen.getByLabelText(/狀態/i)
    await user.selectOptions(statusSelect, 'found')

    expect(screen.getByDisplayValue('found')).toBeInTheDocument()
  })

  it('handles size selection correctly', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(
      <SearchForm onSearch={mockOnSearch} initialFilters={defaultFilters} />
    )

    const sizeSelect = screen.getByLabelText(/體型/i)
    await user.selectOptions(sizeSelect, 'small')

    expect(screen.getByDisplayValue('small')).toBeInTheDocument()
  })

  it('handles gender selection correctly', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(
      <SearchForm onSearch={mockOnSearch} initialFilters={defaultFilters} />
    )

    const genderSelect = screen.getByLabelText(/性別/i)
    await user.selectOptions(genderSelect, 'female')

    expect(screen.getByDisplayValue('female')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(
      <SearchForm onSearch={mockOnSearch} initialFilters={defaultFilters} required />
    )

    const submitButton = screen.getByRole('button', { name: /搜尋/i })
    await user.click(submitButton)

    // Should show validation errors for required fields
    await waitFor(() => {
      expect(screen.getByText(/請選擇寵物類型/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during search', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(
      <SearchForm onSearch={mockOnSearch} initialFilters={defaultFilters} loading />
    )

    const submitButton = screen.getByRole('button', { name: /搜尋中.../i })
    expect(submitButton).toBeDisabled()
  })
})