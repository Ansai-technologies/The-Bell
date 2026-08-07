/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, ChevronRight, BookOpen, Clock, Tag } from 'lucide-react';

export default function PublicArchive() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const fetchNotices = async (searchQuery: string, pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notices?q=${encodeURIComponent(searchQuery)}&page=${pageNum}&limit=20`);
      if (res.ok) {
        const json = await res.json();
        setNotices(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices(query, page);
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchNotices(query, 1);
  };

  return (
    <div className="h-full bg-slate-50 text-slate-900 font-sans">
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-4 text-slate-800">Discover legal and public notices.</h2>
          <p className="text-slate-500 text-lg">
            Search through thousands of Kenya Gazette notices. Find appointments, land matters, corrigenda, and legislative updates instantly.
          </p>
        </div>

        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-2">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by keyword, Act, or subject..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-slate-800 placeholder:text-slate-400"
            />
          </form>
          <button className="md:w-auto w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider font-bold">
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button onClick={handleSearch} className="md:w-auto w-full px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors text-sm uppercase tracking-wider font-bold">
            Search
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center text-slate-500 flex flex-col items-center">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-4" />
              Loading notices...
            </div>
          ) : notices.length > 0 ? (
            notices.map((notice) => (
              <div key={notice.id} className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded uppercase">
                      GN {notice.noticeNumber}
                    </span>
                    {notice.primaryCategory && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {notice.primaryCategory}
                      </span>
                    )}
                    <span className="text-slate-400 text-sm flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {notice.noticeYear}
                    </span>
                  </div>
                  
                  <h3 className="font-serif text-lg font-bold text-slate-800 leading-tight group-hover:text-blue-700 transition-colors">
                    {notice.subjectLine || "Untitled Notice"}
                  </h3>
                  
                  {notice.actCited && (
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> {notice.actCited}
                    </p>
                  )}
                  
                  <p className="text-slate-600 text-sm line-clamp-2 mt-2 leading-relaxed">
                    {notice.rawText}
                  </p>
                </div>
                
                <div className="hidden md:flex items-center justify-center w-8 h-8 rounded bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-slate-900 transition-colors flex-shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 px-6 border border-slate-200 border-dashed rounded-xl bg-white">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-1">No notices found</h3>
              <p className="text-slate-500 text-sm">We couldn't find any notices matching your criteria. Try adjusting your search.</p>
            </div>
          )}
        </div>

        {notices.length > 0 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 bg-white border border-slate-200 rounded text-[10px] uppercase font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors tracking-wide"
            >
              Previous
            </button>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Page {page}</span>
            <button 
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded text-[10px] uppercase font-bold text-slate-600 hover:bg-slate-50 transition-colors tracking-wide"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

