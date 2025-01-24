document.addEventListener('DOMContentLoaded', function() {
    const uploadContainer = document.querySelector('.upload-container');
    const fileInput = document.getElementById('file-upload');
    const uploadButton = uploadContainer ? uploadContainer.querySelector('.btn-primary') : null;
    const resultsTable = document.querySelector('.data-table tbody');

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

    function displaySectionData(sectionName) {
        const table = document.getElementById('results-table');
        const data = currentData[sectionName];
        
        if (!data || !data.length) {
            table.innerHTML = '<tr><td colspan="4">No data available for this section</td></tr>';
            return;
        }

        // Get columns from the first data entry
        const columns = Object.keys(data[0])
            .filter(col => col !== 'Line Number' && col !== 'Comments');
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Add columns
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.replace(/([A-Z])/g, ' $1').trim(); // Add spaces before capital letters
            headerRow.appendChild(th);
        });
        
        // Add Comments column at the end
        const commentsHeader = document.createElement('th');
        commentsHeader.textContent = 'Comments';
        headerRow.appendChild(commentsHeader);
        
        thead.appendChild(headerRow);

        // Create body
        const tbody = document.createElement('tbody');
        data.forEach(entry => {
            const row = document.createElement('tr');
            
            // Add regular columns
            columns.forEach(col => {
                const td = document.createElement('td');
                let value = entry[col];
                
                // Format numbers to 3 decimal places if they're numbers
                if (typeof value === 'number') {
                    value = value.toFixed(3);
                }
                
                td.textContent = value || '';
                row.appendChild(td);
            });
            
            // Add Comments column at the end
            const commentsTd = document.createElement('td');
            const comments = Array.isArray(entry.Comments) ? entry.Comments.join('; ') : entry.Comments || '';
            commentsTd.textContent = comments;
            row.appendChild(commentsTd);
            
            tbody.appendChild(row);
        });

        // Update table
        table.innerHTML = '';
        table.appendChild(thead);
        table.appendChild(tbody);
    }

    // Add tab click handlers
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            displaySectionData(e.target.dataset.section);
        });
    });

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
            }
        }, { once: true }); // Ensure the handler only runs once
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
                // Store the filename and reload
                const fileToSelect = file.name;
                localStorage.setItem('selectFileAfterReload', fileToSelect);
                window.location.reload();
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

    // Check if we need to select and load a file after reload
    const fileToSelect = localStorage.getItem('selectFileAfterReload');
    if (fileToSelect) {
        if (selectAndLoadFile(fileToSelect)) {
            localStorage.removeItem('selectFileAfterReload');
        }
    } else if (document.querySelectorAll('.file-item').length === 1) {
        // If there's only one file, select it automatically
        const fileItem = document.querySelector('.file-item');
        if (fileItem) {
            const fileName = fileItem.querySelector('.file-name').textContent;
            selectAndLoadFile(fileName);
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
