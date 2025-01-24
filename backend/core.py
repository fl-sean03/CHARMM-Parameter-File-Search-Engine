from typing import Dict, List, Optional
import os
import pandas as pd
from .parsers import parse_charmm_parameter_file

class CharmmProcessor:
    def __init__(self):
        self.current_data: Dict[str, pd.DataFrame] = {}
        self.filepath: Optional[str] = None

    def process_file(self, filepath: str, output_dir: str) -> Dict[str, pd.DataFrame]:
        """Process a CHARMM parameter file and store results"""
        self.filepath = filepath
        self.current_data = parse_charmm_parameter_file(filepath)
        
        # Save each section to a CSV file in the output directory
        for section_name, df in self.current_data.items():
            if not df.empty:
                output_path = os.path.join(output_dir, f'{section_name}.csv')
                df.to_csv(output_path, index=False)
        
        return self.current_data

    def search(self, query: str, section: str = None) -> Dict[str, pd.DataFrame]:
        """Search through parsed data based on query and section"""
        if not self.current_data:
            return {}

        results = {}
        sections_to_search = [section] if section and section != 'all' else self.current_data.keys()

        for sect in sections_to_search:
            if sect not in self.current_data:
                continue

            df = self.current_data[sect]
            
            # Search through all columns
            mask = pd.Series(False, index=df.index)
            for column in df.columns:
                # Convert column to string for searching
                str_col = df[column].astype(str)
                mask |= str_col.str.contains(query, case=False, na=False)
            
            if mask.any():
                results[sect] = df[mask]

        return results

    def get_section(self, section: str) -> Optional[pd.DataFrame]:
        """Get a specific section of parsed data"""
        return self.current_data.get(section)

    def get_all_data(self) -> Dict[str, pd.DataFrame]:
        """Get all parsed data"""
        return self.current_data
