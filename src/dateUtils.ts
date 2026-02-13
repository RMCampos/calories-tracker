export interface CurrentDateResult {
  date: string;       // "2026-02-13"
  dateTime: Date;     // new Date(year, month-1, day) — local-midnight Date
  timeString: string; // "HH:MM"
}

export async function getCurrentDate(timezone: string): Promise<CurrentDateResult> {
  if (timezone) {
    try {
      const response = await fetch(
        `https://timeapi.io/api/v1/time/current/zone?timezone=${encodeURIComponent(timezone)}`
      );
      if (response.ok) {
        const data = await response.json();
        // data.date is "YYYY-MM-DD", data.time is "HH:MM:SS.mmm" or "HH:MM"
        const [year, month, day] = data.date.split('-').map(Number);
        const dateTime = new Date(year, month - 1, day);
        const timeParts = data.time.split(':');
        const timeString = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
        return { date: data.date, dateTime, timeString };
      }
    } catch (e) {
      console.warn('timeapi.io request failed, falling back to browser time:', e);
    }
  }

  // Fallback: browser local time
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dateTime = new Date(year, now.getMonth(), day);
  const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return { date, dateTime, timeString };
}
