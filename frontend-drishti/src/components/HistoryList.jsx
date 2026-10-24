import React from 'react';
import { HistoryCard } from './HistoryCard.jsx';
import { History, Inbox } from 'lucide-react';

export const HistoryList = ({ items, onDelete, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse h-48 flex flex-col justify-between"
          >
            <div className="h-4 bg-slate-800 rounded w-1/3 mb-3" />
            <div className="h-3 bg-slate-800 rounded w-full mb-2" />
            <div className="h-3 bg-slate-800 rounded w-4/5" />
            <div className="h-8 bg-slate-800 rounded w-1/4 mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 my-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-500 border border-slate-700 mx-auto flex items-center justify-center mb-4">
          <Inbox className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No Past Captures Yet</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          When you capture scenes or read documents with Drishti, your historical audio records will appear here.
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      role="feed"
      aria-label="Past scene analysis logs"
    >
      {items.map((item) => (
        <HistoryCard key={item.id} item={item} onDelete={onDelete} />
      ))}
    </div>
  );
};
