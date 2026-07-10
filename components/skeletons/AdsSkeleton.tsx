// components/skeletons/FeedSkeleton.tsx
export default function AdsSkeleton() {
  return (
    <div className="bg-white max-w-lg mx-auto px-2 py-6 space-y-4 animate-pulse">
      <div className="bg-white rounded-xl mt-20 h-full shadow-sm overflow-hidden">
        <div className="h-60 bg-gray-200 w-full flex gap-2 mt-2 px-2" />
        
        <div className="w-full flex gap-2 px-2">
          {[1, 2].map(i => (
            <div key={i} className="h-16 w-16 mt-6 bg-gray-200 m-2" />
          ))}
        </div>
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4 h-8" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}