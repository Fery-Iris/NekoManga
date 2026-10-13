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
          onError={(e) => {
            if (!e.currentTarget.dataset.fallback) {
              e.currentTarget.dataset.fallback = '1';
              e.currentTarget.src = `/api/proxy?url=${encodeURIComponent(cleanImage)}`;
            } else {
              e.currentTarget.src = '/icon.png';
            }
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
