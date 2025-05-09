const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Paths
const inputFile = path.join(__dirname, '..', 'data', 'Sprekerpool-excel-data.csv');
const outputFile = path.join(__dirname, '..', 'data', 'Sprekerpool.json');

// Function to parse boolean values from CSV
function parseBoolean(value) {
  if (!value) return false;
  const strValue = String(value).trim().toLowerCase();
  return strValue === 'true' || strValue === 'yes' || strValue === '1' || 
         strValue === 'ja' || strValue === 'waar' || strValue.includes('intern') || 
         strValue.includes('extern');
}

// Function to parse languages from a string (e.g., 'Engels;Nederlands')
function parseLanguages(languageStr) {
  if (!languageStr) return {};
  
  const languages = {};
  const langArray = String(languageStr).split(/[;,]/);
  
  langArray.forEach(lang => {
    const trimmedLang = lang.trim();
    if (trimmedLang) {
      languages[trimmedLang] = true;
    }
  });
  
  return languages;
}

// Function to parse internal/external flags
function parseInternalExternal(value) {
  if (!value) return false;
  
  const strValue = String(value).toLowerCase();
  return strValue.includes('intern') || strValue.includes('extern') || 
         strValue === 'true' || strValue === 'yes' || strValue === '1' || 
         strValue === 'ja' || strValue === 'waar';
}

try {
  // Read the CSV file with encoding support
  const fileContent = fs.readFileSync(inputFile, { encoding: 'utf8' });
  
  // Parse the CSV data
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    relax_quotes: true,
    bom: true
  });
  
  console.log(`Found ${records.length} records in the CSV file`);
  
  // Debug: Log the first record to see its structure
  if (records.length > 0) {
    console.log('First record keys:', Object.keys(records[0]));
  }
  
  // Map CSV data to the desired JSON format
  const results = records.map((record, index) => {
    // Map field names (handle both English and Dutch field names)
    const id = record.Id || record.id || String(index + 1);
    const startTime = record['Start time'] || record['start_time'] || '';
    const completionTime = record['Completion time'] || record['completion_time'] || '';
    const email = record.Email || record.email || 'anonymous';
    const name = record.Name || record.Naam || '';
    const company = record.Company || record.Bedrijf || '';
    const emailAddress = record.Emailadress || record.Emailadres || record.email || '';
    const topics = record.Topics || record.Onderwerpen || record['Onderwerpen waarover je wilt spreken'] || '';
    const bio = record.Bio || record.Biografie || record['Korte biografie'] || '';
    
    // Better handling for presentations field
    let presentations = '';
    const presentationFields = [
      'Recent presentations', 
      'Lijst van presentaties die je hebt gedaan of wilt doen',
      'Lijst van presentaties die je hebt gedaan of wilt do'
    ];
    
    for (const field of presentationFields) {
      if (record[field] && record[field].trim()) {
        presentations = record[field];
        break;
      }
    }
    
    // If still empty, look for any field that might contain presentation information
    if (!presentations) {
      for (const key of Object.keys(record)) {
        if (key.toLowerCase().includes('presentat') && record[key] && record[key].trim()) {
          presentations = record[key];
          break;
        }
      }
    }
    
    // Better handling for context field
    let context = '';
    const contextFields = [
      'Context', 
      'Context waarin je wilt spreken',
      'Korte omschrijving van wat voor soort presentaties en omstandigheden jou aanspreken'
    ];
    
    for (const field of contextFields) {
      if (record[field] && record[field].trim()) {
        context = record[field];
        break;
      }
    }
    
    // If still empty, look for any field that might contain context information
    if (!context) {
      for (const key of Object.keys(record)) {
        if ((key.toLowerCase().includes('context') || 
             key.toLowerCase().includes('omstandigheden') || 
             key.toLowerCase().includes('omschrijving')) && 
            record[key] && record[key].trim()) {
          context = record[key];
          break;
        }
      }
    }
    
    // Handle languages - Set default languages based on the example format
    let languages = {
      "Nederlands": true,
      "Engels": true
    };
    
    // Look for language information in any field
    for (const key of Object.keys(record)) {
      const value = record[key];
      if (value && typeof value === 'string') {
        // Check if this field contains language information
        if (value.includes('Engels') || value.includes('Nederlands') || 
            value.includes('Duits') || value.includes('Frans') || 
            value.includes('Klingon') || key.toLowerCase().includes('talen') || 
            key.toLowerCase().includes('languages')) {
          
          // If we find a field that looks like it contains language info
          const langStr = value.toString();
          
          // Reset languages object before parsing
          languages = {};
          
          // Check for common languages
          if (langStr.includes('Nederlands')) languages.Nederlands = true;
          if (langStr.includes('Engels')) languages.Engels = true;
          if (langStr.includes('Duits')) languages.Duits = true;
          if (langStr.includes('Frans')) languages.Frans = true;
          if (langStr.includes('Klingon')) languages.Klingon = true;
          
          // If we found language info, we can break out of the loop
          if (Object.keys(languages).length > 0) {
            break;
          }
        }
      }
    }
    
    // Set internal and external flags to true by default as per the expected format
    let internal = true;
    let external = true;
    
    // Check if there's a specific field for internal/external preferences
    const internalExternalField = record['Wil je intern en/of extern spreken?'] || '';
    
    // Only set to false if explicitly stated
    if (internalExternalField && internalExternalField.toLowerCase().includes('alleen extern')) {
      internal = false;
    }
    
    if (internalExternalField && internalExternalField.toLowerCase().includes('alleen intern')) {
      external = false;
    }
    
    return {
      id,
      start_time: startTime,
      completion_time: completionTime,
      email,
      name,
      last_modified_time: record.last_modified_time || '',
      company,
      emailadress: emailAddress,
      topics,
      bio,
      recent_presentations: presentations,
      context,
      languages,
      internal,
      external
    };
  });
  
  // Write the results to a JSON file
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 4));
  console.log(`Conversion complete! JSON data written to ${outputFile}`);
  
} catch (error) {
  console.error('Error processing CSV file:', error);
}
