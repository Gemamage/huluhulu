import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PetCard from '@/components/PetCard'
import { Pet } from '@/types/pet'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />
  }
}))

const mockPet: Pet = {
  _id: '1',
  name: '小白',
  type: 'dog',
  breed: '拉布拉多',
  age: 2,
  gender: 'male',
  size: 'large',
  color: '白色',
  description: '很友善的狗狗',
  status: 'lost',
  lastSeenLocation: {
    address: '台北市信義區',
    coordinates: [121.5654, 25.0330]
  },
  contactInfo: {
    phone: '0912345678',
    email: 'test@example.com',
    preferredContact: 'phone'
  },
  images: ['https://example.com/image1.jpg'],
  owner: {
    _id: 'owner1',
    username: 'testuser',
    email: 'owner@example.com'
  },
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  viewCount: 10,
  shareCount: 5
}

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

describe('PetCard', () => {
  it('renders pet information correctly', () => {
    renderWithQueryClient(<PetCard pet={mockPet} />)
    
    expect(screen.getByText('小白')).toBeInTheDocument()
    expect(screen.getByText('拉布拉多')).toBeInTheDocument()
    expect(screen.getByText('2歲')).toBeInTheDocument()
    expect(screen.getByText('台北市信義區')).toBeInTheDocument()
  })

  it('displays correct status badge', () => {
    renderWithQueryClient(<PetCard pet={mockPet} />)
    
    expect(screen.getByText('走失')).toBeInTheDocument()
  })

  it('shows pet image', () => {
    renderWithQueryClient(<PetCard pet={mockPet} />)
    
    const image = screen.getByAltText('小白')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg')
  })

  it('displays view and share counts', () => {
    renderWithQueryClient(<PetCard pet={mockPet} />)
    
    expect(screen.getByText('10')).toBeInTheDocument() // view count
    expect(screen.getByText('5')).toBeInTheDocument() // share count
  })

  it('handles click events', () => {
    const onClickMock = jest.fn()
    renderWithQueryClient(<PetCard pet={mockPet} onClick={onClickMock} />)
    
    const card = screen.getByRole('article')
    fireEvent.click(card)
    
    expect(onClickMock).toHaveBeenCalledWith(mockPet)
  })

  it('renders found pet with correct status', () => {
    const foundPet = { ...mockPet, status: 'found' as const }
    renderWithQueryClient(<PetCard pet={foundPet} />)
    
    expect(screen.getByText('已找到')).toBeInTheDocument()
  })

  it('renders adopted pet with correct status', () => {
    const adoptedPet = { ...mockPet, status: 'adopted' as const }
    renderWithQueryClient(<PetCard pet={adoptedPet} />)
    
    expect(screen.getByText('已領養')).toBeInTheDocument()
  })

  it('handles missing image gracefully', () => {
    const petWithoutImage = { ...mockPet, images: [] }
    renderWithQueryClient(<PetCard pet={petWithoutImage} />)
    
    // Should still render the card without crashing
    expect(screen.getByText('小白')).toBeInTheDocument()
  })

  it('displays correct gender icon', () => {
    renderWithQueryClient(<PetCard pet={mockPet} />)
    
    // Assuming gender is displayed with an icon or text
    const genderElement = screen.getByTestId('pet-gender')
    expect(genderElement).toBeInTheDocument()
  })

  it('shows size information', () => {
    renderWithQueryClient(<PetCard pet={mockPet} />)
    
    expect(screen.getByText('大型')).toBeInTheDocument()
  })
})