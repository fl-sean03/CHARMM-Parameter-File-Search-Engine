<<<<<<< HEAD
# CHARMM-Parameter-File-Search-Engine
=======
# CHARMM Parameter File Search Engine

A web-based application for parsing, viewing, and analyzing CHARMM parameter files with an intuitive user interface.

## Features

- Upload and parse CHARMM parameter files
- Interactive web interface for viewing parsed data
- Section-based data organization (ATOMS, BONDS, ANGLES, DIHEDRALS, IMPROPER)
- Download data sections as CSV files
- File management system with upload/delete capabilities
- Dynamic data loading and display
- Responsive design with modern UI elements
- Drag-and-drop file upload support
- Real-time data parsing and display
- Multi-file management system

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Git (for version control)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/charmm-parameter-search.git
cd charmm-parameter-search
```

2. Create and activate a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install required dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Start the Flask application:
```bash
python app.py
```

2. Open your web browser and navigate to:
```
http://localhost:5000
```

3. Upload a CHARMM parameter file:
   - Drag and drop files into the upload area
   - Click to browse and select files
   - Supported formats: .txt, .par

4. View and analyze data:
   - Switch between different sections using tabs
   - Download specific sections as CSV files
   - Delete or reset files as needed

## Project Structure

```
charmm-parameter-search/
├── app.py                 # Flask application main file
├── backend/
│   ├── core.py           # Core processing logic
│   ├── parsers.py        # File parsing functionality
│   ├── utils.py          # Utility functions
│   └── tests/            # Test files
├── frontend/
│   ├── static/
│   │   ├── css/         # Stylesheets
│   │   └── js/          # JavaScript files
│   └── templates/        # HTML templates
├── uploads/              # Directory for uploaded files
├── requirements.txt      # Project dependencies
├── LICENSE              # License information
└── README.md            # Project documentation
```

## API Endpoints

### Main Endpoints
- `GET /`: Main application interface
- `POST /upload`: Upload parameter files
- `POST /delete`: Delete uploaded files
- `POST /reset`: Reset all uploaded files
- `POST /get_file_data`: Get parsed data for a specific file
- `GET /download_csv/<section>/<dir>`: Download section data as CSV

### Response Formats
All API endpoints return JSON responses with the following structure:
```json
{
    "message": "Success/Error message",
    "data": {
        "section_name": [...],
        ...
    }
}
```

## Development

### Setting Up Development Environment

1. Install development dependencies:
```bash
pip install -r requirements-dev.txt
```

2. Run in development mode:
```bash
export FLASK_ENV=development
export FLASK_APP=app.py
flask run
```

### Code Style
- Follow PEP 8 guidelines
- Use type hints for function parameters
- Document functions using docstrings
- Keep functions focused and single-purpose

## Testing

### Running Tests
```bash
python -m pytest backend/tests/
```

### Test Coverage
```bash
python -m pytest --cov=backend tests/
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Pull Request Guidelines
- Include a clear description of changes
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass
- Follow the existing code style

## Troubleshooting

### Common Issues
1. **Upload Errors**
   - Ensure file format is supported (.txt, .par)
   - Check file size limits
   - Verify file permissions

2. **Parser Errors**
   - Validate CHARMM parameter file format
   - Check for file encoding issues
   - Ensure complete section headers

3. **Server Issues**
   - Verify Python version compatibility
   - Check all dependencies are installed
   - Ensure proper file permissions in uploads directory

## Security

- Input validation for all file uploads
- Secure file handling and storage
- Protection against common web vulnerabilities
- Regular security updates and patches

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- CHARMM Parameter File Format Documentation
- Flask Web Framework
- Pandas for Data Processing
- Material Icons for UI elements
- Open Source Community

## Version History

- v1.0.0 (2024-01-23)
  - Initial release
  - Basic file parsing functionality
  - Web interface implementation
  - CSV export capability

## Contact

Project Link: https://github.com/yourusername/charmm-parameter-search

## Citation

If you use this software in your research, please cite:

```bibtex
@software{charmm_parameter_search,
  author = {Your Name},
  title = {CHARMM Parameter File Search Engine},
  year = {2024},
  url = {https://github.com/yourusername/charmm-parameter-search}
}
```
>>>>>>> 24fe610 (Loaded in the repo files)
