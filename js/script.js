document.addEventListener('DOMContentLoaded', function() {
    // --- 0. Inicialização de Efeitos High-Tech ---
    initParticles();
    initTypewriter();
    initTerminal();
    initSnakeGame();
    initSwiper();

    // --- Rolagem Suave (Smooth Scroll) ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });

                const navList = document.querySelector('#main-header nav ul');
                const menuToggle = document.getElementById('menu-toggle');
                if (navList && navList.classList.contains('active')) {
                    navList.classList.remove('active');
                    if (menuToggle) menuToggle.classList.remove('active');
                }
            }
        });
    });

    // --- 2. Menu Responsivo (Toggle para Mobile) ---
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.querySelector('#main-header nav ul');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', function() {
            navList.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // --- Destaque do Link Ativo no Menu (Scroll Spy via IntersectionObserver) ---
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('#main-header nav ul li a');

    const observerOption = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5 // 50% da seção visível para marcar como ativa
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOption);

    sections.forEach(section => observer.observe(section));

    // --- 3. Formulário de Contato ---
    const contactForm = document.querySelector('#contato form');
    const formSubmitButton = contactForm ? contactForm.querySelector('button[type="submit"]') : null;
    const formFeedback = document.getElementById('form-feedback');

    if (contactForm && formSubmitButton) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            formSubmitButton.disabled = true;
            formSubmitButton.textContent = 'Enviando...';

            if (formFeedback) {
                formFeedback.textContent = '';
                formFeedback.style.color = '';
            }

            const formData = new FormData(contactForm);
            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    if (formFeedback) {
                        formFeedback.textContent = 'Sua mensagem foi enviada com sucesso!';
                        formFeedback.style.color = 'var(--accent-primary)';
                    }
                    contactForm.reset();
                } else {
                    if (formFeedback) {
                        formFeedback.textContent = 'Erro ao enviar. Tente novamente.';
                        formFeedback.style.color = 'red';
                    }
                }
            } catch (error) {
                if (formFeedback) {
                    formFeedback.textContent = 'Erro de conexão.';
                    formFeedback.style.color = 'red';
                }
            } finally {
                formSubmitButton.disabled = false;
                formSubmitButton.textContent = 'Enviar Mensagem';
            }
        });
    }

    // --- 4. Modal de Detalhes do Projeto (Premium) ---
    const projectModal = document.getElementById('project-modal');
    const modalImg = document.getElementById('modal-project-img');
    const modalTitle = document.getElementById('modal-project-title');
    const modalTech = document.getElementById('modal-project-tech');
    const modalDescription = document.getElementById('modal-project-description');
    const modalLinks = document.getElementById('modal-project-links');
    const closeModalBtn = document.querySelector('.close-modal-btn');

    const projectCards = document.querySelectorAll('.project-card');

    const modalInfo = document.querySelector('.modal-info');
    const modalVisual = document.querySelector('.modal-visual');

    projectCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Se clicar no botão de tema ou links diretos, não abre o modal
            if (e.target.closest('.theme-switcher-project') || e.target.closest('.project-links')) return;

            const title = card.querySelector('h3').textContent;
            const img = card.querySelector('.project-image-wrapper img').src;
            const techText = card.querySelector('.technologies').textContent;
            const fullDesc = card.querySelector('.project-description-full') ? 
                             card.querySelector('.project-description-full').innerHTML : 
                             card.querySelector('p:not(.technologies)').innerHTML;
            const linksData = card.querySelector('.project-links-data');
            const links = linksData ? linksData.innerHTML : card.querySelector('.project-links').innerHTML;

            // Preenche o modal
            modalTitle.textContent = title;
            modalImg.src = img;
            modalDescription.innerHTML = fullDesc;
            modalLinks.innerHTML = links;

            // Reseta scroll do conteúdo
            if (modalInfo) modalInfo.scrollTop = 0;

            // Inteligência para imagens: Detecta se é longa (screenshot) ou pequena
            const tempImg = new Image();
            tempImg.onload = function() {
                if (modalVisual) {
                    const containerHeight = modalVisual.clientHeight;
                    // Se a imagem for menor que o container, usamos 'contain' para não distorcer
                    if (tempImg.naturalHeight <= containerHeight) {
                        modalImg.classList.add('fit-image');
                    } else {
                        modalImg.classList.remove('fit-image');
                    }
                }
            };
            tempImg.src = img;

            // Limpa e recria badges de tecnologia
            modalTech.innerHTML = '';
            techText.split(',').forEach(tech => {
                const span = document.createElement('span');
                span.textContent = tech.trim();
                modalTech.appendChild(span);
            });

            // Abre o modal
            projectModal.style.display = 'flex';
            setTimeout(() => projectModal.classList.add('active'), 10);
            document.body.style.overflow = 'hidden';
        });
    });

    function closeModal() {
        projectModal.classList.remove('active');
        setTimeout(() => {
            projectModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 400);
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

    window.addEventListener('click', (e) => {
        if (e.target === projectModal) closeModal();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && projectModal.classList.contains('active')) closeModal();
    });

    // --- 5. Lógica de Efeitos Adicionais ---
    function initParticles() {
        if (typeof particlesJS !== 'undefined') {
            particlesJS('particles-js', {
                "particles": {
                    "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
                    "color": { "value": "#00f2fe" },
                    "shape": { "type": "circle" },
                    "opacity": { "value": 0.2 },
                    "size": { "value": 3, "random": true },
                    "line_linked": { "enable": true, "distance": 150, "color": "#00f2fe", "opacity": 0.1, "width": 1 },
                    "move": { "enable": true, "speed": 2 }
                },
                "retina_detect": true
            });
        }
    }

    function initTypewriter() {
        const textElement = document.getElementById('typewriter-text');
        if (!textElement) return;
        const words = ["Desenvolvedor Full-stack", "Pesquisador em Machine Learning", "Especialista em NLP"];
        let wordIndex = 0, charIndex = 0, isDeleting = false;

        function type() {
            const currentWord = words[wordIndex];
            textElement.textContent = isDeleting ? 
                                      currentWord.substring(0, charIndex - 1) : 
                                      currentWord.substring(0, charIndex + 1);
            charIndex = isDeleting ? charIndex - 1 : charIndex + 1;

            let speed = isDeleting ? 50 : 100;
            if (!isDeleting && charIndex === currentWord.length) {
                isDeleting = true;
                speed = 2000;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                speed = 500;
            }
            setTimeout(type, speed);
        }
        type();
    }

    function initSwiper() {
        if (document.querySelector('.projects-slider')) {
            new Swiper('.projects-slider', {
                effect: 'coverflow',
                grabCursor: true,
                centeredSlides: true,
                slidesPerView: 'auto',
                loop: true,
                spaceBetween: 50,
                coverflowEffect: { 
                    rotate: 15, 
                    stretch: 0, 
                    depth: 250, 
                    modifier: 1.5, 
                    slideShadows: true 
                },
                pagination: { el: '.swiper-pagination', clickable: true },
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
            });
        }
    }

    function initTerminal() {
        const terminalBody = document.getElementById('terminal-body');
        const output = document.getElementById('skills-output');
        const commandEl = document.getElementById('type-skills-cmd');
        if (!terminalBody || !output) return;

        const skills = [
            { cat: "Web Fullstack", items: ["Next.js 16 / React 19", "TypeScript / Angular 20", "Tailwind CSS v4", "Radix UI / PrimeNG"] },
            { cat: "Backend & Infra", items: ["Node.js / Python (Django)", "Docker / GitHub Actions", "PostgreSQL / Redis", "Prisma / Drizzle ORM"] },
            { cat: "IA & Research", items: ["NLP / BERT / Transformers", "Machine Learning", "Data Viz (Chart.js)", "AWS S3 / Clerk (Auth)"] },
            { cat: "Design & Product", items: ["UI/UX Design (Figma)", "Product Discovery", "Requirements / MVP", "MFA / Cybersecurity"] }
        ];

        let isStarted = false;
        new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isStarted) {
                isStarted = true;
                let i = 0, text = "./list_skills.py --category ALL";
                const type = setInterval(() => {
                    commandEl.textContent += text[i++];
                    if (i === text.length) {
                        clearInterval(type);
                        setTimeout(showOutput, 500);
                    }
                }, 50);
            }
        }, { threshold: 0.5 }).observe(terminalBody);

        function showOutput() {
            let delay = 0;
            skills.forEach(category => {
                const catEl = document.createElement('div');
                catEl.className = 'skill-category';
                catEl.innerHTML = `<span style="color: var(--accent-purple)">[${category.cat}]</span>`;
                output.appendChild(catEl);
                category.items.forEach(skill => {
                    setTimeout(() => {
                        const sEl = document.createElement('div');
                        sEl.className = 'skill-tag';
                        sEl.textContent = `> ${skill}`;
                        sEl.style.opacity = '1';
                        catEl.appendChild(sEl);
                    }, delay += 100);
                });
                delay += 200;
            });
        }
    }

    function initSnakeGame() {
        const greenBtn = document.querySelector('.dot.green');
        const overlay = document.getElementById('snake-overlay');
        const canvas = document.getElementById('snakeCanvas');
        if (!canvas || !greenBtn) return;
        const ctx = canvas.getContext('2d');
        let clickCount = 0;

        greenBtn.addEventListener('click', () => {
            if (++clickCount === 3) {
                overlay.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                resetGame();
                gameLoop = setInterval(draw, 100);
                clickCount = 0;
            }
        });

        let gameLoop, snake, food, dx, dy, score;
        function resetGame() {
            snake = [{x: 200, y: 200}, {x: 190, y: 200}];
            food = {x: 100, y: 100};
            dx = 10; dy = 0; score = 0;
        }
        function draw() {
            const head = {x: snake[0].x + dx, y: snake[0].y + dy};
            if (head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 400 || snake.some(s => s.x === head.x && s.y === head.y)) {
                resetGame(); return;
            }
            snake.unshift(head);
            if (head.x === food.x && head.y === food.y) {
                score += 10;
                food = {x: Math.floor(Math.random()*39)*10, y: Math.floor(Math.random()*39)*10};
            } else snake.pop();

            ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, 400, 400);
            ctx.fillStyle = '#00f2fe'; snake.forEach(s => ctx.fillRect(s.x, s.y, 9, 9));
            ctx.fillStyle = '#8b5cf6'; ctx.fillRect(food.x, food.y, 9, 9);
        }

        window.addEventListener('keydown', e => {
            if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -10; }
            if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 10; }
            if (e.key === 'ArrowLeft' && dx === 0) { dx = -10; dy = 0; }
            if (e.key === 'ArrowRight' && dx === 0) { dx = 10; dy = 0; }
        });
        
        const closeBtn = document.getElementById('close-snake');
        if (closeBtn) closeBtn.addEventListener('click', () => {
            overlay.style.display = 'none'; document.body.style.overflow = 'auto'; clearInterval(gameLoop);
        });
    }

    // --- 6. Interatividade Específica PAAD ---
    const paadImg = document.getElementById('paad-img');
    const paadThemeBtns = document.querySelectorAll('#project-paad .theme-btn');
    if (paadImg) {
        paadThemeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                paadImg.style.opacity = '0.3';
                setTimeout(() => {
                    paadImg.src = `img/projeto-site-paad-${btn.dataset.theme}.png`;
                    paadImg.style.opacity = '1';
                }, 200);
                paadThemeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

});