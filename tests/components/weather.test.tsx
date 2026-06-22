// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Weather } from '@/components/chat/weather';

describe('Weather Component', () => {
  it('renders location and temperature from sample data', () => {
    render(<Weather />);
    
    // Check if location format renders properly
    expect(screen.getByText(/37.8°, -122.4°/)).toBeInTheDocument();
    
    // Check if main temperature renders (29.3 rounded up to 30)
    expect(screen.getByText('30')).toBeInTheDocument();
  });
});
