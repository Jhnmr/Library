// Gestión de Carpetas

const Folders = {
    async loadFolders() {
        try {
            const response = await api.getFolders();
            this.renderFoldersList(response.data.folders);
        } catch (error) {
            console.error('Error loading folders:', error);
            UI.showToast('Error al cargar carpetas', 'error');
        }
    },

    renderFoldersList(folders) {
        const container = document.getElementById('foldersList');
        container.innerHTML = '';

        if (folders.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <i class="fas fa-folder-open" style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p style="font-size: 18px;">No hay carpetas</p>
                </div>
            `;
            return;
        }

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        table.innerHTML = `
            <thead>
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <th style="padding: 15px; text-align: left;">Nombre</th>
                    <th style="padding: 15px; text-align: left;">Archivos</th>
                    <th style="padding: 15px; text-align: left;">Subcarpetas</th>
                    <th style="padding: 15px; text-align: left;">Creado por</th>
                    <th style="padding: 15px; text-align: left;">Fecha</th>
                    <th style="padding: 15px; text-align: right;">Acciones</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');

        folders.forEach(folder => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid var(--border-color)';

            row.innerHTML = `
                <td style="padding: 15px;">
                    <i class="fas fa-folder" style="color: var(--accent-cyan); margin-right: 10px;"></i>
                    ${folder.name}
                </td>
                <td style="padding: 15px;">${folder.file_count || 0}</td>
                <td style="padding: 15px;">${folder.subfolder_count || 0}</td>
                <td style="padding: 15px; color: var(--text-secondary);">${folder.created_by_name || 'N/A'}</td>
                <td style="padding: 15px; color: var(--text-secondary);">${UI.formatDate(folder.created_at)}</td>
                <td style="padding: 15px; text-align: right;">
                    <button class="btn btn-secondary" style="padding: 6px 12px; margin-right: 8px;" onclick="Folders.openFolder(${folder.id})">
                        <i class="fas fa-folder-open"></i>
                    </button>
                    <button class="btn btn-danger" style="padding: 6px 12px;" onclick="Folders.deleteFolder(${folder.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });

        container.appendChild(table);
    },

    openFolder(folderId) {
        Files.openFolder(folderId);
        App.loadView('files');
    },

    async deleteFolder(folderId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta carpeta?')) {
            return;
        }

        try {
            await api.deleteFolder(folderId, false);
            UI.showToast('Carpeta eliminada', 'success');
            this.loadFolders();
        } catch (error) {
            if (error.message.includes('contiene archivos')) {
                if (confirm('La carpeta contiene archivos. ¿Eliminar todo el contenido?')) {
                    try {
                        await api.deleteFolder(folderId, true);
                        UI.showToast('Carpeta eliminada', 'success');
                        this.loadFolders();
                    } catch (err) {
                        UI.showToast(err.message, 'error');
                    }
                }
            } else {
                UI.showToast(error.message, 'error');
            }
        }
    }
};

// Event Listeners
document.getElementById('createFolderBtn2').addEventListener('click', () => {
    UI.showCreateFolderDialog(null);
});
