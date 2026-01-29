// ===== Supabase Configuration =====
const SUPABASE_URL = 'https://vhpmmfhfwnpmavytoomd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocG1tZmhmd25wbWF2eXRvb21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTgyMDYsImV4cCI6MjA4NTE3NDIwNn0.6JmfnTTR8onr3ZgFpzdZa4BbVBraUyePVEUHOJgxmuk';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Mobile Menu Toggle =====
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');
const navCta = document.querySelector('.nav-cta');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        // In a full implementation, this would toggle a mobile menu overlay
    });
}

// ===== Smooth Scroll for Anchor Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = targetElement.offsetTop - navHeight - 20;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===== Navbar Background on Scroll =====
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 100) {
        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = 'none';
    }
});

// ===== Modal Functions =====
function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    modal.classList.add('active');

    // Trigger confetti - big celebration!
    if (typeof confetti === 'function') {
        const duration = 1000;
        const end = Date.now() + duration;
        const confettiZIndex = 2100; // Above modal (2000)

        // Continuous confetti rain
        const frame = () => {
            confetti({
                particleCount: 4,
                angle: 60,
                spread: 80,
                origin: { x: 0, y: 0.5 },
                colors: ['#6366f1', '#8b5cf6', '#a855f7', '#10b981', '#f59e0b'],
                zIndex: confettiZIndex
            });
            confetti({
                particleCount: 4,
                angle: 120,
                spread: 80,
                origin: { x: 1, y: 0.5 },
                colors: ['#6366f1', '#8b5cf6', '#a855f7', '#10b981', '#f59e0b'],
                zIndex: confettiZIndex
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();

        // Big center bursts
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#8b5cf6', '#a855f7', '#10b981', '#f59e0b'],
            scalar: 1.2,
            zIndex: confettiZIndex
        });

        setTimeout(() => {
            confetti({
                particleCount: 100,
                spread: 120,
                origin: { y: 0.5 },
                colors: ['#6366f1', '#8b5cf6', '#a855f7', '#10b981', '#f59e0b'],
                scalar: 1.5,
                zIndex: confettiZIndex
            });
        }, 300);

        setTimeout(() => {
            confetti({
                particleCount: 80,
                spread: 150,
                origin: { y: 0.4 },
                colors: ['#6366f1', '#8b5cf6', '#a855f7', '#10b981', '#f59e0b'],
                scalar: 1.3,
                zIndex: confettiZIndex
            });
        }, 600);
    }
}

function closeModal() {
    const modal = document.getElementById('success-modal');
    modal.classList.remove('active');
}

// Close modal on overlay click
document.getElementById('success-modal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ===== Form Submission =====
const signupForm = document.getElementById('signup-form');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = signupForm.querySelector('input[type="email"]');
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const email = emailInput.value.trim();

        if (!email) return;

        // Disable button and show loading state
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="spinner" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" stroke-dasharray="40" stroke-dashoffset="10">
                    <animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="1s" repeatCount="indefinite"/>
                </circle>
            </svg>
            Processing...
        `;

        try {
            console.log('Attempting to insert email:', email);

            // Insert email into Supabase waitlist table
            const { data, error } = await supabaseClient
                .from('Waitlist')
                .insert([{ email: email }]);

            console.log('Supabase response:', { data, error });

            if (error) {
                console.error('Supabase error details:', error);
                // Check if it's a duplicate email error
                if (error.code === '23505') {
                    throw new Error('already_registered');
                }
                throw error;
            }

            // Success - show modal with confetti
            emailInput.value = '';
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

            showSuccessModal();

        } catch (error) {
            console.error('Signup error:', error);

            // Handle duplicate email
            if (error.message === 'already_registered') {
                submitBtn.innerHTML = 'Already signed up!';
                submitBtn.style.background = '#f59e0b';
            } else {
                submitBtn.innerHTML = 'Error. Try again.';
                submitBtn.style.background = '#ef4444';
            }

            submitBtn.disabled = false;

            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
            }, 2500);
        }
    });
}

// ===== Intersection Observer for Animations =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.feature-card, .step, .pricing-card, .comparison-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
});

// Add animation class styles
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

// ===== Start Automation Flow =====
function startAutomation(templateId) {
    // Store the selected template
    localStorage.setItem('automata_selected_template', templateId);

    // Redirect to signup/login with template context
    // In the future, this could open a modal to collect company info first
    window.location.href = '/app/login.html?template=' + templateId;
}

// ===== Stats Counter Animation =====
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateStats();
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    statsObserver.observe(heroStats);
}

function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');

    statNumbers.forEach(stat => {
        const finalText = stat.textContent;
        const hasX = finalText.includes('x');
        const hasPercent = finalText.includes('%');
        const finalNum = parseInt(finalText);

        let current = 0;
        const increment = finalNum / 30;
        const timer = setInterval(() => {
            current += increment;
            if (current >= finalNum) {
                current = finalNum;
                clearInterval(timer);
            }

            let display = Math.round(current);
            if (hasX) display += 'x';
            if (hasPercent) display += '%';
            stat.textContent = display;
        }, 30);
    });
}
