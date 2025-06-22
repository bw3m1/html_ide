// Theme synchronization and extensions functionality
document.addEventListener('DOMContentLoaded', function() {
  // Set initial theme
  const savedTheme = localStorage.getItem('docTheme') || 'light';
  setTheme(savedTheme);
  
  // Initialize TOC highlighting
  initTocHighlighting();
  
  // Add animations to feature cards
  animateFeatureCards();
  
  // Add click handlers for feature cards
  setupFeatureCardInteractions();
});

// Handle theme changes
function setTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('docTheme', theme);
  
  // Notify parent window if in iframe
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'theme-change',
      theme: theme
    }, '*');
  }
}

// Handle theme sync messages
window.addEventListener('message', function(event) {
  if (event.data.type === 'theme-sync') {
    setTheme(event.data.theme);
  }
});

// Initialize TOC highlighting
function initTocHighlighting() {
  const sections = document.querySelectorAll('h2[id]');
  const navLinks = document.querySelectorAll('.toc a');
  
  if (sections.length === 0 || navLinks.length === 0) return;
  
  // Highlight on scroll
  window.addEventListener('scroll', function() {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (pageYOffset >= sectionTop - 100) {
        current = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
  
  // Smooth scrolling for TOC links
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 20,
          behavior: 'smooth'
        });
        
        // Update URL without page reload
        history.pushState(null, null, targetId);
      }
    });
  });
}

// Animate feature cards on load
function animateFeatureCards() {
  document.querySelectorAll('.feature-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 200 + index * 100);
  });
}

// Setup feature card interactions
function setupFeatureCardInteractions() {
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', function(e) {
      // Don't interfere with link clicks
      if (e.target.closest('.feature-link')) return;
      
      const link = card.querySelector('.feature-link');
      if (link) {
        link.click();
      }
    });
    
    // Add hover effect for non-touch devices
    if (!('ontouchstart' in window)) {
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
        this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
      });
      
      card.addEventListener('mouseleave', function() {
        this.style.transform = '';
        this.style.boxShadow = 'var(--card-shadow)';
      });
    }
  });
}

// Show TOC by default on larger screens
function checkScreenSize() {
  if (window.innerWidth >= 1200) {
    document.querySelector('.toc-container').classList.add('visible');
  }
}

// Run initial screen size check
checkScreenSize();

// Update on resize
window.addEventListener('resize', checkScreenSize);