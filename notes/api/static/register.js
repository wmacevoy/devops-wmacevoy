document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
  
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
  
      try {
        const response = await fetch('/api/v1/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, password }),
        });
        
        if (response.status === 201) {
          alert('Successfully registered!');
          // Navigate to another page or update UI
        } else {
          alert('Registration failed!');
        }
      } catch (error) {
        console.error('There was a problem with the registration:', error);
      }
    });
  });
  