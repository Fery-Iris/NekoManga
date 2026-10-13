import Link from 'next/link';

interface ComicCardProps {
  title: string;
  image: string;
  endpoint: string;
  type?: string;
}

export default function ComicCard({ title, image, endpoint, type }: ComicCardProps) {
  const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '').replace(/^manga\//, '');

  let cleanImage = image;
  if (cleanImage.includes('thumbnail.komiku.to')) {
    cleanImage = cleanImage.replace('thumbnail.komiku.to', 'thumbnail.komiku.org');
  }

  return (
    <Link href={`/comic/${encodeURIComponent(cleanEndpoint)}`} className="comic-card" id={`comic-${cleanEndpoint}`}>
      <div className="comic-cover-wrapper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={cleanImage} 
          alt={title} 
          className="comic-cover" 
          loading="lazy" 
          referrerPolicy="no-referrer"
          onError={async (e) => {
            const imgEl = e.currentTarget;
            if (imgEl.dataset.recovering) {
              imgEl.src = '/icon.png';
              return;
            }
            imgEl.dataset.recovering = '1';

            try {
              const res = await fetch(`/api/comic/cover/${encodeURIComponent(cleanEndpoint)}`);
              if (res.ok) {
                const data = await res.json();
                if (data.success && data.data?.cover) {
                  imgEl.src = data.data.cover;
                  return;
                }
              }
            } catch {}

            imgEl.src = '/icon.png';
          }}
        />
        {type && <div className="comic-type">{type}</div>}
      </div>
      <div className="comic-info">
        <h3 className="comic-title">{title}</h3>
      </div>
    </Link>
  );
}
