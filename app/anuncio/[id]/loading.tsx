import AdsSkeleton from "@/components/skeletons/AdsSkeleton";

// app/anuncio/[id]/loading.tsx
export default function AnuncioLoading() {
  return (
    <div className=" bg-gray-light px-2 h-full">
      <AdsSkeleton />
    </div>
  )
}