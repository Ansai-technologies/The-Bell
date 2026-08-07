import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    recent: [],
  });

  useEffect(() => {
    // Fetch some notices for the dashboard
    fetch('/api/notices?limit=5')
      .then(res => res.json())
      .then(data => {
        setStats({
          total: 14202, // Mocked total
          recent: data.data || []
        });
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <>
      {/* Header */}
      <header className="py-6 px-8 flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-800 tracking-tight">Operational Overview</h1>
          <p className="text-xs text-slate-500 font-medium">Real-time status of Kenya Law Gazette processing pipeline</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Edition Polled</p>
            <p className="text-sm font-semibold text-slate-700">Vol. CXXV—No. 212 (03 Nov 2023)</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase">Notices Ingested</p>
            <p className="text-3xl font-bold mt-1">14,202</p>
            <p className="text-xs text-emerald-600 mt-2 font-medium">↑ 124 today</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase">Telegram Alerts</p>
            <p className="text-3xl font-bold mt-1">1,842</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Delivered this week</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase">Classification Recall</p>
            <p className="text-3xl font-bold mt-1">99.8%</p>
            <p className="text-xs text-amber-500 mt-2 font-medium">4 items flagged manual</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase">Active Revenue</p>
            <p className="text-3xl font-bold mt-1">KES 42k</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">322 Paying subscribers</p>
          </div>
        </div>

        {/* Tables Section */}
        <div className="px-8 pb-8 flex flex-col xl:flex-row gap-8">
          {/* Notices Feed */}
          <div className="flex-[2] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-700">Recent Ingested Notices</h2>
              <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded">VIEW ARCHIVE</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-[10px] font-bold uppercase text-slate-500">ID / Act</th>
                    <th className="p-3 text-[10px] font-bold uppercase text-slate-500">Subject</th>
                    <th className="p-3 text-[10px] font-bold uppercase text-slate-500">Category</th>
                    <th className="p-3 text-[10px] font-bold uppercase text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recent.length > 0 ? stats.recent.map((notice: any) => (
                    <tr key={notice.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <p className="text-xs font-mono font-bold">GN {notice.noticeNumber}</p>
                        <p className="text-[10px] text-slate-400">{notice.actCited || "Unknown Act"}</p>
                      </td>
                      <td className="p-3 text-xs max-w-xs truncate" title={notice.subjectLine}>{notice.subjectLine || "Untitled Notice"}</td>
                      <td className="p-3">
                        {notice.primaryCategory ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold uppercase">{notice.primaryCategory}</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-bold uppercase">UNCATEGORIZED</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase">MATCHED</span>
                      </td>
                    </tr>
                  )) : (
                    <tr className="hover:bg-slate-50">
                      <td className="p-3">
                        <p className="text-xs font-mono font-bold">GN 14023</p>
                        <p className="text-[10px] text-slate-400">Land Registration Act</p>
                      </td>
                      <td className="p-3 text-xs">Issue of a Provisional Certificate — Kericho/Sigowet...</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold uppercase">LAND</span></td>
                      <td className="p-3"><span className="text-[10px] text-emerald-600 font-bold uppercase">MATCHED</span></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Panel: Stats & Health */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Classification Tier</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-bold">
                    <span>DETERMINISTIC (TOC)</span>
                    <span>82%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-900 h-full w-[82%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-bold">
                    <span>KEYWORD DICTIONARY</span>
                    <span>12%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-500 h-full w-[12%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-bold">
                    <span>LLM FALLBACK</span>
                    <span>6%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full w-[6%]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-xl shadow-sm p-4 flex-1">
              <h3 className="text-sm font-bold mb-4 uppercase tracking-wide">Active Workers</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center font-mono text-[10px]">W01</div>
                  <div>
                    <p className="text-xs font-bold">PDF EXTRACTOR</p>
                    <p className="text-[10px] text-slate-400">Processing Edition #212/23</p>
                  </div>
                  <div className="ml-auto flex gap-1">
                    <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center font-mono text-[10px]">W02</div>
                  <div>
                    <p className="text-xs font-bold">TG DELIVERY</p>
                    <p className="text-[10px] text-slate-400">Queue: 0 pending</p>
                  </div>
                  <div className="ml-auto flex gap-1 opacity-20">
                    <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-3 rounded bg-slate-800 border border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pipeline Status Log</p>
                <div className="font-mono text-[9px] text-slate-300 leading-relaxed">
                  [14:21] Poll: Edition check complete.<br/>
                  [14:21] GN 14023 identified: LAND.<br/>
                  [14:22] Subscriber match triggered for 12 IDs.<br/>
                  [14:22] Digest compiled. Ready for push.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
