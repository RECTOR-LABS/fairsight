'use client';

import { useState } from 'react';
import { Star, Send, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { TIER_LABELS, REVIEW_WEIGHTS } from '@/types';

interface ReviewFormProps {
  tokenMint: string;
  onSubmitted: () => void;
}

export default function ReviewForm({ tokenMint, onSubmitted }: ReviewFormProps) {
  const { user, token } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <Lock className="h-5 w-5 text-zinc-600" />
        <p className="text-sm text-zinc-500">Connect your wallet to write a review</p>
      </div>
    );
  }

  if (user.fairScoreTier < 2) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <Lock className="h-5 w-5 text-zinc-600" />
        <div>
          <p className="text-sm text-zinc-400">
            Silver tier or higher required to write reviews
          </p>
          <p className="text-xs text-zinc-600">
            Your tier: {TIER_LABELS[user.fairScoreTier]}
          </p>
        </div>
      </div>
    );
  }

  const weight = REVIEW_WEIGHTS[user.fairScoreTier] || 1.0;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tokenMint,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess(true);
      setRating(0);
      setComment('');
      onSubmitted();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">Write a Review</h4>
        <span className="text-xs text-zinc-500">
          Your weight: {weight}x ({TIER_LABELS[user.fairScoreTier]})
        </span>
      </div>

      {/* Star rating */}
      <div className="mb-3 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const starIndex = i + 1;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setRating(starIndex)}
              onMouseEnter={() => setHoveredStar(starIndex)}
              onMouseLeave={() => setHoveredStar(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={`h-6 w-6 ${
                  starIndex <= (hoveredStar || rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-zinc-700'
                }`}
              />
            </button>
          );
        })}
        {rating > 0 && (
          <span className="ml-2 text-sm text-zinc-400">{rating}/5</span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment..."
        maxLength={500}
        rows={2}
        className="mb-3 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />

      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
      {success && <p className="mb-2 text-xs text-emerald-400">Review submitted</p>}

      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="h-4 w-4" />
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
