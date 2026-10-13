/** Share an impact story: WhatsApp text, an Instagram-sized image, copy, or the phone's share sheet. */
import { useState } from 'react';
import { Icon } from '../../ui';

export interface Shareable { headline: string; story: string; shareText: string }

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** A 1080 × 1920 story image (Instagram / WhatsApp status size). */
function storyImage(s: Shareable): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
  bg.addColorStop(0, '#7d0a1c');
  bg.addColorStop(0.7, '#2a0f2e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '600 40px system-ui, sans-serif';
  ctx.fillText('TraceDrop · My donation story', 90, 180);
  ctx.fillStyle = '#fff';
  ctx.font = '800 76px system-ui, sans-serif';
  let y = 520;
  for (const l of wrap(ctx, s.headline, 900)) { ctx.fillText(l, 90, y); y += 92; }
  y += 40;
  ctx.font = '400 46px system-ui, sans-serif';
  for (const l of wrap(ctx, s.story, 900).slice(0, 14)) { ctx.fillText(l, 90, y); y += 64; }
  ctx.font = '700 42px system-ui, sans-serif';
  ctx.fillText('One donation can help up to three people.', 90, 1720);
  ctx.font = '400 36px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('#DonateBlood', 90, 1790);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export default function ShareBar({ item }: { item: Shareable }) {
  const [note, setNote] = useState('');
  const text = `${item.headline}\n\n${item.shareText}`;

  async function instagram() {
    const blob = await storyImage(item);
    if (!blob) return;
    const file = new File([blob], 'tracedrop-story.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: item.headline, text: item.shareText }); } catch { /* cancelled */ }
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tracedrop-story.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNote('Story image saved. Post it from Instagram on your phone.');
  }

  async function copy() {
    try { await navigator.clipboard.writeText(text); setNote('Copied.'); } catch { setNote('Could not copy.'); }
  }

  async function more() {
    try { await navigator.share({ title: item.headline, text }); } catch { /* cancelled */ }
  }

  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="row wrap" style={{ gap: 8 }}>
        <a className="btn btn-sm btn-wa" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"><Icon name="share" size={14} /> WhatsApp</a>
        <button className="btn btn-sm btn-ig" onClick={instagram}><Icon name="upload" size={14} /> Instagram story</button>
        <button className="btn btn-sm" onClick={copy}>Copy text</button>
        {typeof navigator.share === 'function' && <button className="btn btn-sm" onClick={more}>More…</button>}
      </div>
      {note && <span className="tiny muted">{note}</span>}
    </div>
  );
}
