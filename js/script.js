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
                const menuToggle = document.getElementById('menu-toggle'); // Assumindo que você terá este ID para o botão do menu
                if (navList && navList.classList.contains('active')) {
                    navList.classList.remove('active');
                    // Se tiver um botão de toggle, pode ajustar seu estado visual aqui
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
            menuToggle.classList.toggle('active'); // Para mudar o ícone ou estilo do botão
        });
    }

    // --- Destaque do Link Ativo no Menu (Scroll Spy) ---
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('#main-header nav ul li a');

    function highlightNavLink() {
        let currentSectionId = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - navList.clientHeight; // Ajusta pela altura do cabeçalho
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

    // Chama a função ao carregar a página e ao rolar
    window.addEventListener('scroll', highlightNavLink);
    window.addEventListener('resize', highlightNavLink); // Para reajustar em redimensionamento
    highlightNavLink(); // Chama uma vez para definir o estado inicial
});