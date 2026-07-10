import FeedSkeleton from "@/components/skeletons/FeedSkeleton";

// app/anuncio/[id]/loading.tsx
export default function AnuncioLoading() {
  return (
    <div className=" bg-gray-light px-2">
      <FeedSkeleton />
    </div>
  )
}