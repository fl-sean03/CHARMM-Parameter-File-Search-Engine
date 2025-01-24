import os
from flask import Flask, request, jsonify, render_template, send_file
from werkzeug.utils import secure_filename
from backend.core import CharmmProcessor

app = Flask(__name__, 
            template_folder='frontend/templates',
            static_folder='frontend/static')
app.config['UPLOAD_FOLDER'] = 'uploads'
processor = CharmmProcessor()

# Ensure upload directory exists and is accessible
try:
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
except Exception as e:
    print(f"Error creating uploads directory: {e}")
    raise

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        original_filename = secure_filename(file.filename)
        base_name, extension = os.path.splitext(original_filename)
        
        # Create unique filename and directory name
        counter = 1
        filename = original_filename
        output_dir = os.path.join(app.config['UPLOAD_FOLDER'], base_name)
        
        while os.path.exists(output_dir):
            filename = f"{base_name}_{counter}{extension}"
            output_dir = os.path.join(app.config['UPLOAD_FOLDER'], f"{base_name}_{counter}")
            counter += 1
            
        os.makedirs(output_dir, exist_ok=True)
        
        # Save file with potentially modified name
        filepath = os.path.join(output_dir, filename)
        file.save(filepath)
        
        # Process the file with output directory
        data = processor.process_file(filepath, output_dir)
        
        return jsonify({
            'message': 'File processed successfully',
            'data': {k: v.fillna('').to_dict('records') for k, v in data.items()}
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/search', methods=['POST'])
def search():
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({'error': 'No search query provided'}), 400

    try:
        results = processor.search(data['query'], data.get('section'))
        return jsonify({
            'results': {k: v.to_dict('records') for k, v in results.items()}
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/delete', methods=['POST'])
def delete_file():
    try:
        data = request.get_json()
        if not data or 'dir' not in data:
            return jsonify({'error': 'No directory specified'}), 400
            
        dir_path = os.path.join(app.config['UPLOAD_FOLDER'], data['dir'])
        
        if not os.path.exists(dir_path):
            return jsonify({'error': 'Directory not found'}), 404
            
        import shutil
        shutil.rmtree(dir_path)
        
        return jsonify({
            'message': 'File deleted successfully',
            'files': get_file_list()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/reset', methods=['POST'])
def reset():
    try:
        # Delete all directories in uploads directory
        for dirname in os.listdir(app.config['UPLOAD_FOLDER']):
            dirpath = os.path.join(app.config['UPLOAD_FOLDER'], dirname)
            if os.path.isdir(dirpath):
                import shutil
                shutil.rmtree(dirpath)
        
        # Return updated file list
        return jsonify({
            'message': 'Reset successful',
            'files': get_file_list()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def get_file_list():
    """Helper function to get list of uploaded files"""
    uploaded_files = []
    for dirname in os.listdir(app.config['UPLOAD_FOLDER']):
        dirpath = os.path.join(app.config['UPLOAD_FOLDER'], dirname)
        if os.path.isdir(dirpath):
            # Look for the original parameter file in the directory
            for filename in os.listdir(dirpath):
                if filename.endswith(('.txt', '.par')):
                    filepath = os.path.join(dirpath, filename)
                    size = os.path.getsize(filepath)
                    uploaded_files.append({
                        'name': filename,
                        'dir': dirname,
                        'size': size,
                        'size_formatted': f"{size/1024:.1f} KB"
                    })
                    break  # Only get the first parameter file
    return uploaded_files

@app.route('/')
def index():
    return render_template('index.html', uploaded_files=get_file_list())

@app.route('/download_csv/<section>/<dir>', methods=['GET'])
def download_csv(section, dir):
    try:
        dir_path = os.path.join(app.config['UPLOAD_FOLDER'], dir)
        csv_path = os.path.join(dir_path, f'{section}.csv')
        
        if not os.path.exists(csv_path):
            return jsonify({'error': 'CSV file not found'}), 404
            
        # Get original parameter filename for naming the download
        param_file = None
        for filename in os.listdir(dir_path):
            if filename.endswith(('.txt', '.par')):
                param_file = os.path.splitext(filename)[0]
                break
                
        download_name = f"{param_file}_{section}.csv"
        
        return send_file(
            csv_path,
            mimetype='text/csv',
            as_attachment=True,
            download_name=download_name
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_file_data', methods=['POST'])
def get_file_data():
    try:
        data = request.get_json()
        if not data or 'dir' not in data:
            return jsonify({'error': 'No directory specified'}), 400
            
        dir_path = os.path.join(app.config['UPLOAD_FOLDER'], data['dir'])
        
        if not os.path.exists(dir_path):
            return jsonify({'error': 'Directory not found'}), 404
            
        # Find parameter file in directory
        param_file = None
        for filename in os.listdir(dir_path):
            if filename.endswith(('.txt', '.par')):
                param_file = os.path.join(dir_path, filename)
                break
                
        if not param_file:
            return jsonify({'error': 'Parameter file not found'}), 404
            
        # Process file and return data
        data = processor.process_file(param_file, dir_path)
        return jsonify({
            'message': 'File loaded successfully',
            'data': {k: v.fillna('').to_dict('records') for k, v in data.items()}
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
