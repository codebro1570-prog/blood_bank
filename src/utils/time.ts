export function formatRelativeAge(dateString: string): string {
  try {
    const past = new Date(dateString).getTime();
    // Reference base time: current time
    const now = Date.now();
    const diffMs = Math.max(0, now - past);
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 60) {
      return 'just now';
    }
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) {
      return `${diffMins} min ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hr' : 'hrs'} ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } catch {
    return dateString;
  }
}
