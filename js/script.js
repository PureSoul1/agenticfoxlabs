// script.js
document.addEventListener('DOMContentLoaded', () => {
  // Event Delegation instead of 63 inline onclicks
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-page-trigger]')) {
      const page = e.target.dataset.page;
      showPage(page);
    }
  });
  
  // Initialize other functions...
});

function showPage(pageId) { /* ... tumhara logic ... */ }