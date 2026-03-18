document.addEventListener('DOMContentLoaded', function() {
    // --- 0. Inicialização de Efeitos High-Tech ---
    initCustomCursor();
    initParticles();
    initTypewriter();
    initTerminal();
    initSnakeGame();
    initSwiper();

    // --- Rolagem Suave (Smooth Scroll) ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            // Pega o ID da seção do href (ex: #projetos)
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // Rola suavemente até a seção
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });

                // Se for um menu mobile aberto, fecha-o após o clique
                const navList = document.querySelector('#main-header nav ul');
                const menuToggle = document.getElementById('menu-toggle');
                if (navList && navList.classList.contains('active')) {
                    navList.classList.remove('active');
                    if (menuToggle) {
                        menuToggle.classList.remove('active');
                    }
                }
            }
        });
    });

    // --- 2. Menu Responsivo (Toggle para Mobile) ---
    // Você precisará adicionar um botão no seu HTML dentro do <header> para isso, por exemplo:
    // <button id="menu-toggle" class="menu-toggle" aria-label="Abrir menu">
    //     <i class="fas fa-bars"></i>
    // </button>
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.querySelector('#main-header nav ul');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', function() {
            navList.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // --- Destaque do Link Ativo no Menu (Scroll Spy) ---
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('#main-header nav ul li a');

    function highlightNavLink() {
        let currentSectionId = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - navList.clientHeight;
            const sectionHeight = section.clientHeight;

            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.id;
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(currentSectionId)) {
                link.classList.add('active');
            }
        });
    }

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
            const formAction = contactForm.action;

            try {
                const response = await fetch(formAction, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    if (formFeedback) {
                        formFeedback.textContent = 'Sua mensagem foi enviada com sucesso! Entrarei em contato em breve.';
                        formFeedback.style.color = 'green';
                    }
                    contactForm.reset();
                } else {
                    const errorData = await response.json();
                    let errorMessage = 'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.';
                    if (errorData && errorData.errors) {
                        errorMessage += ' Detalhes: ' + errorData.errors.map(err => err.message).join(', ');
                    } else if (errorData && errorData.error) {
                        errorMessage += ' Detalhes: ' + errorData.error;
                    }
                    
                    if (formFeedback) {
                        formFeedback.textContent = errorMessage;
                        formFeedback.style.color = 'red';
                    }
                }
            } catch (error) {
                console.error('Erro de submissão:', error);
                if (formFeedback) {
                    formFeedback.textContent = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
                    formFeedback.style.color = 'red';
                }
            } finally {
                formSubmitButton.disabled = false;
                formSubmitButton.textContent = 'Enviar Mensagem';
            }
        });
    }

    // Chama a função ao carregar a página e ao rolar
    window.addEventListener('scroll', highlightNavLink);
    window.addEventListener('resize', highlightNavLink); // Para reajustar em redimensionamento
    highlightNavLink(); // Chama uma vez para definir o estado inicial

    // --- 4. Modal de Visualização de Imagem ---
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const captionText = document.getElementById('caption');
    const closeModal = document.querySelector('.close-modal');

    // Seleciona os wrappers das imagens para evitar que o overlay (::before) bloqueie o clique
    const projectWrappers = document.querySelectorAll('.project-image-wrapper');

    projectWrappers.forEach(wrapper => {
        wrapper.style.cursor = 'pointer';
        
        wrapper.addEventListener('click', function() {
            const img = this.querySelector('img');
            if (img) {
                modal.style.display = 'block';
                modalImg.src = img.src;
                captionText.innerHTML = img.alt;
                document.body.style.overflow = 'hidden'; // Impede scroll ao abrir modal
            }
        });
    });

    if (closeModal) {
        closeModal.addEventListener('click', function() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restaura scroll
        });
    }

    // Fecha ao clicar fora da imagem
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Fecha com a tecla ESC
    window.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // --- 5. Animações de Scroll (Reveal) ---
    // Seleciona elementos para adicionar a classe 'reveal' dinamicamente
    const elementsToReveal = document.querySelectorAll(
        '.project-card, .research-item, .about-section .container, .contact-section form, section h2'
    );
    
    // Adiciona a classe base a todos eles
    elementsToReveal.forEach(el => el.classList.add('reveal'));

    // Configura o IntersectionObserver
    const revealObserverOptions = {
        threshold: 0.15, // Aciona quando 15% estiver visível
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            // Adiciona a classe active para disparar a animação
            entry.target.classList.add('active');
            // Deixa de observar após revelar (animação acontece só uma vez)
            observer.unobserve(entry.target);
        });
    }, revealObserverOptions);

    elementsToReveal.forEach(el => {
        revealObserver.observe(el);
    });

    // --- Funções de Suporte High-Tech ---

    function initCustomCursor() {
        const cursor = document.querySelector('.cursor');
        const follower = document.querySelector('.cursor-follower');
        const links = document.querySelectorAll('a, button, .project-card, .research-item');

        if (!cursor || !follower) return;

        let mouseX = 0, mouseY = 0;
        let followerX = 0, followerY = 0;

        window.addEventListener('mousemove', e => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            cursor.style.transform = `translate3d(${mouseX - 4}px, ${mouseY - 4}px, 0)`;
        });

        // Suavização do seguidor com requestAnimationFrame
        function render() {
            followerX += (mouseX - followerX) * 0.15;
            followerY += (mouseY - followerY) * 0.15;
            follower.style.transform = `translate3d(${followerX - 17}px, ${followerY - 17}px, 0)`;
            requestAnimationFrame(render);
        }
        render();

        links.forEach(link => {
            link.addEventListener('mouseenter', () => {
                follower.style.transform += ' scale(2)';
                follower.style.background = 'rgba(0, 242, 254, 0.1)';
                follower.style.borderColor = 'transparent';
                cursor.style.transform += ' scale(0.5)';
            });
            link.addEventListener('mouseleave', () => {
                follower.style.transform = follower.style.transform.replace(' scale(2)', '');
                follower.style.background = 'transparent';
                follower.style.borderColor = 'var(--accent-primary)';
                cursor.style.transform = cursor.style.transform.replace(' scale(0.5)', '');
            });
        });
    }

    function initParticles() {
        if (typeof particlesJS !== 'undefined') {
            particlesJS('particles-js', {
                "particles": {
                    "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
                    "color": { "value": "#00f2fe" },
                    "shape": { "type": "circle" },
                    "opacity": { "value": 0.2, "random": false },
                    "size": { "value": 3, "random": true },
                    "line_linked": { "enable": true, "distance": 150, "color": "#00f2fe", "opacity": 0.1, "width": 1 },
                    "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
                },
                "interactivity": {
                    "detect_on": "canvas",
                    "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
                    "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 0.5 } }, "push": { "particles_nb": 4 } }
                },
                "retina_detect": true
            });
        }
    }

    function initTypewriter() {
        const textElement = document.getElementById('typewriter-text');
        if (!textElement) return;

        const words = [
            "Desenvolvedor Full-stack",
            "Pesquisador em Machine Learning",
            "Especialista em NLP",
            "Full-stack Developer & ML Researcher"
        ];
        
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typeSpeed = 100;

        function type() {
            const currentWord = words[wordIndex];
            
            if (isDeleting) {
                textElement.textContent = currentWord.substring(0, charIndex - 1);
                charIndex--;
                typeSpeed = 50;
            } else {
                textElement.textContent = currentWord.substring(0, charIndex + 1);
                charIndex++;
                typeSpeed = 100;
            }

            if (!isDeleting && charIndex === currentWord.length) {
                isDeleting = true;
                typeSpeed = 2000; // Pausa no final da palavra
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                typeSpeed = 500;
            }

            setTimeout(type, typeSpeed);
        }

        type();
    }

    function initSwiper() {
        if (!document.querySelector('.projects-slider')) return;
        
        new Swiper('.projects-slider', {
            effect: 'coverflow',
            grabCursor: true,
            centeredSlides: true,
            slidesPerView: 'auto',
            loop: true,
            spaceBetween: 30,
            coverflowEffect: {
                rotate: 15,
                stretch: 0,
                depth: 300,
                modifier: 1,
                slideShadows: true,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                320: { spaceBetween: 20 },
                768: { spaceBetween: 30 }
            }
        });
    }

    function initTerminal() {
        const terminalBody = document.getElementById('terminal-body');
        const output = document.getElementById('skills-output');
        const promptLine = document.getElementById('terminal-prompt-line');
        const commandText = "./list_skills.py --category ALL";
        const commandEl = document.getElementById('type-skills-cmd');
        
        if (!terminalBody || !output) return;

        const skills = [
            { cat: "Frontend", items: ["React 19", "Next.js 15", "TypeScript", "Tailwind CSS", "Redux"] },
            { cat: "Backend", items: ["Python (Django/FastAPI)", "Node.js", "PostgreSQL", "Drizzle ORM", "Docker"] },
            { cat: "IA/ML", items: ["NLP", "Machine Learning", "BERT/LLMs", "Scikit-Learn", "Pandas/NumPy"] }
        ];

        let isStarted = false;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isStarted) {
                isStarted = true;
                startTyping();
            }
        }, { threshold: 0.5 });

        observer.observe(terminalBody);

        function startTyping() {
            commandEl.textContent = "";
            let i = 0;
            const typeInterval = setInterval(() => {
                commandEl.textContent += commandText[i];
                i++;
                if (i === commandText.length) {
                    clearInterval(typeInterval);
                    setTimeout(showOutput, 500);
                }
            }, 50);
        }

        function showOutput() {
            let delay = 0;
            const skillsDiv = document.createElement('div');
            skillsDiv.className = 'skills-list';
            output.appendChild(skillsDiv);

            skills.forEach(category => {
                const catEl = document.createElement('div');
                catEl.className = 'skill-category';
                catEl.innerHTML = `<span style="color: var(--accent-purple)">[${category.cat}]</span>`;
                skillsDiv.appendChild(catEl);

                category.items.forEach(skill => {
                    setTimeout(() => {
                        const sEl = document.createElement('div');
                        sEl.className = 'skill-tag';
                        sEl.textContent = `> ${skill}`;
                        sEl.style.opacity = '1';
                        catEl.appendChild(sEl);
                    }, delay);
                    delay += 100;
                });
                delay += 200;
            });

            setTimeout(() => {
                if (promptLine) promptLine.classList.remove('hidden');
            }, delay + 500);
        }
    }

    function initSnakeGame() {
        const greenBtn = document.querySelector('.dot.green');
        const overlay = document.getElementById('snake-overlay');
        const closeBtn = document.getElementById('close-snake');
        const canvas = document.getElementById('snakeCanvas');
        if (!canvas || !greenBtn) return;
        
        const ctx = canvas.getContext('2d');
        let clickCount = 0;

        greenBtn.addEventListener('click', () => {
            clickCount++;
            if (clickCount === 3) {
                openGame();
                clickCount = 0;
            }
        });

        let gameLoop;
        let snake, food, dx, dy, score, highScore = localStorage.getItem('snake-high') || 0;
        const exitBtn = document.getElementById('snake-exit');
        
        const closeGame = () => {
            overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
            clearInterval(gameLoop);
        };

        if (closeBtn) closeBtn.addEventListener('click', closeGame);
        if (exitBtn) exitBtn.addEventListener('click', closeGame);

        window.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeGame();
        });

        document.getElementById('snake-high').textContent = highScore;

        function openGame() {
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            resetGame();
            gameLoop = setInterval(draw, 100);
        }

        function resetGame() {
            snake = [{x: 200, y: 200}, {x: 190, y: 200}, {x: 180, y: 200}];
            food = {x: 0, y: 0};
            dx = 10; dy = 0;
            score = 0;
            document.getElementById('snake-score').textContent = score;
            createFood();
        }

        function createFood() {
            food.x = Math.floor(Math.random() * 39) * 10;
            food.y = Math.floor(Math.random() * 39) * 10;
        }

        function draw() {
            const head = {x: snake[0].x + dx, y: snake[0].y + dy};

            // Colisões
            if (head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 400 || snake.some(s => s.x === head.x && s.y === head.y)) {
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('snake-high', highScore);
                    document.getElementById('snake-high').textContent = highScore;
                }
                resetGame();
                return;
            }

            snake.unshift(head);

            if (head.x === food.x && head.y === food.y) {
                score += 10;
                document.getElementById('snake-score').textContent = score;
                createFood();
            } else {
                snake.pop();
            }

            // Render
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, 400, 400);

            ctx.fillStyle = '#00f2fe';
            snake.forEach(s => ctx.fillRect(s.x, s.y, 9, 9));

            ctx.fillStyle = '#8b5cf6';
            ctx.fillRect(food.x, food.y, 9, 9);
        }

        window.addEventListener('keydown', e => {
            if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -10; }
            if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 10; }
            if (e.key === 'ArrowLeft' && dx === 0) { dx = -10; dy = 0; }
            if (e.key === 'ArrowRight' && dx === 0) { dx = 10; dy = 0; }
        });

        // Controles Mobile
        const btnUp = document.getElementById('snake-up');
        const btnDown = document.getElementById('snake-down');
        const btnLeft = document.getElementById('snake-left');
        const btnRight = document.getElementById('snake-right');

        const setDirection = (newDx, newDy) => {
            if (newDx !== 0 && dx === 0) { dx = newDx; dy = 0; }
            if (newDy !== 0 && dy === 0) { dx = 0; dy = newDy; }
        };

        if (btnUp) {
            btnUp.addEventListener('click', (e) => { e.preventDefault(); setDirection(0, -10); });
            btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection(0, -10); }, {passive: false});
        }
        if (btnDown) {
            btnDown.addEventListener('click', (e) => { e.preventDefault(); setDirection(0, 10); });
            btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection(0, 10); }, {passive: false});
        }
        if (btnLeft) {
            btnLeft.addEventListener('click', (e) => { e.preventDefault(); setDirection(-10, 0); });
            btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection(-10, 0); }, {passive: false});
        }
        if (btnRight) {
            btnRight.addEventListener('click', (e) => { e.preventDefault(); setDirection(10, 0); });
            btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection(10, 0); }, {passive: false});
        }
    }

    const toggleCursorBtn = document.getElementById('toggle-cursor');
    if (toggleCursorBtn) {
        toggleCursorBtn.addEventListener('click', () => {
            const isDefault = document.body.classList.toggle('default-cursor');
            
            if (isDefault) {
                document.body.style.cursor = 'auto'; // Mostra cursor padrão
                document.querySelector('.cursor').style.display = 'none';
                document.querySelector('.cursor-follower').style.display = 'none';
            } else {
                document.body.style.cursor = 'none'; // Esconde cursor padrão
                document.querySelector('.cursor').style.display = 'block';
                document.querySelector('.cursor-follower').style.display = 'block';
            }
        });
    }

});