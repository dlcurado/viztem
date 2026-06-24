'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { logEvent } from '@/lib/analytics'; // Se você tiver uma função de log de eventos

interface Banner {
  id: string;
  titulo: string;
  descricao: string;
  tipo_preco: string; // Ou o tipo mais específico
  contact_url: string | null;
  foto_capa: string | null;
}

interface RegionalBannerCarouselProps {
  banners: Banner[];
}

export default function RegionalBannerCarousel({ banners }: RegionalBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return; // Não auto-rotaciona se houver 0 ou 1 banner

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000); // Rotação a cada 5 segundos

    return () => clearInterval(interval);
  }, [banners.length]);

  if (!banners || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  const handleBannerClick = (bannerId: string, contactUrl: string | null) => {
    logEvent('click_regional_banner', { banner_id: bannerId, destination_url: contactUrl || 'none' });
    // Se contact_url existe, o Link já vai navegar. Se não, pode ser um anúncio interno.
  };

  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {banners.map((banner, index) => (
          <div key={banner.id} className="w-full flex-shrink-0 h-36 overflow-hidden">
            <Link
              href={banner.contact_url || `/anuncio/${banner.id}`} // Link para URL externa ou para o detalhe do anúncio
              target={banner.contact_url ? "_blank" : "_self"}
              rel={banner.contact_url ? "noopener noreferrer" : ""}
              onClick={() => handleBannerClick(banner.id, banner.contact_url)}
              className="absolute w-full h-full"
            >
              <div className="absolute w-full h-full text-right overflow-hidden">
                {banner.foto_capa ? (
                  <Image
                    src={banner.foto_capa}
                    alt={banner.titulo}
                    className="absolute rounded-full z-10 ml-2 mt-2 shadow-md shadow-mist-800 h-28"
                    width={110}
                    height={110}
                  />
                ) : (
                  <div className="text-gray-400 text-3xl">
                    {banner.titulo.substring(0, 10)}...
                  </div>
                )}
                <div className="absolute top-0 left-0 right-0 mt-4 ml-20 mr-6 p-2 text-right rounded-r-lg bg-primary">
                  <h1 className="text-gray-100 text-lg">{banner.titulo}</h1>
                  <p className="text-gray-200 line-clamp-2  ml-8">{banner.descricao.substring(0, 56)}...</p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Navegação manual (opcional) */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full ${index === currentIndex ? 'bg-white' : 'bg-gray-400'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}