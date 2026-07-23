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
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('font-brand');
    expect(screen.getByTestId('cover-layout')).toHaveClass(
      '[@media(min-aspect-ratio:6/5)]:px-[7vmin]',
      '[@media(min-aspect-ratio:3/2)]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]',
    );
  });
});
