document.addEventListener('DOMContentLoaded', () => {
    localStorage.removeItem('token');
    document.getElementById('status').innerHTML = "<p>Logged out.</p>";
});
