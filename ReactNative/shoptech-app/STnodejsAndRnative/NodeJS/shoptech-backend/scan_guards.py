import os
import re

def scan_controllers(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.controller.ts'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Regex to match a method block and capture all its decorators
                methods = re.finditer(r'((?:@\w+(?:\(.*?\))?\s*)+)(?:async\s+)?([a-zA-Z0-9_]+)\(', content)
                
                # Check class level guards
                class_has_guard = bool(re.search(r'@UseGuards.*?\nexport class', content, re.DOTALL))
                
                missing = []
                for match in methods:
                    decorators = match.group(1)
                    method_name = match.group(2)
                    
                    if ('@Post' in decorators or '@Patch' in decorators or '@Delete' in decorators or '@Put' in decorators):
                        if '@UseGuards' not in decorators and not class_has_guard:
                            missing.append((decorators.strip().split('\n')[-1], method_name))
                
                if missing:
                    print(f"\n--- {file} ---".encode('utf-8', 'ignore').decode('cp1258', 'ignore'))
                    for t, name in missing:
                        safe_t = t.encode('utf-8', 'ignore').decode('cp1258', 'ignore')
                        safe_name = name.encode('utf-8', 'ignore').decode('cp1258', 'ignore')
                        print(f"Missing guard on {safe_t}: {safe_name}")

if __name__ == "__main__":
    scan_controllers('./src')
