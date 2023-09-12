document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reset-form');
    form.addEventListener('submit', async (event) => {
	event.preventDefault();
	const sure = document.getElementById("sure").value;
	try {
            const response = await fetch('/api/v1/reset', {
		method: 'POST',
		headers: {
		    'Content-Type': 'application/json',
		},
		body: JSON.stringify({ sure })
            });
            
            if (response.status === 200) {
		const json = await response.json();
		const message = json.message;
		alert(message);
            }
	} catch (error) {
            console.error('There was a problem with the reset:', error);
	}
    });
});
