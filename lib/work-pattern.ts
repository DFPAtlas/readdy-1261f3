export function parseCycle(pattern: string): ('on' | 'off')[] | null {
  const p = (pattern || '').trim().toLowerCase();
  if (!p) return null;

  const onOff = p.match(/^(\d+)\s*(?:days?\s*)?on\s*\/\s*(\d+)\s*(?:days?\s*)?off$/);
  if (onOff) {
    const on = parseInt(onOff[1], 10);
    const off = parseInt(onOff[2], 10);
    if (on > 0 && off > 0) {
      const cycle: ('on' | 'off')[] = [];
      for (let i = 0; i < on; i++) cycle.push('on');
      for (let i = 0; i < off; i++) cycle.push('off');
      return cycle;
    }
  }

  const daysNights = p.match(/^(\d+)\s*days?\s*\/\s*(\d+)\s*nights?\s*\/\s*(\d+)\s*off$/);
  if (daysNights) {
    const days = parseInt(daysNights[1], 10);
    const nights = parseInt(daysNights[2], 10);
    const off = parseInt(daysNights[3], 10);
    if (days > 0 && nights > 0 && off > 0) {
      const cycle: ('on' | 'off')[] = [];
      for (let i = 0; i < days + nights; i++) cycle.push('on');
      for (let i = 0; i < off; i++) cycle.push('off');
      return cycle;
    }
  }

  return null;
}

export function isWorkingOn(pattern: string, patternStartDate: string | null, date: Date): boolean {
  const p = (pattern || '').trim().toLowerCase();
  if (!p) return false;

  if (p === 'weekends only') {
    const dow = date.getDay();
    return dow === 0 || dow === 6;
  }

  let cycle = parseCycle(p);
  if (p === 'days only' || p === 'nights only') {
    cycle = ['on', 'on', 'on', 'on', 'off', 'off', 'off', 'off'];
  }

  if (!cycle) return false;
  if (!patternStartDate) return false;

  const start = new Date(patternStartDate);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((targetDay.getTime() - startDay.getTime()) / 86400000);
  if (diffDays < 0) return false;
  return cycle[diffDays % cycle.length] === 'on';
}