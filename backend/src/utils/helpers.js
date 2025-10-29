import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique certificate ID
 * Format: GDGOC-YYYYMMDD-XXXXX (e.g., GDGOC-20240101-A1B2C)
 */
export const generateUniqueId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Generate random 5-character alphanumeric string
  const randomPart = uuidv4().replace(/-/g, '').substring(0, 5).toUpperCase();
  
  return `GDGOC-${year}${month}${day}-${randomPart}`;
};

/**
 * Parse CSV content and return array of certificate data
 * Expected CSV format: recipient_name,recipient_email,event_type,event_name
 */
export const parseCSV = (csvContent) => {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV must contain header row and at least one data row');
  }
  
  // Remove header
  const dataLines = lines.slice(1);
  
  const certificates = [];
  const errors = [];
  
  dataLines.forEach((line, index) => {
    const rowNumber = index + 2; // +2 because we removed header and arrays are 0-indexed
    
    // Simple CSV parser (handles basic cases)
    const values = line.split(',').map(v => v.trim());
    
    if (values.length < 4) {
      errors.push(`Row ${rowNumber}: Incomplete data (expected 4 columns)`);
      return;
    }
    
    const [recipient_name, recipient_email, event_type, event_name] = values;
    
    // Validation
    if (!recipient_name) {
      errors.push(`Row ${rowNumber}: Recipient name is required`);
      return;
    }
    
    if (!event_type || !['workshop', 'course'].includes(event_type.toLowerCase())) {
      errors.push(`Row ${rowNumber}: Event type must be 'workshop' or 'course'`);
      return;
    }
    
    if (!event_name) {
      errors.push(`Row ${rowNumber}: Event name is required`);
      return;
    }
    
    // Email validation (basic)
    if (recipient_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient_email)) {
      errors.push(`Row ${rowNumber}: Invalid email format`);
      return;
    }
    
    certificates.push({
      recipient_name,
      recipient_email: recipient_email || null,
      event_type: event_type.toLowerCase(),
      event_name,
    });
  });
  
  if (errors.length > 0) {
    throw new Error(`CSV parsing errors:\n${errors.join('\n')}`);
  }
  
  return certificates;
};

export default { generateUniqueId, parseCSV };
