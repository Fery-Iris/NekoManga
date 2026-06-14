'use client';

import { useState } from 'react';
import { Send, ThumbsUp, Heart, Laugh, SmilePlus, MessageSquare } from 'lucide-react';

interface Emotes {
  like: number;
  love: number;
  haha: number;
  wow: number;
}

interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  emotes: Emotes;
  userReacted?: keyof Emotes | null;
  replies?: Comment[];
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    user: 'Satoru Gojo',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gojo',
    text: 'Chapter ini gila banget! Art-nya makin kesini makin dewa 🔥',
    time: '2 jam yang lalu',
    emotes: { like: 124, love: 56, haha: 2, wow: 89 },
    userReacted: null,
    replies: [
      {
        id: '1-1',
        user: 'Itadori Yuji',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Itadori',
        text: 'Bener banget bang, panel terakhir merinding!',
        time: '1 jam yang lalu',
        emotes: { like: 45, love: 12, haha: 0, wow: 0 },
        userReacted: null,
        replies: []
      }
    ]
  },
  {
    id: '2',
    user: 'MangaReader99',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Reader',
    text: 'Plot twist di halaman terakhir bikin nggak bisa tidur mikirin chapter minggu depan.',
    time: '5 jam yang lalu',
    emotes: { like: 45, love: 12, haha: 0, wow: 150 },
    userReacted: null,
    replies: []
  },
  {
    id: '3',
    user: 'KucingOren',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oren',
    text: 'Kapan chapter selanjutnya rilis min? Ga sabar nih!',
    time: '6 jam yang lalu',
    emotes: { like: 12, love: 0, haha: 3, wow: 0 },
    userReacted: null,
    replies: []
  }
];

const COMMENTS_PER_PAGE = 3;

export default function CommentSection() {
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Helper function to recursively find and update emotes (supports 1 level deep for now, or deeper if we use recursion)
  const updateReact = (commentsList: Comment[], commentId: string, emoteType: keyof Emotes): Comment[] => {
    return commentsList.map(c => {
      if (c.id === commentId) {
        const isCurrentlyReacted = c.userReacted === emoteType;
        const newEmotes = { ...c.emotes };
        if (c.userReacted && c.userReacted !== emoteType) {
          newEmotes[c.userReacted]--;
        }
        if (isCurrentlyReacted) {
          newEmotes[emoteType]--;
        } else {
          newEmotes[emoteType]++;
        }
        return { ...c, emotes: newEmotes, userReacted: isCurrentlyReacted ? null : emoteType };
      }
      if (c.replies) {
        return { ...c, replies: updateReact(c.replies, commentId, emoteType) };
      }
      return c;
    });
  };

  const handleReact = (commentId: string, emoteType: keyof Emotes) => {
    setComments(prev => updateReact(prev, commentId, emoteType));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      user: 'Guest User',
      avatar: '/icon.png',
      text: newComment,
      time: 'Baru saja',
      emotes: { like: 0, love: 0, haha: 0, wow: 0 },
      userReacted: null,
      replies: []
    };

    setComments([comment, ...comments]);
    setNewComment('');
    setCurrentPage(1); 
  };

  const handleReplySubmit = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const reply: Comment = {
      id: Date.now().toString(),
      user: 'Guest User',
      avatar: '/icon.png',
      text: replyText,
      time: 'Baru saja',
      emotes: { like: 0, love: 0, haha: 0, wow: 0 },
      userReacted: null,
      replies: []
    };

    setComments(prev => prev.map(c => {
      if (c.id === parentId) {
        return { ...c, replies: [...(c.replies || []), reply] };
      }
      return c;
    }));
    setReplyingTo(null);
    setReplyText('');
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`comment-card glass-panel ${isReply ? 'comment-reply' : ''}`} style={isReply ? { marginLeft: '3rem', marginTop: '1rem', background: 'rgba(255, 255, 255, 0.03)' } : {}}>
      <img src={comment.avatar} alt={comment.user} className="comment-avatar" />
      <div className="comment-content">
        <div className="comment-header">
          <span className="comment-user">{comment.user}</span>
          <span className="comment-time">{comment.time}</span>
        </div>
        <p className="comment-text">{comment.text}</p>
        
        <div className="comment-emotes">
          <button onClick={() => handleReact(comment.id, 'like')} className={`emote-btn flex-center ${comment.userReacted === 'like' ? 'active' : ''}`}>
            <ThumbsUp size={14} /> <span>{comment.emotes.like}</span>
          </button>
          <button onClick={() => handleReact(comment.id, 'love')} className={`emote-btn flex-center ${comment.userReacted === 'love' ? 'active' : ''}`}>
            <Heart size={14} /> <span>{comment.emotes.love}</span>
          </button>
          <button onClick={() => handleReact(comment.id, 'wow')} className={`emote-btn flex-center ${comment.userReacted === 'wow' ? 'active' : ''}`}>
            <SmilePlus size={14} /> <span>{comment.emotes.wow}</span>
          </button>
          <button onClick={() => handleReact(comment.id, 'haha')} className={`emote-btn flex-center ${comment.userReacted === 'haha' ? 'active' : ''}`}>
            <Laugh size={14} /> <span>{comment.emotes.haha}</span>
          </button>
          
          {!isReply && (
            <button 
              onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(''); }} 
              className="emote-btn flex-center reply-btn"
            >
              <MessageSquare size={14} /> <span>Balas</span>
            </button>
          )}
        </div>

        {/* Reply Input Form */}
        {replyingTo === comment.id && !isReply && (
          <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="comment-form glass-panel reply-form" style={{ marginTop: '1rem', padding: '1rem' }}>
             <img src="/icon.png" alt="You" className="comment-avatar" style={{ width: '30px', height: '30px' }} />
             <div className="comment-input-wrapper" style={{ height: '40px' }}>
               <input 
                 type="text" 
                 placeholder={`Balas @${comment.user}...`}
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

  const totalPages = Math.ceil(comments.length / COMMENTS_PER_PAGE);
  const currentComments = comments.slice((currentPage - 1) * COMMENTS_PER_PAGE, currentPage * COMMENTS_PER_PAGE);

  return (
    <div className="comment-section">
      <h3 className="comment-title">💬 {comments.length} Komentar</h3>
      
      <form onSubmit={handleSubmit} className="comment-form glass-panel">
        <img src="/icon.png" alt="You" className="comment-avatar" />
        <div className="comment-input-wrapper">
          <input 
            type="text" 
            placeholder="Tulis komentarmu tentang chapter ini..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="comment-input"
          />
          <button type="submit" className="comment-submit flex-center" disabled={!newComment.trim()}>
            <Send size={18} />
          </button>
        </div>
      </form>

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
