// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Greeting } from '@/components/chat/greeting';

describe('Greeting Component', () => {
  it('renders greeting texts correctly', () => {
    render(<Greeting />);
    expect(screen.getByText('What can I help with?')).toBeInTheDocument();
    expect(screen.getByText('Ask a question, write code, or explore ideas.')).toBeInTheDocument();
  });
});
