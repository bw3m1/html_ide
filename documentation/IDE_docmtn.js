// Theme synchronization
const root = document.documentElement;

function setTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  root.style.setProperty('--background-rgb', theme === 'dark' ? '30, 30, 30' : '255, 255, 255');
  localStorage.setItem('docTheme', theme);
}

// TOC functionality with improved scroll spy
const tocContainer = document.getElementById('tocContainer');
let lastKnownScrollPosition = 0;
let ticking = false;

// Toggle TOC visibility with 'c' key
document.addEventListener('keydown', function(e) {
  if (e.key.toLowerCase() === 'c') {
    e.preventDefault();
    tocContainer.classList.toggle('visible');
  }
});

// Close TOC when clicking outside on mobile
document.addEventListener('click', function(e) {
  if (window.innerWidth <= 1200 && 
      !tocContainer.contains(e.target)) {
    tocContainer.classList.remove('visible');
  }
});

// Smooth scroll with offset
document.querySelectorAll('.toc a').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
      const offset = 80; // Adjust this value to control scroll position
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Highlight section
      targetElement.classList.add('highlight');
      setTimeout(() => targetElement.classList.remove('highlight'), 1500);

      // Close TOC on mobile after clicking
      if (window.innerWidth <= 1200) {
        tocContainer.classList.remove('visible');
      }

      // Update active state in TOC
      document.querySelectorAll('.toc a').forEach(link => {
        link.classList.remove('active');
      });
      this.classList.add('active');
    }
  });
});

// Enhanced scroll spy with Intersection Observer
const observerOptions = {
  rootMargin: '-20% 0px -80% 0px',
  threshold: [0, 1]
};

const observerCallback = (entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      const tocLink = document.querySelector(`.toc a[href="#${id}"]`);
      
      // Remove all active classes
      document.querySelectorAll('.toc a').forEach(link => {
        link.classList.remove('active');
      });
      
      // Add active class to current section
      if (tocLink) {
        tocLink.classList.add('active');
      }
    }
  });
};

// Create and setup intersection observer
const observer = new IntersectionObserver(observerCallback, observerOptions);
document.querySelectorAll('section[id]').forEach(section => {
  observer.observe(section);
});

// Initialize theme
if (window.opener) {
  const editorTheme = localStorage.getItem('editorTheme') || 'dark';
  setTheme(editorTheme);
}

// Show TOC by default on larger screens
if (window.innerWidth > 1200) {
  tocContainer.classList.add('visible');
}