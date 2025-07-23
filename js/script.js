document.addEventListener('DOMContentLoaded', function() {
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
});