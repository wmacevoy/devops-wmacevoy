import { render, screen } from '@testing-library/react';
import App from './App';

test('has login renders learn react link', () => {
    render(<App />);
    const logins = screen.getAllByText(/login/i);
    for (const login of logins) {
	expect(login).toBeInTheDocument();
    }
});
