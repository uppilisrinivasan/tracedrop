/** A booked doctor check-up: when, who, where, why, what to bring, plus calendar, directions and change/cancel. */
import type { DropBooking } from '../../api';
import { Icon } from '../../ui';

export const fmtVisitDay = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

const mapsUrl = (b: DropBooking) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.clinic || b.place}, ${b.address || ''}`)}`;

function downloadIcs(b: DropBooking) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = new Date(`${b.date}T${b.time}:00+05:30`);
  const end = new Date(start.getTime() + (b.durationMinutes || 20) * 60000);
  const esc = (s: string) => s.replace(/[,;\\]/g, (m) => `\\${m}`);
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TraceDrop//Checkup//EN', 'BEGIN:VEVENT',
    `UID:${b.id}@tracedrop`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`Check-up with ${b.doctor || 'doctor'}`)}`,
    `LOCATION:${esc(`${b.clinic || b.place}, ${b.address || ''}`)}`,
    `DESCRIPTION:${esc(`${b.reason || 'Check-up'}. Bring: ${(b.bring || []).join(', ')}`)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Check-up today', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `checkup-${b.date}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Checkup({ booking: b, busy, onChange, onCancel }: { booking: DropBooking; busy?: boolean; onChange?: () => void; onCancel?: () => void }) {
  return (
    <div className={`checkup ${b.urgent ? 'urgent' : ''}`}>
      <div className="checkup-when">
        <span className="checkup-day">{new Date(`${b.date}T00:00:00Z`).getUTCDate()}</span>
        <span className="tiny">{new Date(`${b.date}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}</span>
      </div>
      <div className="checkup-body">
        <div className="row between" style={{ gap: 8, flexWrap: 'wrap' }}>
          <b>{b.reason || 'Doctor check-up'}</b>
          <span className={`pill ${b.urgent ? 'pill-bad' : 'pill-good'}`}>{b.urgent ? 'Today' : b.cost || 'Free'}</span>
        </div>
        <div className="checkup-facts">
          <span><Icon name="clock" size={15} /> {fmtVisitDay(b.date)} · {b.time}{b.durationMinutes ? ` · about ${b.durationMinutes} min` : ''}</span>
          {b.doctor && <span><Icon name="doctor" size={15} /> {b.doctor}{b.speciality ? `, ${b.speciality}` : ''}</span>}
          <span><Icon name="pin" size={15} /> {b.clinic || b.place}{b.address ? `, ${b.address}` : ''}</span>
          {b.phone && <span><Icon name="phone" size={15} /> <a href={`tel:${b.phone.replace(/\s/g, '')}`}>{b.phone}</a></span>}
        </div>
        {b.bring && b.bring.length > 0 && <div className="tiny muted">Bring: {b.bring.join(' · ')}</div>}
        <div className="checkup-actions">
          <button className="btn btn-sm" onClick={() => downloadIcs(b)}><Icon name="calendar" size={14} /> Add to calendar</button>
          <a className="btn btn-sm" href={mapsUrl(b)} target="_blank" rel="noreferrer"><Icon name="pin" size={14} /> Directions</a>
          {onChange && <button className="btn btn-sm" disabled={busy} onClick={onChange}>Change time</button>}
          {onCancel && <button className="btn btn-sm btn-ghost" disabled={busy} onClick={onCancel}>Cancel</button>}
        </div>
      </div>
    </div>
  );
}
