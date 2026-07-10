// components/skeletons/FeedSkeleton.tsx
export default function FeedSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4 animate-pulse">

      {/* Skeleton dos filtros */}
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-8 w-20 bg-gray-200 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Skeleton dos cards */}
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="h-40 bg-gray-200 w-full" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}