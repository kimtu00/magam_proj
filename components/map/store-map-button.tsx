'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KakaoMap } from './kakao-map';
import { MapPin } from 'lucide-react';

interface StoreMapButtonProps {
  storeName: string;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
}

export function StoreMapButton({
  storeName,
  address,
  phone,
  latitude,
  longitude,
}: StoreMapButtonProps) {
  const [open, setOpen] = useState(false);

  // 위치 정보가 없으면 렌더링하지 않음
  if (!latitude || !longitude) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          title="지도에서 보기"
        >
          <MapPin className="h-5 w-5 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {storeName}
          </DialogTitle>
          <DialogDescription>
            {address && <span className="block">{address}</span>}
            {phone && <span className="block mt-1">전화: {phone}</span>}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 지도 */}
          <KakaoMap
            latitude={latitude}
            longitude={longitude}
            storeName={storeName}
            address={address || undefined}
            className="w-full h-96 rounded-lg"
          />

          {/* 액션 버튼들 */}
          <div className="grid grid-cols-2 gap-3">
            {/* 전화 걸기 */}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                📞 전화 걸기
              </a>
            )}
            
            {/* 카카오맵 길찾기 */}
            <a
              href={`https://map.kakao.com/link/to/${storeName},${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent/90 transition-colors ${!phone ? 'col-span-2' : ''}`}
            >
              🗺️ 길찾기
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


