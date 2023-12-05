#!/bin/bash

# Define the directory to search in and the output file
SEARCH_DIR="." # Replace with your directory path if different
OUTPUT_FILE="spacedrive-core-knowledge.txt"

# Empty the output file in case it already exists
> "$OUTPUT_FILE"

# Function to append file content with a header
append_with_header() {
    echo "File: $1" >> "$OUTPUT_FILE"
    echo "-------------------------------------------------" >> "$OUTPUT_FILE"
    cat "$1" >> "$OUTPUT_FILE"
    echo -e "\n\n" >> "$OUTPUT_FILE"
}

# Export the function to be available in subshells
export -f append_with_header
export OUTPUT_FILE

# Find files of the specified types and append their contents to the output file
find "$SEARCH_DIR" \( -name '*.mdx' -o -name '*.rs' -o -name '*.prisma' -o -name '*.ts' -o -name '*.tsx' -o -name '*.toml' -o -name '*.json' \) -exec bash -c 'append_with_header "$0"' {} \;

echo "Merged file contents into $OUTPUT_FILE"
