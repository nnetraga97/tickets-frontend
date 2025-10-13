import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the CSV file
const csvContent = fs.readFileSync(
  path.join(__dirname, '../public/outstanding cherwell tickets 10-7-2025.csv'),
  'utf-8'
);

// Simple CSV parser
function parseCSV(content) {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Handle quoted fields with commas
    const values = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || '';
    });
    records.push(record);
  }
  
  return records;
}

// Parse CSV
const csvRecords = parseCSV(csvContent);

console.log(`Parsed ${csvRecords.length} records`);
console.log('Headers:', Object.keys(csvRecords[0]));

// Function to parse date string to ISO format
function parseDate(dateStr) {
  if (!dateStr || dateStr === 'False') return null;
  
  // Format: "5/21/2025 4:23 PM"
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s+(AM|PM)/);
  if (!match) return null;
  
  let [, month, day, year, hour, minute, ampm] = match;
  hour = parseInt(hour);
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  
  return new Date(year, parseInt(month) - 1, parseInt(day), hour, parseInt(minute)).toISOString();
}

// Map CSV to ticket schema
const tickets = csvRecords.map(record => {
  return {
    incidentId: `INC-${record['Incident ID'] || 'UNKNOWN'}`,
    description: record['Description'] || '',
    summary: record['Summary'] || '',
    createdDateTime: parseDate(record['Created Date Time']),
    lastModifiedDateTime: parseDate(record['Last Modified Date Time']) || parseDate(record['Created Date Time']),
    ownedBy: record['Owned By'] || null,
    status: record['Status'] || 'Unknown',
    category: record['Category'] || null,
    subcategory: record['SubCategory'] || null,
    incidentType: record['Incident Type'] || 'Incident',
    priority: record['Priority'] || '4',
    service: record['Service'] || null,
    createdBy: record['Created By'] || null,
    resolvedBy: null,
    customerDisplayName: record['CustomerDisplayName'] || null,
    closedDate: parseDate(record['Closed Date Time']),
    resolution: null,
    journalNotes: null,
    internalStatus: null,
    ownedByTeam: record['Owned By Team'] || null
  };
});

// Write JSON file
const jsonOutput = JSON.stringify(tickets, null, 2);
fs.writeFileSync(
  path.join(__dirname, '../public/mock/tickets-from-csv.json'),
  jsonOutput
);

console.log(`✅ Created mock/tickets-from-csv.json with ${tickets.length} tickets`);

// Generate SQL insert script
let sqlScript = `-- Ticket data import from outstanding cherwell tickets 10-7-2025.csv
-- Generated on ${new Date().toISOString()}
-- Total tickets: ${tickets.length}

-- Clear existing tickets (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE tickets CASCADE;

-- Insert tickets
`;

tickets.forEach((ticket, idx) => {
  const escape = (str) => {
    if (str === null || str === undefined) return 'NULL';
    return `'${String(str).replace(/'/g, "''")}'`;
  };
  
  const escapeTimestamp = (str) => {
    if (!str) return 'NULL';
    return `'${str}'::timestamptz`;
  };
  
  sqlScript += `
INSERT INTO tickets (
    incident_id,
    description,
    summary,
    created_date_time,
    last_modified_date_time,
    owned_by,
    status,
    category,
    subcategory,
    incident_type,
    priority,
    service,
    created_by,
    resolved_by,
    customer_display_name,
    closed_date,
    resolution,
    journal_notes,
    internal_status
) VALUES (
    ${escape(ticket.incidentId)},
    ${escape(ticket.description)},
    ${escape(ticket.summary)},
    ${escapeTimestamp(ticket.createdDateTime)},
    ${escapeTimestamp(ticket.lastModifiedDateTime)},
    ${escape(ticket.ownedBy)},
    ${escape(ticket.status)},
    ${escape(ticket.category)},
    ${escape(ticket.subcategory)},
    ${escape(ticket.incidentType)},
    ${escape(ticket.priority)},
    ${escape(ticket.service)},
    ${escape(ticket.createdBy)},
    ${escape(ticket.resolvedBy)},
    ${escape(ticket.customerDisplayName)},
    ${escapeTimestamp(ticket.closedDate)},
    ${escape(ticket.resolution)},
    ${escape(ticket.journalNotes)},
    ${escape(ticket.internalStatus)}
) ON CONFLICT (incident_id) DO UPDATE SET
    description = EXCLUDED.description,
    summary = EXCLUDED.summary,
    last_modified_date_time = EXCLUDED.last_modified_date_time,
    owned_by = EXCLUDED.owned_by,
    status = EXCLUDED.status;
`;
});

fs.writeFileSync(
  path.join(__dirname, '../../../tickets-backend/src/main/resources/db/migration/V9__import_cherwell_tickets.sql'),
  sqlScript
);

console.log(`✅ Created V9__import_cherwell_tickets.sql with ${tickets.length} INSERT statements`);

// Also create a standalone SQL file for manual import
fs.writeFileSync(
  path.join(__dirname, '../../../tickets-backend/import-tickets.sql'),
  sqlScript
);

console.log(`✅ Created import-tickets.sql for manual import`);

console.log('\n📊 Summary:');
console.log(`- Total tickets: ${tickets.length}`);
console.log(`- Date range: ${tickets[0]?.createdDateTime} to ${tickets[tickets.length-1]?.createdDateTime}`);
console.log(`- Statuses: ${[...new Set(tickets.map(t => t.status))].join(', ')}`);
console.log(`- Categories: ${[...new Set(tickets.map(t => t.category))].filter(Boolean).join(', ')}`);

