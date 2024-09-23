/**
 * Helper function to get formatted date strings for tomorrow's date.
 *
 * @returns {Object} An object containing:
 *  - verbose format (e.g., "Sat Sep 21 2024")
 *  - ISO date format (e.g., "2024-09-21")
 */
export function getFormattedTomorrowDates() {
  // Create a new Date object for today
  const tomorrow = new Date();

  // Set the date to tomorrow by adding 1 to today's date
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Format tomorrow's date in verbose form (e.g., "Sat Sep 21 2024")
  const verboseFormat = tomorrow
    .toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
    .replace(/,/g, ""); // Remove commas from the formatted string

  // Format tomorrow's date in ISO form (e.g., "2024-09-21")
  const isoFormat = tomorrow.toISOString().split("T")[0]; // Extract the date part only

  // Return both formatted date strings as an object
  return {
    verboseFormat,
    isoFormat,
  };
}
