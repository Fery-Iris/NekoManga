import { Loader2 } from 'lucide-react';

export default function Loader() {
  return (
    <div className="loader-container flex-center">
      <Loader2 size={40} className="loader-icon" />
    </div>
  );
}
