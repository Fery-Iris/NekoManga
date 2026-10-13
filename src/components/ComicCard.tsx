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
            const currentSrc = e.currentTarget.src;
            const stage = e.currentTarget.dataset.fallbackStage || '0';
            if (stage === '0' && currentSrc.includes('-Komik-')) {
              e.currentTarget.dataset.fallbackStage = '1';
              e.currentTarget.src = currentSrc.replace('-Komik-', '-Manga-');
            } else if ((stage === '0' || stage === '1') && currentSrc.includes('-Manga-')) {
              e.currentTarget.dataset.fallbackStage = '2';
              e.currentTarget.src = currentSrc.replace('-Manga-', '-Manhwa-');
            } else if ((stage === '0' || stage === '1' || stage === '2') && currentSrc.includes('-Manhwa-')) {
              e.currentTarget.dataset.fallbackStage = '3';
              e.currentTarget.src = currentSrc.replace('-Manhwa-', '-Manhua-');
            } else if (stage !== 'final') {
              e.currentTarget.dataset.fallbackStage = 'final';
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
