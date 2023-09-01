window.addEventListener('DOMContentLoaded', async (event) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/v1/notes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
            const notes = await response.json();
            const notesContainer = document.getElementById('notesContainer');
            notesContainer.innerHTML = data.map(notes => `<p>${note.content}</p>`).join('');
        }
    }
    catch (error) {
        console.log(error);
    }
});
  