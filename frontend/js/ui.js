// Utilidades de Interfaz de Usuario

const UI = {
    // Toast notifications
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    // Modal genérico
    showModal(title, bodyContent, footerButtons = []) {
        const modal = document.getElementById('genericModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalFooter = document.getElementById('modalFooter');

        modalTitle.textContent = title;
        modalBody.innerHTML = bodyContent;

        // Limpiar footer
        modalFooter.innerHTML = '';

        // Agregar botones
        footerButtons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = button.className || 'btn btn-secondary';
            btn.innerHTML = button.text;
            btn.onclick = button.onClick;
            modalFooter.appendChild(btn);
        });

        // Botón de cerrar por defecto
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn btn-secondary';
        closeBtn.innerHTML = '<i class="fas fa-times"></i> Cerrar';
        closeBtn.onclick = () => this.hideModal('genericModal');
        modalFooter.appendChild(closeBtn);

        modal.classList.add('show');

        // Cerrar al hacer clic fuera
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.hideModal('genericModal');
            }
        };
    },

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
    },

    // Preview modal
    showPreviewModal(file) {
        const modal = document.getElementById('previewModal');
        const fileName = document.getElementById('previewFileName');
        const previewContainer = document.getElementById('previewContainer');

        fileName.textContent = file.original_name;

        // Limpiar contenedor
        previewContainer.innerHTML = '';

        // Determinar tipo de preview
        const mimeType = file.mime_type;

        if (mimeType.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = api.getFileServeUrl(file.id);
            img.style.maxWidth = '100%';
            img.style.maxHeight = '70vh';
            img.style.objectFit = 'contain';
            previewContainer.appendChild(img);

        } else if (mimeType.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = api.getFileServeUrl(file.id);
            video.controls = true;
            video.style.maxWidth = '100%';
            video.style.maxHeight = '70vh';
            previewContainer.appendChild(video);

        } else if (mimeType.startsWith('audio/')) {
            const audio = document.createElement('audio');
            audio.src = api.getFileServeUrl(file.id);
            audio.controls = true;
            audio.style.width = '100%';
            previewContainer.appendChild(audio);

        } else if (mimeType === 'application/pdf') {
            const iframe = document.createElement('iframe');
            iframe.src = api.getFileServeUrl(file.id);
            iframe.style.width = '100%';
            iframe.style.height = '70vh';
            iframe.style.border = 'none';
            previewContainer.appendChild(iframe);

        } else if (mimeType.startsWith('text/')) {
            previewContainer.innerHTML = '<p>Vista previa de texto no disponible. Use descargar para ver el contenido.</p>';

        } else {
            previewContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-file" style="font-size: 64px; color: var(--text-secondary); margin-bottom: 20px;"></i>
                    <p>Vista previa no disponible para este tipo de archivo</p>
                    <p style="color: var(--text-secondary);">${file.mime_type}</p>
                </div>
            `;
        }

        // Configurar botones
        document.getElementById('downloadFromPreview').onclick = () => {
            window.open(api.getFileDownloadUrl(file.id), '_blank');
        };

        document.getElementById('deleteFromPreview').onclick = async () => {
            if (confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
                try {
                    await api.deleteFile(file.id);
                    UI.showToast('Archivo eliminado', 'success');
                    UI.hideModal('previewModal');
                    Files.loadFiles();
                } catch (error) {
                    UI.showToast(error.message, 'error');
                }
            }
        };

        modal.classList.add('show');

        // Cerrar al hacer clic fuera
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.hideModal('previewModal');
            }
        };
    },

    // Formatear tamaño de archivo
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    },

    // Formatear fecha
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Obtener icono por tipo de archivo
    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return 'fa-file-image';
        if (mimeType.startsWith('video/')) return 'fa-file-video';
        if (mimeType.startsWith('audio/')) return 'fa-file-audio';
        if (mimeType === 'application/pdf') return 'fa-file-pdf';
        if (mimeType.startsWith('application/')) return 'fa-file-alt';
        if (mimeType.startsWith('text/')) return 'fa-file-code';
        return 'fa-file';
    },

    // Loading spinner
    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'flex';
    },

    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
    },

    // Formulario de creación de carpeta
    showCreateFolderDialog(parentId = null) {
        const bodyContent = `
            <form id="createFolderForm">
                <div class="form-group">
                    <label>Nombre de la carpeta</label>
                    <input type="text" id="folderName" class="auth-form input" required style="width: 100%; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
                </div>
            </form>
        `;

        this.showModal('Nueva Carpeta', bodyContent, [
            {
                text: '<i class="fas fa-check"></i> Crear',
                className: 'btn btn-primary',
                onClick: async () => {
                    const name = document.getElementById('folderName').value;

                    if (!name.trim()) {
                        UI.showToast('El nombre no puede estar vacío', 'error');
                        return;
                    }

                    try {
                        await api.createFolder(name, parentId);
                        UI.showToast('Carpeta creada exitosamente', 'success');
                        UI.hideModal('genericModal');
                        Files.loadFiles();
                        Folders.loadFolders();
                    } catch (error) {
                        UI.showToast(error.message, 'error');
                    }
                }
            }
        ]);
    }
};

// Cerrar modales con botones de cierre
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal').classList.remove('show');
    });
});
