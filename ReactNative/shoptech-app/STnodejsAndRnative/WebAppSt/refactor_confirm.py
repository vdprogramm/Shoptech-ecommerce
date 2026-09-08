import os
import re

directory = './src/routes'

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            if 'window.confirm' in content or 'confirm(' in content:
                # 1. Replace window.confirm( with await confirm(
                # and confirm( with await confirm( (but watch out for useConfirm())
                content = re.sub(r'window\.confirm\(', r'await confirm(', content)
                # carefully replace confirm( only if not already await confirm or useConfirm
                content = re.sub(r'(?<!await )(?<!use)confirm\(', r'await confirm(', content)
                
                # 2. Add import at the top
                if 'useConfirm' not in content:
                    content = "import { useConfirm } from '@/hooks/use-confirm';\n" + content
                
                # 3. Add const { confirm } = useConfirm(); inside the main component
                # We can assume the component is the one that has `return (` or is the default export
                # Or simply we inject it after the first `useState` or `useNavigate`
                
                # Let's try to inject after `useNavigate` if it exists
                if 'useNavigate()' in content and 'const { confirm }' not in content:
                    content = re.sub(r'(const \w+ = useNavigate\(\);)', r'\1\n  const { confirm } = useConfirm();', content)
                # Or inject after `function .*?() {` if it's a function component
                elif 'const { confirm }' not in content:
                    # Find the first function that contains `await confirm(`
                    # This is a bit risky. Let's just inject after the first `{` of the main component.
                    # We look for `export default function` or `function .*?Component`
                    match = re.search(r'(export default function.*?{|function [A-Z].*?{)', content)
                    if match:
                        content = content[:match.end()] + "\n  const { confirm } = useConfirm();" + content[match.end():]
                    else:
                        match2 = re.search(r'(const [A-Z]\w+\s*=\s*\([^)]*\)\s*=>\s*{)', content)
                        if match2:
                            content = content[:match2.end()] + "\n  const { confirm } = useConfirm();" + content[match2.end():]

                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Refactored {filepath}")
