"use client";

import { useState, useEffect } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AddressSearchInput } from "./address-search-input";
import { updateBuyerAddress, type BuyerAddress } from "@/actions/address";
import { useRouter } from "next/navigation";

interface BuyerAddressHeaderProps {
  initialAddress: BuyerAddress | null;
}

/**
 * 소비자 메인 상단 주소 표시 컴포넌트
 *
 * 현재 설정된 주소를 표시하고, 클릭 시 주소를 변경할 수 있습니다.
 * 주소가 설정되지 않은 경우 "주소를 설정해주세요" 메시지를 표시합니다.
 */
export function BuyerAddressHeader({
  initialAddress,
}: BuyerAddressHeaderProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState<string | null>(
    initialAddress?.address || null
  );
  const [latitude, setLatitude] = useState<number | null>(
    initialAddress?.latitude || null
  );
  const [longitude, setLongitude] = useState<number | null>(
    initialAddress?.longitude || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(3); // 기본값 3km

  // 주소 미설정 시 자동으로 다이얼로그 열기
  useEffect(() => {
    if (!initialAddress) {
      setIsOpen(true);
    }
  }, [initialAddress]);

  // localStorage에서 반경 로드
  useEffect(() => {
    const saved = localStorage.getItem("searchRadiusKm");
    if (saved) {
      const parsed = parseInt(saved);
      if ([1, 3, 5].includes(parsed)) {
        setRadiusKm(parsed);
      }
    }
  }, []);

  // 반경 변경 핸들러
  const handleRadiusChange = (value: string) => {
    const newRadius = parseInt(value);
    setRadiusKm(newRadius);
    localStorage.setItem("searchRadiusKm", value);
    
    // 같은 창의 다른 컴포넌트에 알림 (커스텀 이벤트)
    window.dispatchEvent(new Event("storage"));
  };

  // 현재 위치 사용 핸들러
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("이 브라우저는 위치 서비스를 지원하지 않습니다.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        try {
          // Kakao Maps Geocoding API로 좌표 → 주소 변환
          const response = await fetch(
            `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
            {
              headers: {
                Authorization: `KakaoAK ${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}`,
              },
            }
          );
          
          if (!response.ok) {
            throw new Error("주소 변환 API 호출 실패");
          }
          
          const data = await response.json();
          
          if (!data.documents || data.documents.length === 0) {
            setError("현재 위치의 주소를 찾을 수 없습니다.");
            setIsSubmitting(false);
            return;
          }
          
          const addressName = data.documents[0]?.address?.address_name || 
                              data.documents[0]?.road_address?.address_name || 
                              "현재 위치";
          
          setAddress(addressName);
          setLatitude(lat);
          setLongitude(lng);
          setError(null);
        } catch (err) {
          console.error("주소 변환 실패:", err);
          setError("현재 위치를 주소로 변환할 수 없습니다. 주소를 직접 검색해주세요.");
        } finally {
          setIsSubmitting(false);
        }
      },
      (error) => {
        setIsSubmitting(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError("위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.");
            break;
          case error.POSITION_UNAVAILABLE:
            setError("위치 정보를 사용할 수 없습니다. 주소를 직접 검색해주세요.");
            break;
          case error.TIMEOUT:
            setError("위치 정보 요청 시간이 초과되었습니다. 다시 시도하거나 주소를 직접 검색해주세요.");
            break;
          default:
            setError("위치를 가져오는 중 오류가 발생했습니다. 주소를 직접 검색해주세요.");
        }
      },
      {
        enableHighAccuracy: true, // 정확도 우선 (GPS 사용)
        timeout: 10000, // 10초 타임아웃
        maximumAge: 0, // 캐시 사용 안 함
      }
    );
  };

  const handleSaveAddress = async () => {
    if (!address || !latitude || !longitude) {
      setError("주소를 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateBuyerAddress(address, latitude, longitude);

      if (!result.success) {
        setError((result as { success: false; error: string }).error || "주소 저장에 실패했습니다.");
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      console.error("주소 저장 에러:", err);
      setError("주소 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full border-b bg-background">
      {/* 주소 표시 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="font-medium">
            {address || "주소를 설정해주세요"}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* 반경 선택 (주소가 설정된 경우만 표시) */}
      {initialAddress && (
        <div className="px-4 py-2 flex items-center gap-2 text-sm border-t">
          <span className="text-muted-foreground">검색 반경:</span>
          <Select value={String(radiusKm)} onValueChange={handleRadiusChange}>
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1km</SelectItem>
              <SelectItem value="3">3km</SelectItem>
              <SelectItem value="5">5km</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 주소 설정 다이얼로그 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="max-w-md"
          onPointerDownOutside={(e) => {
            // 주소가 설정되지 않은 경우 다이얼로그 닫기 방지 (강제 설정)
            if (!initialAddress) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>주소 설정</DialogTitle>
            <DialogDescription>
              {initialAddress
                ? "주소를 변경하려면 아래에서 새로운 주소를 검색하세요."
                : "서비스를 이용하려면 주소를 설정해주세요. 설정하신 주소 근처 가게의 상품을 보여드립니다."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <AddressSearchInput
              value={address || ""}
              onAddressSelect={(newAddress, lat, lng) => {
                setAddress(newAddress);
                setLatitude(lat);
                setLongitude(lng);
                setError(null);
              }}
              placeholder="주소를 검색해주세요"
              required
            />

            {/* 현재 위치 사용 버튼 */}
            <Button
              type="button"
              variant="outline"
              onClick={handleUseCurrentLocation}
              disabled={isSubmitting}
              className="w-full"
            >
              <MapPin className="mr-2 h-4 w-4" />
              {isSubmitting ? "위치 확인 중..." : "현재 위치 사용"}
            </Button>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              {initialAddress && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  취소
                </Button>
              )}
              <Button
                type="button"
                onClick={handleSaveAddress}
                disabled={isSubmitting || !address}
                className="flex-1"
              >
                {isSubmitting ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

