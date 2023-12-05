#!/bin/bash

# Define the directory to search in and the output file
SEARCH_DIR="." # Replace with your directory path if different
OUTPUT_FILE="spacedrive-knowledge.txt"

# Find all MDX files and merge their contents into one text file
find "$SEARCH_DIR" -name '*.mdx' -exec cat {} + > "$OUTPUT_FILE"

echo "Merged MDX contents into $OUTPUT_FILE"
