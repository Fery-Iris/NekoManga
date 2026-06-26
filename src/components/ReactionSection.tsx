'use client';

import { useState, useEffect } from 'react';

interface ReactionCounts {
  keren: number;
  lucu: number;
  suka: number;
  terkejut: number;
  marah: number;
  sedih: number;
}

const REACTIONS = [
  { id: 'keren', emoji: '👍', label: 'Keren' },
  { id: 'lucu', emoji: '😆', label: 'Lucu' },
  { id: 'suka', emoji: '😍', label: 'Suka' },
  { id: 'terkejut', emoji: '😲', label: 'Terkejut' },
  { id: 'marah', emoji: '😤', label: 'Marah' },
  { id: 'sedih', emoji: '😢', label: 'Sedih' },
];

export default function ReactionSection({ endpoint }: { endpoint: string }) {
  const [counts, setCounts] = useState<ReactionCounts>({
    keren: 0, lucu: 0, suka: 0, terkejut: 0, marah: 0, sedih: 0
  });
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load counts from API
    const fetchReactions = async () => {
      try {
        const res = await fetch(`/api/reactions?endpoint=${encodeURIComponent(endpoint)}`);
        const data = await res.json();
        if (data.success && data.data) {
          setCounts(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch reactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReactions();

    // Load user's local reaction state
    const localReactions = JSON.parse(localStorage.getItem('user_reactions') || '{}');
    if (localReactions[endpoint]) {
      setUserReaction(localReactions[endpoint]);
    }
  }, [endpoint]);

  const handleReactionClick = async (type: string) => {
    if (isLoading) return;

    let action = 'add';
    let newReactionType: string | null = type;
    let oldReactionType: string | null = userReaction;

    // Toggle logic
    if (userReaction === type) {
      // Remove reaction
      action = 'remove';
      newReactionType = null;
    }

    // Optimistic Update
    setCounts((prev) => {
      const nextCounts = { ...prev };
      if (action === 'add') {
        nextCounts[type as keyof ReactionCounts] += 1;
        if (oldReactionType && oldReactionType !== type) {
          nextCounts[oldReactionType as keyof ReactionCounts] -= 1;
        }
      } else {
        nextCounts[type as keyof ReactionCounts] -= 1;
      }
      return nextCounts;
    });

    setUserReaction(newReactionType);

    // Update LocalStorage
    const localReactions = JSON.parse(localStorage.getItem('user_reactions') || '{}');
    if (newReactionType) {
      localReactions[endpoint] = newReactionType;
    } else {
      delete localReactions[endpoint];
    }
    localStorage.setItem('user_reactions', JSON.stringify(localReactions));

    // Update Server
    try {
      // If switching reaction, we first remove the old one
      if (oldReactionType && oldReactionType !== type && action === 'add') {
        await fetch('/api/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint, type: oldReactionType, action: 'remove' }),
        });
      }

      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, type, action }),
      });
    } catch (error) {
      console.error('Failed to post reaction:', error);
    }
  };

  const totalReactions = Object.values(counts).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);

  return (
    <div className="reaction-section" style={{ textAlign: 'center', margin: '4rem 0 2rem' }}>
      <div style={{
        background: 'var(--bg-color-light)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '2rem 1.5rem',
        maxWidth: '480px',
        margin: '0 auto'
      }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>Berikan Pendapatmu yuk</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem' }}>{totalReactions} Respons</p>
        
        <div className="reaction-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '1rem', 
        }}>
          {REACTIONS.map((r) => {
            const isActive = userReaction === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleReactionClick(r.id)}
                className={`reaction-btn ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem 0.5rem',
                  borderRadius: '12px',
                  border: isActive ? '1px solid var(--primary-accent)' : '1px solid transparent',
                  background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  transition: 'all var(--transition-fast)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--glass-bg)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{r.emoji}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{counts[r.id as keyof ReactionCounts] || 0}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
