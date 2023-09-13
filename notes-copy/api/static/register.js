document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    form.addEventListener('submit', async (event) => {
	event.preventDefault();	
	const id = document.getElementById('id').value;
	const password = document.getElementById('password').value;
	console.log(`register id ${id} password ${password}`);
	
	try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/v1/register', {
		method: 'POST',
		headers: {
		    'Content-Type': 'application/json',
		    'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify({ id, password }),
            });
	    
            if (response.status === 200) {
		const json = await response.json();
		const message = json.message;
		alert(message);
	    }
	} catch (error) {
            console.error('There was a problem with the registration:', error);
	}
    });
});
  
