document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
  
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
  
      try {
        const response = await fetch('/api/v1/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        
        if (response.status === 200) {
            token = await response.json();
            localStorage.setItem('token', token);
            alert('Successfully logged in!');
          // Navigate to another page or update UI
        } else {
          alert('Login failed!');
        }
      } catch (error) {
        console.error('There was a problem with the login:', error);
      }
    });
  });
  