document.addEventListener('DOMContentLoaded', function() {
    const uploadContainer = document.querySelector('.upload-container');
    const fileInput = document.getElementById('file-upload');
    const uploadButton = uploadContainer ? uploadContainer.querySelector('.btn-primary') : null;
    const resultsTable = document.querySelector('.data-table tbody');
    
    // Add sidebar toggle functionality
    const toggleSidebarBtn = document.querySelector('.toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            // Store the state in localStorage
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
        
        // Restore sidebar state on page load
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
        }
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        document.querySelector('main').appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
    }

    let currentData = {};

    function updateResults(data) {
        if (!data) return;
        currentData = data;
        // Set ATOMS as default active tab if none selected
        let activeTab = document.querySelector('.tab-btn.active');
        if (!activeTab) {
            activeTab = document.querySelector('.tab-btn[data-section="ATOMS"]');
            if (activeTab) activeTab.classList.add('active');
        }
        if (activeTab) {
            displaySectionData(activeTab.dataset.section);
        }
    }

    function displaySectionData(sectionName, filterText = '') {
        const tableContainer = document.getElementById('results-table');
        let data = currentData[sectionName];
        
        // Clear existing content
        tableContainer.innerHTML = '';
        
        if (!data || !data.length) {
            tableContainer.innerHTML = '<div class="no-data">No data available for this section</div>';
            return;
        }

        // Apply search filter if text is provided
        if (filterText) {
            const searchTerms = filterText.toLowerCase()
                .split(/[,\s]+/)
                .filter(term => term.length > 0);

            data = data.filter(row => {
                return searchTerms.every(term => {
                    return Object.entries(row).some(([key, value]) => {
                        if (key === 'Line Number' || value == null) return false;
                        if (Array.isArray(value)) {
                            return value.some(v => v.toString().toLowerCase().includes(term));
                        }
                        return value.toString().toLowerCase().includes(term);
                    });
                });
            });

            if (data.length === 0) {
                tableContainer.innerHTML = '<div class="no-data">No matching results found</div>';
                return;
            }
        }

        // Create table with wrapper for better scrolling
        const table = document.createElement('table');
        table.className = 'data-table';
        table.style.width = '100%';
        
        // Get columns (excluding Line Number, keeping Comments for end)
        const columns = Object.keys(data[0])
            .filter(col => col !== 'Line Number')
            .sort((a, b) => a === 'Comments' ? 1 : b === 'Comments' ? -1 : 0);

        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.replace(/([A-Z])/g, ' $1').trim();
            th.setAttribute('data-column', col);
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create table body
        const tbody = document.createElement('tbody');
        
        data.forEach(entry => {
            const row = document.createElement('tr');
            row.setAttribute('data-line', entry['Line Number']);
            
            columns.forEach(col => {
                const cell = document.createElement('td');
                let value = entry[col];
                
                if (col === 'Comments') {
                    value = Array.isArray(value) ? value.join('; ') : value || '';
                } else if (typeof value === 'number') {
                    value = value.toFixed(3);
                }
                
                cell.textContent = value || '';
                cell.setAttribute('data-label', col);
                row.appendChild(cell);
            });
            
            // Add click handler
            row.addEventListener('click', () => {
                document.querySelectorAll('.data-table tr').forEach(r => r.classList.remove('highlighted'));
                row.classList.add('highlighted');
                showFileContent(entry['Line Number']);
            });
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        tableContainer.appendChild(table);
    }

    async function showFileContent(lineNumber) {
        const activeFileItem = document.querySelector('.file-item.selected');
        if (!activeFileItem) return;

        const dir = activeFileItem.dataset.dir;
        try {
            const response = await fetch('/get_file_content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ dir: dir })
            });

            if (!response.ok) throw new Error('Failed to fetch file content');
            
            const data = await response.json();
            const fileContent = data.content;
            
            // Get panel references
            const fileViewPanel = document.getElementById('file-view-panel');
            const resultsPanel = document.getElementById('results-panel');
            
            // Show the file view panel
            if (fileViewPanel && resultsPanel) {
                fileViewPanel.classList.add('active');
                resultsPanel.style.width = '50%';
                fileViewPanel.style.width = '50%';
            }
            
            // Display content with line numbers and highlighting
            const contentDiv = document.getElementById('file-content');
            const lines = fileContent.split('\n');
            const formattedContent = lines.map((line, index) => {
                const lineNum = index + 1;
                const highlightClass = lineNum === lineNumber ? 'line-highlight' : '';
                return `<span class="line ${highlightClass}" data-line="${lineNum}">${line}</span>`;
            }).join('\n');
            
            if (contentDiv) {
                contentDiv.innerHTML = formattedContent;
            } else {
                throw new Error('File content container not found');
            }
            
            // Scroll to the highlighted line
            const highlightedLine = contentDiv.querySelector('.line-highlight');
            if (highlightedLine) {
                highlightedLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } catch (error) {
            console.error('Error fetching file content:', error);
            showAlert('Error loading file content', 'error');
        }
    }


    // Add button handlers for file view panel
    document.querySelector('.close-file-view')?.addEventListener('click', () => {
        const fileViewPanel = document.getElementById('file-view-panel');
        const resultsPanel = document.getElementById('results-panel');
        fileViewPanel.classList.remove('active');
        // Reset panel widths when closing
        resultsPanel.style.width = '100%';
        fileViewPanel.style.width = '0%';
    });

    // Zoom functionality
    let currentZoom = 14; // Base font size
    const minZoom = 8;
    const maxZoom = 24;
    
    document.getElementById('zoom-in')?.addEventListener('click', () => {
        if (currentZoom < maxZoom) {
            currentZoom += 2;
            document.getElementById('file-content').style.fontSize = `${currentZoom}px`;
        }
    });
    
    document.getElementById('zoom-out')?.addEventListener('click', () => {
        if (currentZoom > minZoom) {
            currentZoom -= 2;
            document.getElementById('file-content').style.fontSize = `${currentZoom}px`;
        }
    });

    document.getElementById('zoom-reset')?.addEventListener('click', () => {
        currentZoom = 14; // Reset to base font size
        document.getElementById('file-content').style.fontSize = `${currentZoom}px`;
    });

    document.getElementById('toggle-wrap')?.addEventListener('click', (e) => {
        const button = e.currentTarget;
        const content = document.getElementById('file-content');
        const isWrapped = content.style.whiteSpace === 'pre-wrap';
        content.style.whiteSpace = isWrapped ? 'pre' : 'pre-wrap';
        button.classList.toggle('active');
    });

    document.getElementById('return-to-line')?.addEventListener('click', () => {
        const highlightedLine = document.querySelector('.line-highlight');
        if (highlightedLine) {
            highlightedLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });


    document.getElementById('export-csv')?.addEventListener('click', async () => {
        const activeTab = document.querySelector('.tab-btn.active');
        const fileItem = document.querySelector('.file-item.selected');
        if (!activeTab || !fileItem) return;

        const section = activeTab.dataset.section;
        const dir = fileItem.dataset.dir;
        
        try {
            window.location.href = `/download_csv/${section}/${dir}`;
        } catch (error) {
            showAlert('Error exporting CSV', 'error');
        }
    });

    // Add tab click handlers
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const searchInput = document.getElementById('section-search');
            displaySectionData(e.target.dataset.section, searchInput.value);
        });
    });

    // Add search handler
    const searchInput = document.getElementById('section-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab) {
                displaySectionData(activeTab.dataset.section, e.target.value);
            }
        });
    }

    // File upload handling
    function initializeFileUpload() {
        if (uploadContainer) {
            uploadContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadContainer.style.borderColor = '#34A853';
            });

            uploadContainer.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadContainer.style.borderColor = '#1A73E8';
            });

            uploadContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadContainer.style.borderColor = '#1A73E8';
                const files = e.dataTransfer.files;
                if (files.length) {
                    fileInput.files = files;
                    handleFileUpload(files[0]);
                }
            });
        }

        // Handler for both initial upload button and "Upload New" button
        function setupFileUploadTrigger(button) {
            if (button) {
                button.addEventListener('click', () => {
                    fileInput.value = ''; // Clear previous selection
                    fileInput.click();
                });
            }
        }

        // Set up both upload triggers
        setupFileUploadTrigger(uploadButton);
        setupFileUploadTrigger(document.querySelector('.upload-new-btn'));

        // Single change handler for file input
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFileUpload(files[0]);
                // Remove the once option to allow multiple uploads
            }
        });
    }

    // Initialize file upload handling
    initializeFileUpload();

    async function handleFileUpload(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Show loading state
        const activeButton = uploadButton || document.querySelector('.upload-new-btn');
        if (activeButton) {
            activeButton.disabled = true;
            activeButton.textContent = 'Uploading...';
        }
        showAlert('Processing file...', 'warning');

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            if (response.ok) {
                showAlert('File uploaded and parsed successfully!', 'success');
                updateResults(data.data);
                // Store both filename and directory for selection after reload
                const fileToSelect = {
                    name: file.name,
                    dir: data.dir
                };
                localStorage.setItem('selectFileAfterReload', JSON.stringify(fileToSelect));
                // Force a clean reload to update file list
                window.location.reload(true);
            } else {
                showAlert(data.error || 'Upload failed', 'error');
            }
        } catch (error) {
            showAlert('Error uploading file', 'error');
            console.error('Upload error:', error);
        } finally {
            // Reset the active button
            const activeButton = uploadButton || document.querySelector('.upload-new-btn');
            if (activeButton) {
                activeButton.disabled = false;
                activeButton.textContent = activeButton === uploadButton ? 'Upload File' : 'Upload New';
            }
        }
    }


    // Function to update file list UI
    function updateFileList(files) {
        const filesContainer = document.querySelector('.files-container');
        const uploadContainer = document.querySelector('.upload-container');
        
        if (files.length === 0) {
            // Show upload container if no files
            if (filesContainer) filesContainer.remove();
            if (!uploadContainer) {
                location.reload(); // Reload to show upload container
            }
        } else {
            // Update files list
            const filesList = document.createElement('div');
            filesList.className = 'files-list';
            
            files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <span class="material-icons">description</span>
                    <div class="file-details">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${file.size_formatted}</span>
                    </div>
                    <button class="btn btn-secondary delete-file" data-filename="${file.name}">
                        <span class="material-icons">delete</span>
                    </button>
                `;
                filesList.appendChild(fileItem);
            });
            
            if (filesContainer) {
                // Update existing files container
                const existingFilesList = filesContainer.querySelector('.files-list');
                existingFilesList.replaceWith(filesList);
            } else {
                // Create new files container
                location.reload(); // Reload to show files container
            }
        }
        
        // Reattach delete handlers
        attachDeleteHandlers();
    }
    


    // Delete single file functionality
    function attachDeleteHandlers() {
        document.querySelectorAll('.delete-file').forEach(button => {
            button.addEventListener('click', async (e) => {
                const dir = e.currentTarget.dataset.dir;
                const confirmResult = confirm('Are you sure you want to delete this file? This action cannot be undone.');
                
                if (confirmResult) {
                    try {
                        const response = await fetch('/delete', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ dir: dir })
                        });
                        const data = await response.json();
                        
                        if (response.ok) {
                            showAlert('File deleted successfully', 'success');
                            // Reload the page to update the file list
                            window.location.reload();
                        } else {
                            showAlert(data.error || 'Delete failed', 'error');
                        }
                    } catch (error) {
                        showAlert('Error deleting file', 'error');
                        console.error('Delete error:', error);
                    }
                }
            });
        });
    }

    // File selection functionality
    function attachFileSelectionHandlers() {
        document.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                // Don't trigger selection if clicking the delete button
                if (e.target.closest('.delete-file')) {
                    return;
                }
                
                // Remove selection from all items
                document.querySelectorAll('.file-item').forEach(i => {
                    i.classList.remove('selected');
                });
                
                // Add selection to clicked item
                item.classList.add('selected');
                
                // Get the directory name and trigger data load
                const dir = item.dataset.dir;
                loadFileData(dir);
                
                try {
                    const response = await fetch('/get_file_data', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ dir: dir })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        updateResults(data.data);
                    } else {
                        showAlert(data.error || 'Failed to load file data', 'error');
                    }
                } catch (error) {
                    showAlert('Error loading file data', 'error');
                    console.error('Load error:', error);
                }
            });
        });
    }

    // Function to load file data
    async function loadFileData(dir) {
        try {
            const response = await fetch('/get_file_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ dir: dir })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                updateResults(data.data);
            } else {
                showAlert(data.error || 'Failed to load file data', 'error');
            }
        } catch (error) {
            showAlert('Error loading file data', 'error');
            console.error('Load error:', error);
        }
    }

    // Attach handlers on page load
    attachDeleteHandlers();
    attachFileSelectionHandlers();
    selectMostRecentFile();

    // Function to select and load file data
    function selectAndLoadFile(fileName) {
        const fileItems = document.querySelectorAll('.file-item');
        let fileFound = false;
        
        fileItems.forEach(item => {
            const itemFileName = item.querySelector('.file-name').textContent;
            if (itemFileName === fileName) {
                item.classList.add('selected');
                const dir = item.dataset.dir;
                if (dir) {
                    loadFileData(dir);
                    fileFound = true;
                }
            } else {
                item.classList.remove('selected');
            }
        });
        
        return fileFound;
    }

    // Function to select and load a file by name
    function selectAndLoadFileByName(fileName) {
        const fileItems = document.querySelectorAll('.file-item');
        let fileFound = false;
        
        fileItems.forEach(item => {
            const itemFileName = item.querySelector('.file-name').textContent;
            if (itemFileName === fileName) {
                item.classList.add('selected');
                const dir = item.dataset.dir;
                if (dir) {
                    loadFileData(dir);
                    fileFound = true;
                }
            } else {
                item.classList.remove('selected');
            }
        });
        
        return fileFound;
    }

    // Function to select the most recently uploaded file
    function selectMostRecentFile() {
        const storedFileData = localStorage.getItem('selectFileAfterReload');
        if (storedFileData) {
            try {
                const fileData = JSON.parse(storedFileData);
                const fileItems = document.querySelectorAll('.file-item');
                let fileFound = false;
                
                // Remove selection from all items first
                fileItems.forEach(item => item.classList.remove('selected'));

                // First try to find the exact stored file with directory match
                fileItems.forEach(item => {
                    const fileName = item.querySelector('.file-name').textContent;
                    const dir = item.dataset.dir;
                    if (fileName === fileData.name && dir === fileData.dir) {
                        item.classList.add('selected');
                        loadFileData(dir);
                        fileFound = true;
                    }
                });

                // If not found, select the most recently uploaded file (last in list)
                if (!fileFound && fileItems.length > 0) {
                    const lastFile = fileItems[fileItems.length - 1];
                    lastFile.classList.add('selected');
                    const dir = lastFile.dataset.dir;
                    if (dir) {
                        loadFileData(dir);
                    }
                }
                
                localStorage.removeItem('selectFileAfterReload');
            } catch (e) {
                console.error('Error selecting recent file:', e);
            }
        } else if (document.querySelectorAll('.file-item').length === 1) {
            // If there's only one file, select it automatically
            const fileItem = document.querySelector('.file-item');
            if (fileItem) {
                fileItem.classList.add('selected');
                const dir = fileItem.dataset.dir;
                if (dir) {
                    loadFileData(dir);
                }
            }
        }
    }
    
    // Reset all files functionality
    const resetButton = document.querySelector('.reset-btn');
    if (resetButton) {
        resetButton.addEventListener('click', async () => {
            const confirmResult = confirm('Warning: This will permanently delete all uploaded files and their parsed data. Are you sure you want to continue?');
            
            if (confirmResult) {
                try {
                    const response = await fetch('/reset', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({})
                    });
                    const data = await response.json();
                    
                    if (response.ok) {
                        showAlert('All files have been reset successfully', 'success');
                        
                        // Update the UI with the new file list
                        updateFileList(data.files);
                        
                        // Reset the file input and table
                        fileInput.value = '';
                        resultsTable.innerHTML = '';
                        
                        // Reload the page to show the upload container
                        window.location.reload();
                    } else {
                        showAlert(data.error || 'Reset failed', 'error');
                    }
                } catch (error) {
                    showAlert('Error resetting files', 'error');
                    console.error('Reset error:', error);
                }
            }
        });
    }
});
