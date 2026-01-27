// Source Code Protection (Deterrents)
(function() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // Disable common keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Disable F12 (Developer Tools)
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+Shift+I (Developer Tools)
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.key === 'J') {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+U (View Source)
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+S (Save Page)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            return false;
        }
        
        // Disable Ctrl+Shift+C (Inspect Element)
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            return false;
        }
    });

    // Disable text selection (optional - can be annoying for users)
    // Uncomment if you want to prevent text selection
    /*
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });
    */

    // Detect DevTools opening (basic detection)
    let devtools = {open: false, orientation: null};
    const threshold = 160;
    
    setInterval(function() {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtools.open) {
                devtools.open = true;
                // Optionally redirect or show warning
                // window.location.href = 'about:blank';
            }
        } else {
            devtools.open = false;
        }
    }, 500);

    // Clear console periodically (makes debugging harder)
    setInterval(function() {
        console.clear();
    }, 1000);
})();

// Enhanced Interactions and Animations
document.addEventListener('DOMContentLoaded', function() {
    // Navbar scroll effect
    const nav = document.querySelector('.nav');
    
    if (nav) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    }


    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -80px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
            }
        });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        observer.observe(section);
    });

    // Staggered animation for capability items
    const capabilityItems = document.querySelectorAll('.capability-item');
    const capabilityObserver = new IntersectionObserver(function(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateX(0)';
                }, index * 100);
            }
        });
    }, observerOptions);

    capabilityItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        capabilityObserver.observe(item);
    });

    // Staggered animation for process items
    const processItems = document.querySelectorAll('.process-item');
    const processObserver = new IntersectionObserver(function(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0) scale(1)';
                }, index * 120);
            }
        });
    }, observerOptions);

    processItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px) scale(0.98)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        processObserver.observe(item);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offset = 100;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Mouse parallax for hero background
    const hero = document.querySelector('.hero');
    if (hero) {
        let mouseX = 0;
        let mouseY = 0;
        let currentX = 0;
        let currentY = 0;
        
        hero.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { width, height, left, top } = hero.getBoundingClientRect();
            mouseX = ((clientX - left) / width - 0.5) * 20;
            mouseY = ((clientY - top) / height - 0.5) * 20;
        });
        
        function animateParallax() {
            currentX += (mouseX - currentX) * 0.05;
            currentY += (mouseY - currentY) * 0.05;
            
            hero.style.setProperty('--mouse-x', currentX + 'px');
            hero.style.setProperty('--mouse-y', currentY + 'px');
            
            requestAnimationFrame(animateParallax);
        }
        
        animateParallax();
    }

    // Ripple effect on buttons
    const buttons = document.querySelectorAll('.btn-text, .btn-submit, .nav-contact');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Text reveal animation for hero title (word by word)
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && window.innerWidth > 768) {
        const text = heroTitle.textContent;
        const words = text.split(' ');
        heroTitle.innerHTML = words.map((word, index) => 
            `<span style="display: inline-block; opacity: 0; animation: fadeInUp 0.6s ease-out ${0.1 + index * 0.1}s forwards;">${word}</span>`
        ).join(' ');
    }

    // Number Counter Animation
    function animateCounter(element, target, duration = 2000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = Math.floor(target);
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }

    // Observe elements with counter class
    const counterObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                const target = parseInt(entry.target.getAttribute('data-target')) || 100;
                animateCounter(entry.target, target);
            }
        });
    }, { threshold: 0.5 });

    // Find and observe all counter elements
    document.querySelectorAll('.counter-number').forEach(counter => {
        counterObserver.observe(counter);
    });

    // Scroll progress indicator
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });

    // Parallax scroll for sections
    const parallaxSections = document.querySelectorAll('.section');
    window.addEventListener('scroll', () => {
        parallaxSections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.05;
            
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                section.style.setProperty('--scroll-offset', rate + 'px');
            }
        });
    });

    // Contact Form Handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formMessage = document.getElementById('formMessage');
            const submitButton = contactForm.querySelector('.btn-submit');
            const originalText = submitButton.textContent;
            
            // Disable button and show loading state
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
            formMessage.style.display = 'none';
            
            // Get form data
            const formData = new FormData(contactForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                message: formData.get('message')
            };
            
            // Simple validation
            if (!data.name || !data.email || !data.message) {
                formMessage.className = 'form-message error';
                formMessage.textContent = 'Please fill in all fields.';
                formMessage.style.display = 'block';
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                formMessage.className = 'form-message error';
                formMessage.textContent = 'Please enter a valid email address.';
                formMessage.style.display = 'block';
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                return;
            }
            
            try {
                // Use mailto as fallback (you can replace this with a form service)
                const subject = encodeURIComponent(`Contact from ${data.name}`);
                const body = encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`);
                const mailtoLink = `mailto:contact@polymathsphere.com?subject=${subject}&body=${body}`;
                
                // Open mailto (this will use user's default email client)
                window.location.href = mailtoLink;
                
                // Show success message
                formMessage.className = 'form-message success';
                formMessage.textContent = 'Thank you! Your email client should open shortly.';
                formMessage.style.display = 'block';
                
                // Reset form
                contactForm.reset();
                
                // Re-enable button
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 5000);
                
            } catch (error) {
                formMessage.className = 'form-message error';
                formMessage.textContent = 'An error occurred. Please try again or email us directly.';
                formMessage.style.display = 'block';
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        });
    }
});

// Add dynamic styles
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(99, 102, 241, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .scroll-progress {
        position: fixed;
        top: 0;
        left: 0;
        height: 2px;
        background: linear-gradient(90deg, var(--color-accent), var(--color-accent-light));
        z-index: 9999;
        transition: width 0.1s ease;
        box-shadow: 0 0 10px var(--color-glow);
    }
    
    @media (prefers-color-scheme: dark) {
        .scroll-progress {
            box-shadow: 0 0 10px rgba(129, 140, 248, 0.5);
        }
    }
    
    .counter-number {
        transition: transform 0.3s ease;
    }
    
    .counter-number.counted {
        animation: counterPop 0.5s ease;
    }
    
    @keyframes counterPop {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
    }
`;
document.head.appendChild(style);
