/** Tap-through Story: click or tap the left/right half, arrow keys, Esc to close. The last slide can be shared. */
import { useEffect, useState } from 'react';

export default function StoryViewer({ title, slides, onClose }: { title: string; slides: string[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const last = i === slides.length - 1;
  const go = (step: number) => setI((n) => Math.max(0, Math.min(slides.length - 1, n + step)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const share = async () => {
    const text = `${slides.join(' ')}\n\nShared from TraceDrop.`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {
      return; // the donor closed the share sheet
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  return (
    <div className="story-back" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="story">
        <div className="story-prog">{slides.map((_, n) => <i key={n} className={n <= i ? 'on' : ''} />)}</div>
        <div className="story-top"><span>{title}</span><button className="story-close" aria-label="Close" onClick={onClose}>×</button></div>
        <div className="story-body" aria-live="polite">{slides[i]}</div>
        <div className="story-zones">
          <button aria-label="Previous" onClick={() => go(-1)} />
          <button aria-label="Next" onClick={() => go(1)} />
        </div>
        {last
          ? <button className="story-share" onClick={share}>Share to WhatsApp status</button>
          : <div className="story-hint">Tap the right side or press → for the next part</div>}
      </div>
    </div>
  );
}
