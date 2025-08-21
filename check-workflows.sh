#!/bin/bash

# Script de validation des workflows GitHub Actions

echo "🔍 Checking GitHub Actions workflows..."

success_count=0
error_count=0

for workflow in .github/workflows/*.yml; do
    if [ -f "$workflow" ]; then
        echo "Checking $workflow..."
        
        # Basic syntax check with Python
        if python3 -c "import yaml; yaml.safe_load(open('$workflow'))" 2>/dev/null; then
            echo "✅ $workflow - YAML syntax valid"
            ((success_count++))
        else
            echo "❌ $workflow - YAML syntax error"
            ((error_count++))
            
            # Fallback: check with basic file operations
            if grep -q "run: |" "$workflow" && grep -q "python3 -c" "$workflow"; then
                echo "⚠️  Warning: Found multiline Python in YAML - this often causes issues"
            fi
        fi
    fi
done

echo ""
echo "📊 Results:"
echo "✅ Valid files: $success_count"
echo "❌ Error files: $error_count"

if [ $error_count -eq 0 ]; then
    echo "🎉 All workflows are valid!"
    exit 0
else
    echo "🚨 Some workflows have errors - fix before pushing"
    exit 1
fi