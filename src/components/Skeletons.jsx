export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-slate-800/50 rounded-t-xl mb-1" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-700/30 rounded m-3" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="h-12 border-t border-slate-800/30" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 bg-slate-700/20 rounded m-3" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 sm:p-4">
          <div className="w-5 h-5 bg-slate-700/30 rounded mb-3" />
          <div className="h-6 bg-slate-700/30 rounded w-16 mb-1" />
          <div className="h-3 bg-slate-700/20 rounded w-12" />
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
          <div className="h-4 bg-slate-700/30 rounded w-3/4 mb-2" />
          <div className="h-3 bg-slate-700/20 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12">
      {Icon && <Icon className="w-10 h-10 mx-auto mb-3 text-slate-600" />}
      <p className="text-slate-400 font-medium">{title}</p>
      {description && <p className="text-sm text-slate-600 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
