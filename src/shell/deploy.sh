#!/bin/bash
# version: 1.0.1

# --- ShellCheck issues ---

# SC2086: Double quote to prevent globbing and word splitting
DEPLOY_DIR=/var/www/app
echo "Deploying to $DEPLOY_DIR"
cp -r build/* $DEPLOY_DIR

# SC2006: Use $(...) instead of backticks
CURRENT_DATE=`date +%Y-%m-%d`
echo "Deploy date: $CURRENT_DATE"

# SC2046: Quote to prevent word splitting
docker stop $(docker ps -q)

# SC2034: Unused variable
UNUSED_VAR="this is never used"

# SC2035: Use ./*glob* or -- glob to avoid problems with filenames starting with -
ls *.log

# SC2045: Iterating over ls output is fragile
for file in $(ls /tmp/*.txt); do
    echo "Processing $file"
done

# SC2162: read without -r will mangle backslashes
echo "Enter name:"
read NAME
echo "Hello, $NAME"

# SC2069: Wrong redirect order
command_that_might_fail 2>&1 >/dev/null

# SC2164: Use 'cd ... || exit' in case cd fails
cd /some/directory
rm -rf data/

# SC2068: Double quote array expansions
FILES=(file1.txt file2.txt file3.txt)
for f in ${FILES[@]}; do
    cat $f
done

# Password in script
DB_PASSWORD="deploy_secret_123"
mysql -u root -p$DB_PASSWORD -e "SELECT 1"

# SC2091: Remove surrounding $() to avoid executing output
$(echo "this gets executed")

echo "Deploy complete!"
