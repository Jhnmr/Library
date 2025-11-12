// Aplicación Principal

const App = {
    currentView: 'files',

    async init() {
        console.log('Iniciando Biblioteca Virtual...');

        // Inicializar autenticación
        await Auth.init();

        // Configurar navegación
        this.setupNavigation();

        // Cargar vista inicial si está autenticado
        if (Auth.currentUser) {
            this.loadView('files');
        }
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.loadView(view);

                // Actualizar navegación activa
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    },

    loadView(viewName) {
        // Ocultar todas las vistas
        const views = document.querySelectorAll('.content-view');
        views.forEach(view => view.classList.remove('active'));

        // Mostrar vista seleccionada
        const selectedView = document.getElementById(viewName + 'View');
        if (selectedView) {
            selectedView.classList.add('active');
            this.currentView = viewName;

            // Cargar datos de la vista
            this.loadViewData(viewName);
        }
    },

    async loadViewData(viewName) {
        try {
            switch (viewName) {
                case 'files':
                    await Files.loadFiles();
                    break;

                case 'folders':
                    await Folders.loadFolders();
                    break;

                case 'duplicates':
                    await Duplicates.loadDuplicates();
                    break;

                case 'stats':
                    await Stats.loadStats();
                    break;

                case 'users':
                    if (Auth.isAdmin()) {
                        await Users.loadUsers();
                    }
                    break;

                case 'settings':
                    await Settings.loadSettings();
                    break;
            }
        } catch (error) {
            console.error(`Error loading view ${viewName}:`, error);
        }
    }
};

// Iniciar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
