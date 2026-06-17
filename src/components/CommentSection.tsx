'use client';

import { useState, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  name: string | null;
  avatar: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  userId: string;
  comicEndpoint: string;
  text: string;
  createdAt: string;
  user: User;
  replies?: Comment[];
}

export default function CommentSection({ endpoint }: { endpoint: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?endpoint=${encodeURIComponent(endpoint)}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch comments', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comicEndpoint: endpoint, text: newComment }),
      });
      const data = await res.json();
      if (data.success) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to post comment', error);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim() || !session) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comicEndpoint: endpoint, text: replyText, parentId }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        setReplyingTo(null);
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to post reply', error);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const avatar = comment.user.avatar || comment.user.image || '/icon.png';
    const name = comment.user.name || 'Anonymous';
    const date = new Date(comment.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    
    return (
      <div key={comment.id} className={`comment-card glass-panel ${isReply ? 'comment-reply' : ''}`} style={isReply ? { marginLeft: '3rem', marginTop: '1rem', background: 'rgba(255, 255, 255, 0.03)' } : {}}>
        <img src={avatar} alt={name} className="comment-avatar" />
        <div className="comment-content">
          <div className="comment-header">
            <span className="comment-user">{name}</span>
            <span className="comment-time">{date}</span>
          </div>
          <p className="comment-text">{comment.text}</p>
          
          <div className="comment-emotes">
            {!isReply && session && (
              <button 
                onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(''); }} 
                className="emote-btn flex-center reply-btn"
              >
                <MessageSquare size={14} /> <span>Balas</span>
              </button>
            )}
          </div>

          {/* Reply Input Form */}
          {replyingTo === comment.id && !isReply && session && (
            <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="comment-form glass-panel reply-form" style={{ marginTop: '1rem', padding: '1rem' }}>
               <img src={session.user?.image || "/icon.png"} alt="You" className="comment-avatar" style={{ width: '30px', height: '30px' }} />
               <div className="comment-input-wrapper" style={{ height: '40px' }}>
                 <input 
                   type="text" 
                   placeholder={`Balas @${name}...`}
                   value={replyText}
                   onChange={(e) => setReplyText(e.target.value)}
                   className="comment-input"
                   autoFocus
                 />
                 <button type="submit" className="comment-submit flex-center" disabled={!replyText.trim()}>
                   <Send size={16} />
                 </button>
               </div>
            </form>
          )}

          {/* Render nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="replies-container">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="comment-section glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>Memuat komentar...</div>;

  const totalPages = Math.ceil(comments.length / 5);
  const currentComments = comments.slice((currentPage - 1) * 5, currentPage * 5);

  return (
    <div className="comment-section">
      <h3 className="comment-title">💬 {comments.length} Komentar</h3>
      
      {session ? (
        <form onSubmit={handleSubmit} className="comment-form glass-panel">
          <img src={session.user?.image || "/icon.png"} alt="You" className="comment-avatar" />
          <div className="comment-input-wrapper">
            <input 
              type="text" 
              placeholder="Tulis komentarmu..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="comment-input"
            />
            <button type="submit" className="comment-submit flex-center" disabled={!newComment.trim()}>
              <Send size={18} />
            </button>
          </div>
        </form>
      ) : (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderRadius: '12px', marginBottom: '2rem' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Anda harus login untuk bisa memberikan komentar.</p>
          <button onClick={() => router.push('/login')} className="reader-footer-btn" style={{ margin: '0 auto' }}>
            Login Sekarang
          </button>
        </div>
      )}

      <div className="comment-list">
        {currentComments.map(c => renderComment(c))}
      </div>

      {totalPages > 1 && (
        <div className="comment-pagination">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="pagination-btn glass-panel">Sebelumnya</button>
          <span className="pagination-info">Halaman {currentPage} dari {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="pagination-btn glass-panel">Berikutnya</button>
        </div>
      )}
    </div>
  );
}
