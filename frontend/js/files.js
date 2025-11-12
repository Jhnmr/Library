// Gestión de Archivos

const Files = {
    currentFolderId: null,
    searchTerm: '',
    filterType: '',
    sortBy: 'created_at',
    sortOrder: 'DESC',

    async loadFiles() {
        try {
            UI.showLoading();

            const params = {
                folderId: this.currentFolderId || 'null',
                sortBy: this.sortBy,
                order: this.sortOrder
            };

            if (this.searchTerm) {
                params.search = this.searchTerm;
            }

            if (this.filterType) {
                params.type = this.filterType;
            }

            const [filesResponse, foldersResponse] = await Promise.all([
                api.getFiles(params),
                api.getFolders({ parentId: this.currentFolderId || 'null' })
            ]);

            this.renderFolders(foldersResponse.data.folders);
            this.renderFiles(filesResponse.data.files);

            UI.hideLoading();

        } catch (error) {
            console.error('Error loading files:', error);
            UI.showToast('Error al cargar archivos', 'error');
            UI.hideLoading();
        }
    },

    renderFolders(folders) {
        const container = document.getElementById('foldersContainer');
        container.innerHTML = '';

        folders.forEach(folder => {
            const folderCard = document.createElement('div');
            folderCard.className = 'folder-card';
            folderCard.innerHTML = `
                <i class="fas fa-folder"></i>
                <h3>${folder.name}</h3>
                <div class="folder-meta">
                    <span>${folder.file_count || 0} archivos</span>
                </div>
            `;

            folderCard.onclick = () => {
                this.openFolder(folder.id);
            };

            container.appendChild(folderCard);
        });
    },

    renderFiles(files) {
        const container = document.getElementById('filesContainer');
        container.innerHTML = '';

        if (files.length === 0 && document.getElementById('foldersContainer').children.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <i class="fas fa-folder-open" style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p style="font-size: 18px;">No hay archivos aquí</p>
                    <p>Sube tu primer archivo para comenzar</p>
                </div>
            `;
            return;
        }

        files.forEach(file => {
            const fileCard = document.createElement('div');
            fileCard.className = 'file-card';

            const thumbnail = file.mime_type.startsWith('image/')
                ? `<img src="${api.getFileServeUrl(file.id)}" alt="${file.original_name}">`
                : `<i class="fas ${UI.getFileIcon(file.mime_type)}"></i>`;

            fileCard.innerHTML = `
                <div class="file-thumbnail">${thumbnail}</div>
                <div class="file-info">
                    <div class="file-name" title="${file.original_name}">${file.original_name}</div>
                    <div class="file-meta">
                        <span>${UI.formatFileSize(file.file_size)}</span>
                        <span>${UI.formatDate(file.created_at)}</span>
                    </div>
                </div>
            `;

            fileCard.onclick = () => {
                this.showFilePreview(file);
            };

            container.appendChild(fileCard);
        });
    },

    async showFilePreview(file) {
        try {
            const response = await api.getFileInfo(file.id);
            UI.showPreviewModal(response.data.file);
        } catch (error) {
            UI.showToast('Error al cargar archivo', 'error');
        }
    },

    async openFolder(folderId) {
        this.currentFolderId = folderId;
        await this.updateBreadcrumb();
        await this.loadFiles();
    },

    async updateBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        breadcrumb.innerHTML = '<a href="#" data-folder="null">Inicio</a>';

        if (this.currentFolderId) {
            try {
                const response = await api.getFolderPath(this.currentFolderId);
                const path = response.data.path;

                path.forEach(folder => {
                    const link = document.createElement('a');
                    link.href = '#';
                    link.textContent = folder.name;
                    link.dataset.folder = folder.id;
                    breadcrumb.appendChild(link);
                });

            } catch (error) {
                console.error('Error loading breadcrumb:', error);
            }
        }

        // Event listeners para breadcrumb
        breadcrumb.querySelectorAll('a').forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                const folderId = link.dataset.folder === 'null' ? null : link.dataset.folder;
                this.openFolder(folderId);
            };
        });
    },

    async uploadFile(file) {
        try {
            UI.showToast('Subiendo archivo...', 'success');

            const response = await api.uploadFile(file, this.currentFolderId);

            UI.showToast('Archivo subido exitosamente', 'success');
            this.loadFiles();

        } catch (error) {
            if (error.message.includes('ya existe')) {
                UI.showToast('Este archivo ya existe en el sistema', 'error');
            } else {
                UI.showToast(error.message, 'error');
            }
        }
    }
};

// Event Listeners
document.getElementById('uploadFileBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        Files.uploadFile(file);
        e.target.value = ''; // Reset input
    }
});

document.getElementById('createFolderBtn').addEventListener('click', () => {
    UI.showCreateFolderDialog(Files.currentFolderId);
});

document.getElementById('searchInput').addEventListener('input', (e) => {
    Files.searchTerm = e.target.value;
    setTimeout(() => {
        if (Files.searchTerm === e.target.value) {
            Files.loadFiles();
        }
    }, 500);
});

document.getElementById('filterType').addEventListener('change', (e) => {
    Files.filterType = e.target.value;
    Files.loadFiles();
});

document.getElementById('sortBy').addEventListener('change', (e) => {
    Files.sortBy = e.target.value;
    Files.loadFiles();
});

document.getElementById('sortOrder').addEventListener('change', (e) => {
    Files.sortOrder = e.target.value;
    Files.loadFiles();
});
