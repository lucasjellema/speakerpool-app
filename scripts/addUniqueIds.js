const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Paths
const inputFile = path.join(__dirname, '..', 'data', 'Sprekerpool.json');
const outputFile = path.join(__dirname, '..', 'data', 'Sprekerpool.json');

// Function to generate a unique ID of 15 characters
function generateUniqueId() {
  // Generate a random buffer and convert to hex string
  return crypto.randomBytes(8).toString('hex').substring(0, 15);
}

// Main function to add unique IDs to speaker records
async function addUniqueIds() {
  try {
    // Read the existing JSON file
    console.log(`Reading speaker data from ${inputFile}...`);
    const jsonData = fs.readFileSync(inputFile, 'utf8');
    const speakers = JSON.parse(jsonData);
    
    console.log(`Found ${speakers.length} speaker records.`);
    
    // Set to track IDs to ensure uniqueness
    const usedIds = new Set();
    
    // Add unique ID to each speaker record
    speakers.forEach(speaker => {
      // Skip if speaker already has an ID
      if (speaker.uniqueId && speaker.uniqueId.length === 15) {
        console.log(`Speaker ${speaker.name} already has ID: ${speaker.uniqueId}`);
        usedIds.add(speaker.uniqueId);
        return;
      }
      
      // Generate a unique ID that doesn't conflict with existing ones
      let uniqueId;
      do {
        uniqueId = generateUniqueId();
      } while (usedIds.has(uniqueId));
      
      // Add the ID to the set of used IDs
      usedIds.add(uniqueId);
      
      // Add the unique ID to the speaker record
      speaker.uniqueId = uniqueId;
      console.log(`Added ID ${uniqueId} to speaker: ${speaker.name}`);
    });
    
    // Write the updated data back to the file
    console.log(`Writing updated data to ${outputFile}...`);
    fs.writeFileSync(outputFile, JSON.stringify(speakers, null, 2), 'utf8');
    
    console.log('Successfully added unique IDs to all speaker records!');
  } catch (error) {
    console.error('Error processing speaker data:', error);
  }
}

// Run the function
addUniqueIds();
