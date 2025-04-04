
/**
 * Utility functions for working with calendar events
 */

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHMMSS format)
 */
export function formatGoogleCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Generate a Google Calendar URL for creating a new event
 */
export function generateGoogleCalendarUrl(params: {
  title: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  location?: string;
}): string {
  const { title, startDate, description, location } = params;
  
  // Default end date is 1 hour after start date if not provided
  const endDate = params.endDate || new Date(startDate.getTime() + 60 * 60 * 1000);
  
  // Format dates for Google Calendar URL
  const formattedStart = formatGoogleCalendarDate(startDate);
  const formattedEnd = formatGoogleCalendarDate(endDate);
  
  // Build the URL
  let url = `https://calendar.google.com/calendar/render?action=TEMPLATE`;
  url += `&text=${encodeURIComponent(title)}`;
  url += `&dates=${formattedStart}/${formattedEnd}`;
  
  if (description) {
    url += `&details=${encodeURIComponent(description)}`;
  }
  
  if (location) {
    url += `&location=${encodeURIComponent(location)}`;
  }
  
  return url;
}
