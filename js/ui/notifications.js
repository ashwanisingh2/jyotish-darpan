export const notify = {
  show(message, type = 'info') {
    const container = document.getElementById('toast');
    if (!container) {
      console.warn('Toast container not found');
      alert(message);
      return;
    }
    
    container.textContent = message;
    container.className = `toast ${type}`;
    container.style.display = 'block';
    
    // Set color based on type
    const colors = {
      success: 'var(--ok, #36c98f)',
      warning: 'var(--warn, #f5b942)',
      error: 'var(--bad, #ef5b70)',
      info: 'var(--gold, #f0c040)'
    };
    container.style.borderColor = colors[type] || 'var(--gold)';
    
    setTimeout(() => {
      container.style.display = 'none';
    }, 3000);
  }
};
