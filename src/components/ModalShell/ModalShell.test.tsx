import { fireEvent, render, screen } from '@testing-library/react';

import { ModalShell } from '.';

describe('ModalShell', () => {
  it('renders content and closes from the button or backdrop only', () => {
    const onClose = vi.fn();
    render(
      <ModalShell onClose={onClose} title="Test Console">
        <button type="button">Inner action</button>
      </ModalShell>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('TOKENMAXXER CONTROL');
    expect(dialog).toHaveTextContent('Test Console');
    fireEvent.click(screen.getByRole('button', { name: 'Inner action' }));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
