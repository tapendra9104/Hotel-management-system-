export function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toIsoTimestamp(value: string | Date = new Date()): string {
  const date = parseDate(value);
  if (!date) {
    throw new Error('Invalid date supplied');
  }

  return date.toISOString();
}

export function toIsoDate(value: string | Date = new Date()): string {
  return toIsoTimestamp(value).slice(0, 10);
}

export function nightsBetween(checkInDate: string, checkOutDate: string): number {
  const checkIn = parseDate(checkInDate);
  const checkOut = parseDate(checkOutDate);

  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return 0;
  }

  return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
}

export function toDisplayTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const reference = new Date();
  reference.setHours(hours, minutes || 0, 0, 0);

  return reference.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

