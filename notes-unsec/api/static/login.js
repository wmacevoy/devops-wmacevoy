document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
  
      const id = document.getElementById('id').value;
      const password = document.getElementById('password').value;
  
      try {
        const response = await fetch('/api/v1/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id, password }),
        });
        
          if (response.status === 200) {
	      const json = await response.json();
              token = json.token;
              localStorage.setItem('token', token);
              alert('Successfully logged in!');
        } else {
          alert('Login failed!');
        }
      } catch (error) {
        console.error('There was a problem with the login:', error);
      }
    });
  });
  
