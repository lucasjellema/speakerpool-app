/**
 * Speaker CSV Generator
 * 
 * This script extracts data from the Sprekerpool.json file and creates a CSV file
 * with entries for every speaker, containing their first name, email address, and unique ID.
 * 
 * Purpose:
 * - Generate a clean, structured CSV file for use in other systems
 * - Extract only the essential contact information from the full speaker records
 * - Handle special cases like multiple email addresses and complex name formats
 * 
 * The script performs the following operations:
 * 1. Reads the Sprekerpool.json file from the data directory
 * 2. Extracts the first name from each speaker's full name
 *    - For names with semicolons (like "Name1; Name2"), it takes only the first part
 *    - For regular names, it extracts the first word as the first name
 * 3. Extracts the primary email address
 *    - If multiple emails are provided (separated by semicolons), it takes the first one
 * 4. Gets the unique ID for each speaker
 * 5. Creates a properly formatted CSV file with these three fields
 * 
 * Output: data/speakers.csv with columns: firstName, emailAddress, uniqueId
 * 
 * Usage: node scripts/createSpeakersCsv.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const inputFile = path.join(__dirname, '..', 'data', 'Sprekerpool.json');
const outputFile = path.join(__dirname, '..', 'data', 'speakers.csv');

// Function to extract first name from full name
function extractFirstName(fullName) {
    // Handle special cases where the name contains semicolons or other separators
    if (fullName.includes(';')) {
        // Take the first part before the semicolon
        return fullName.split(';')[0].trim().split(' ')[0];
    }
    
    // Regular case: split by spaces and take the first part
    return fullName.split(' ')[0];
}

// Function to extract email addresses
function extractEmail(emailField) {
    // If the email field contains multiple emails (separated by semicolons)
    if (emailField && emailField.includes(';')) {
        // Return the first email address
        return emailField.split(';')[0].trim();
    }
    
    // Return the email as is
    return emailField || '';
}

// Main function to create the CSV file
async function createSpeakersCsv() {
    try {
        // Read the JSON file
        console.log(`Reading speaker data from ${inputFile}...`);
        const jsonData = fs.readFileSync(inputFile, 'utf8');
        const speakers = JSON.parse(jsonData);
        
        console.log(`Found ${speakers.length} speaker records.`);
        
        // Create CSV header
        let csvContent = 'firstName,emailAddress,uniqueId\n';
        
        // Process each speaker
        speakers.forEach(speaker => {
            const firstName = extractFirstName(speaker.name || '');
            const email = extractEmail(speaker.emailadress);
            const uniqueId = speaker.uniqueId || '';
            
            // Add to CSV content, properly escaping fields
            csvContent += `"${firstName}","${email}","${uniqueId}"\n`;
            
            console.log(`Processed speaker: ${firstName}, ${email}, ${uniqueId}`);
        });
        
        // Write the CSV file
        console.log(`Writing CSV data to ${outputFile}...`);
        fs.writeFileSync(outputFile, csvContent, 'utf8');
        
        console.log('Successfully created CSV file with speaker data!');
    } catch (error) {
        console.error('Error processing speaker data:', error);
    }
}

// Run the function
createSpeakersCsv();
