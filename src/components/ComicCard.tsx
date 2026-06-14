import Link from 'next/link';

interface ComicCardProps {
  title: string;
  image: string;
  endpoint: string;
  type?: string;
}

export default function ComicCard({ title, image, endpoint, type }: ComicCardProps) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  return (
    <Link href={`/comic/${encodeURIComponent(cleanEndpoint)}`} className="comic-card" id={`comic-${cleanEndpoint}`}>
      <div className="comic-cover-wrapper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={title} className="comic-cover" loading="lazy" />
        {type && <div className="comic-type">{type}</div>}
      </div>
      <div className="comic-info">
        <h3 className="comic-title">{title}</h3>
      </div>
    </Link>
  );
}
