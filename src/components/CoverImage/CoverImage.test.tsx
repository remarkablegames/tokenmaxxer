import { render, screen } from '@testing-library/react';

import { CoverImage } from '.';

describe('CoverImage', () => {
  it('renders responsive storefront artwork for square and landscape exports', () => {
    render(<CoverImage />);

    const cover = screen.getByRole('main', {
      name: 'Tokenmaxxer storefront cover',
    });
    expect(cover).toHaveClass('h-dvh', 'w-dvw');
    expect(cover).toHaveTextContent('TOKENMAXXER');
    expect(cover).toHaveTextContent('Chase the next record');
    expect(cover).not.toHaveTextContent('Cosmic Overdrive III');
    expect(cover).not.toHaveTextContent('1K');
    expect(cover).not.toHaveTextContent('1M');
    expect(cover).not.toHaveTextContent('1B');
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('font-brand');
    expect(screen.getByTestId('cover-layout')).toHaveClass(
      '[@media(min-aspect-ratio:6/5)]:px-[7vmin]',
      '[@media(min-aspect-ratio:3/2)]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]',
    );
  });
});
