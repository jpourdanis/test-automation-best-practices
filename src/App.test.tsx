import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import './i18n'; // Ensure i18n is initialized

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
      resolvedLanguage: 'en',
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

// Mock fetch for API calls
global.fetch = jest.fn() as jest.Mock;

describe('App Component', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  test('renders loading colors state initially', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => []
    });

    render(<App />);
    expect(screen.getByText(/Loading colors.../i)).toBeInTheDocument();
  });

  test('renders logo and basic elements', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => []
    });

    render(<App />);
    expect(screen.getByAltText('logo')).toBeInTheDocument();
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('learnReact')).toBeInTheDocument();
  });

  test('header has correct background color from initial fetch', async () => {
    const mockColors = [{ name: 'Emerald', hex: '#2ecc71' }];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockColors
    });

    render(<App />);
    const header = await screen.findByRole('banner');
    expect(header).toHaveStyle({ backgroundColor: '#2ecc71' });
  });

  test('updates background color and verifies fetch call', async () => {
    const mockColors = [{ name: 'Emerald', hex: '#2ecc71' }];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockColors
    });

    render(<App />);
    const emeraldButton = await screen.findByRole('button', { name: /colors.emerald/i });

    // Mock the second fetch for individual color
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ name: 'Emerald', hex: '#2ecc71' })
    });

    fireEvent.click(emeraldButton);

    await waitFor(() => {
        expect(screen.getByText(/currentColor/i)).toHaveTextContent('#2ecc71');
    });

    // Verify fetch was called twice (once for mount, once for click)
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenLastCalledWith('/api/colors/Emerald');
  });

  test('handles fetch error gracefully in useEffect', async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Down'));

    render(<App />);
    
    await waitFor(() => {
      expect(consoleErrorMock).toHaveBeenCalledWith('Failed to fetch colors:', expect.any(Error));
    });
    
    consoleErrorMock.mockRestore();
  });

  test('handles fetch error in handleColorClick', async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockColors = [{ name: 'Emerald', hex: '#2ecc71' }];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockColors
    });

    render(<App />);
    const emeraldButton = await screen.findByRole('button', { name: /colors.emerald/i });

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

    fireEvent.click(emeraldButton);

    await waitFor(() => {
        expect(consoleErrorMock).toHaveBeenCalledWith('Failed to fetch hex for Emerald', expect.any(Error));
    });

    consoleErrorMock.mockRestore();
  });

  test('changes language and verifies document lang attribute', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => []
      });
      
    render(<App />);
    const select = screen.getByLabelText(/languageSelector/i);
    
    fireEvent.change(select, { target: { value: 'el' } });
    expect(document.documentElement.lang).toBe('el');
  });

  test('renders multiple colors and verifies aria-labels', async () => {
    const mockColors = [
      { name: 'Turquoise', hex: '#1abc9c' },
      { name: 'Red', hex: '#e74c3c' }
    ];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockColors
    });

    render(<App />);
    
    const turquoiseButton = await screen.findByRole('button', { name: /colors.turquoise/i });
    const redButton = await screen.findByRole('button', { name: /colors.red/i });

    expect(turquoiseButton).toHaveAttribute('aria-label', 'changeColor colors.turquoise');
    expect(redButton).toHaveAttribute('aria-label', 'changeColor colors.red');
  });

  test('handleColorClick does nothing if data is invalid (null hex)', async () => {
    const mockColors = [{ name: 'Emerald', hex: '#2ecc71' }];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockColors
    });

    render(<App />);
    const emeraldButton = await screen.findByRole('button', { name: /colors.emerald/i });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ name: 'Emerald', hex: null })
    });

    fireEvent.click(emeraldButton);

    // Wait and ensure color didn't change (should still be initial or previous)
    // Initial color is usually handled by the first fetch which we mocked
    // In our test, it might be undefined or Emerald depending on previous tests
    // But we just want to ensure it doesn't CRASH or update incorrectly.
    await new Promise(r => setTimeout(r, 100)); // wait a bit
    expect(screen.queryByText('#null')).not.toBeInTheDocument();
  });
});
