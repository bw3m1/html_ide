// Theme synchronization
window.addEventListener('message', (event) => {
  if (event.data.type === 'theme-sync') {
    setTheme(event.data.theme);
  }
});

function setTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('docTheme', theme);

  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'theme-change',
      theme: theme
    }, '*');
  }
}

if (window.opener) {
  const editorTheme = localStorage.getItem('editorTheme') || 'dark';
  setTheme(editorTheme);
}

// Smooth scrolling with highlighting
document.querySelectorAll('.toc a').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
      targetElement.classList.add('highlight');
      setTimeout(() => targetElement.classList.remove('highlight'), 1500);

      if (window.innerWidth <= 1200) {
        tocContainer.classList.remove('visible');
      }
    }
  });
});

// Highlight current section
const sections = document.querySelectorAll('section');
const tocLinks = document.querySelectorAll('.toc a');

function updateActiveTocLink() {
  let currentSection = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    if (window.scrollY >= sectionTop - 100) {
      currentSection = '#' + section.getAttribute('id');
    }
  });

  tocLinks.forEach(link => {
    link.style.fontWeight = link.getAttribute('href') === currentSection ? 'bold' : 'normal';
  });
}

window.addEventListener('scroll', updateActiveTocLink);
updateActiveTocLink();

// Open external links in new tab
document.querySelectorAll('.external-link').forEach(link => {
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
});