import React from 'react';

export default function LabMetrics({ metrics = {}, loading = false, activeFilter, onFilterSelect }) {
  const cards = [
    {
      id: 'Ordered',
      label: 'Tests Ordered',
      value: metrics.Ordered ?? 0,
      description: 'Awaiting sample collection',
      theme: {
        border: 'border-sky-200',
        bg: 'bg-white',
        activeBg: 'ring-2 ring-sky-500 bg-sky-50/40',
        iconBg: 'bg-sky-100 text-sky-600',
        text: 'text-sky-800',
        badge: 'bg-sky-50 text-sky-700 border-sky-200',
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      id: 'SampleCollected',
      label: 'Samples Collected',
      value: metrics.SampleCollected ?? 0,
      description: 'Ready for batch analysis',
      theme: {
        border: 'border-teal-200',
        bg: 'bg-white',
        activeBg: 'ring-2 ring-teal-500 bg-teal-50/40',
        iconBg: 'bg-teal-100 text-teal-600',
        text: 'text-teal-800',
        badge: 'bg-teal-50 text-teal-700 border-teal-200',
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      id: 'Processing',
      label: 'In Processing',
      value: metrics.Processing ?? 0,
      description: 'Under active diagnostics',
      theme: {
        border: 'border-amber-200',
        bg: 'bg-white',
        activeBg: 'ring-2 ring-amber-500 bg-amber-50/40',
        iconBg: 'bg-amber-100 text-amber-600',
        text: 'text-amber-800',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'Completed',
      label: 'Reports Ready',
      value: metrics.Completed ?? 0,
      description: 'Verified & released to patient',
      theme: {
        border: 'border-emerald-200',
        bg: 'bg-white',
        activeBg: 'ring-2 ring-emerald-500 bg-emerald-50/40',
        iconBg: 'bg-emerald-100 text-emerald-600',
        text: 'text-emerald-800',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isSelected = activeFilter === card.id;
        return (
          <div
            key={card.id}
            onClick={() => onFilterSelect && onFilterSelect(card.id)}
            role="button"
            tabIndex={0}
            className={`rounded-2xl border ${card.theme.border} p-5 shadow-xs transition-all cursor-pointer select-none hover:-translate-y-0.5 hover:shadow-md ${
              isSelected ? card.theme.activeBg : card.theme.bg
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={`w-12 h-12 rounded-xl ${card.theme.iconBg} flex items-center justify-center shrink-0 shadow-xs`}
              >
                {card.icon}
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${card.theme.badge}`}>
                {isSelected ? 'Active Filter' : 'Filter'}
              </span>
            </div>

            <div className="mt-4 space-y-1">
              <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                {card.label}
              </p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold ${card.theme.text} tracking-tight`}>
                  {loading ? (
                    <span className="inline-block w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin align-middle" />
                  ) : (
                    card.value
                  )}
                </span>
                <span className="text-xs text-slate-400">cases</span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal truncate">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
