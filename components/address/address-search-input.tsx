"use client";

import { useState } from "react";
import { Search, MapPin, Loader2, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * 카카오 API 주소 검색 결과 타입
 */
interface KakaoAddressResult {
  address_name: string;
  address_type: string;
  x: number; // 경도
  y: number; // 위도
  road_address: {
    address_name: string;
    building_name?: string;
    zone_no: string;
  } | null;
}

/**
 * 선택된 주소 정보 타입
 */
interface SelectedAddressInfo {
  baseAddress: string;
  latitude: number;
  longitude: number;
  buildingName?: string;
}

interface AddressSearchInputProps {
  value?: string;
  onAddressSelect: (address: string, latitude: number, longitude: number) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** 상세주소 입력을 필수로 할지 여부 (기본: false) */
  detailRequired?: boolean;
}

/**
 * 주소 검색 입력 컴포넌트
 *
 * 카카오 주소 검색 API를 사용하여 주소를 검색하고 선택할 수 있습니다.
 * 주소 선택 후 상세주소(동/호수 등)를 입력받는 2단계 프로세스입니다.
 *
 * 사장님 가게 등록과 소비자 주소 설정 모두에서 사용됩니다.
 *
 * @example
 * ```tsx
 * <AddressSearchInput
 *   value={address}
 *   onAddressSelect={(address, lat, lng) => {
 *     setAddress(address);
 *     setLatitude(lat);
 *     setLongitude(lng);
 *   }}
 *   placeholder="주소를 검색해주세요"
 *   required
 * />
 * ```
 */
export function AddressSearchInput({
  value,
  onAddressSelect,
  placeholder = "주소 검색하기",
  disabled = false,
  required = false,
  detailRequired = false,
}: AddressSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<KakaoAddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 2단계: 상세주소 입력
  const [step, setStep] = useState<"search" | "detail">("search");
  const [selectedAddress, setSelectedAddress] = useState<SelectedAddressInfo | null>(null);
  const [detailAddress, setDetailAddress] = useState("");

  // 다이얼로그 열기/닫기
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // 닫을 때 초기화
      resetState();
    }
  };

  // 상태 초기화
  const resetState = () => {
    setStep("search");
    setSearchQuery("");
    setResults([]);
    setError(null);
    setSelectedAddress(null);
    setDetailAddress("");
  };

  // 검색 실행
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("검색어를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/address/search?query=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error("주소 검색에 실패했습니다.");
      }

      const data = await response.json();

      if (data.documents.length === 0) {
        setError("검색 결과가 없습니다. 다른 검색어를 입력해주세요.");
        setResults([]);
      } else {
        setResults(data.documents);
      }
    } catch (err) {
      console.error("주소 검색 에러:", err);
      setError("주소 검색 중 오류가 발생했습니다.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 주소 선택 (1단계 → 2단계)
  const handleSelectAddress = (result: KakaoAddressResult) => {
    const baseAddress = result.road_address?.address_name || result.address_name;
    
    setSelectedAddress({
      baseAddress,
      latitude: result.y,
      longitude: result.x,
      buildingName: result.road_address?.building_name,
    });
    
    // 건물명이 있으면 상세주소에 미리 채우기
    if (result.road_address?.building_name) {
      setDetailAddress(result.road_address.building_name);
    }
    
    setStep("detail");
  };

  // 뒤로가기 (2단계 → 1단계)
  const handleBack = () => {
    setStep("search");
    setSelectedAddress(null);
    setDetailAddress("");
  };

  // 주소 확정 (최종)
  const handleConfirm = () => {
    if (!selectedAddress) return;

    // 상세주소 필수 체크
    if (detailRequired && !detailAddress.trim()) {
      setError("상세주소를 입력해주세요.");
      return;
    }

    // 기본주소 + 상세주소 합치기
    const finalAddress = detailAddress.trim()
      ? `${selectedAddress.baseAddress} ${detailAddress.trim()}`
      : selectedAddress.baseAddress;

    onAddressSelect(
      finalAddress,
      selectedAddress.latitude,
      selectedAddress.longitude
    );
    
    handleOpenChange(false);
  };

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (step === "search") {
        handleSearch();
      } else {
        handleConfirm();
      }
    }
  };

  return (
    <>
      {/* 주소 표시 및 검색 버튼 */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          className="w-full justify-start text-left font-normal"
        >
          <MapPin className="mr-2 h-4 w-4" />
          {value || placeholder}
        </Button>
        {value && (
          <p className="text-sm text-muted-foreground px-1">
            {value}
          </p>
        )}
      </div>

      {/* 주소 검색 다이얼로그 */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === "search" ? "주소 검색" : "상세주소 입력"}
            </DialogTitle>
            <DialogDescription>
              {step === "search" 
                ? "검색할 주소를 입력하고 검색 버튼을 클릭하세요."
                : "상세주소(동/호수, 층수 등)를 입력해주세요."
              }
            </DialogDescription>
          </DialogHeader>

          {/* 1단계: 주소 검색 */}
          {step === "search" && (
            <div className="space-y-4">
              {/* 검색 입력 */}
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="예: 서울시 강남구 역삼동"
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleSearch}
                  disabled={isLoading || !searchQuery.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* 검색 결과 */}
              {results.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    검색 결과 ({results.length}건)
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectAddress(result)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors",
                          "focus:outline-none focus:ring-2 focus:ring-ring"
                        )}
                      >
                        <div className="space-y-1">
                          {result.road_address && (
                            <p className="font-medium">
                              [도로명] {result.road_address.address_name}
                            </p>
                          )}
                          <p className={cn(
                            result.road_address ? "text-sm text-muted-foreground" : "font-medium"
                          )}>
                            [지번] {result.address_name}
                          </p>
                          {result.road_address?.building_name && (
                            <p className="text-xs text-muted-foreground">
                              {result.road_address.building_name}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2단계: 상세주소 입력 */}
          {step === "detail" && selectedAddress && (
            <div className="space-y-4">
              {/* 뒤로가기 버튼 */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-0 h-auto hover:bg-transparent"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                다시 검색
              </Button>

              {/* 선택한 기본 주소 표시 */}
              <div className="rounded-lg bg-muted p-4 space-y-1">
                <p className="text-xs text-muted-foreground font-medium">
                  선택한 주소
                </p>
                <p className="font-medium">{selectedAddress.baseAddress}</p>
                {selectedAddress.buildingName && (
                  <p className="text-sm text-muted-foreground">
                    {selectedAddress.buildingName}
                  </p>
                )}
              </div>

              {/* 상세주소 입력 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  상세주소 {detailRequired && <span className="text-destructive">*</span>}
                </label>
                <Input
                  value={detailAddress}
                  onChange={(e) => {
                    setDetailAddress(e.target.value);
                    setError(null);
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="예: 101동 202호, 3층 301호"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  동/호수, 층수, 상호명 등을 입력해주세요.
                </p>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* 최종 주소 미리보기 */}
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-1">
                <p className="text-xs text-muted-foreground font-medium">
                  최종 주소
                </p>
                <p className="font-medium text-primary">
                  {detailAddress.trim()
                    ? `${selectedAddress.baseAddress} ${detailAddress.trim()}`
                    : selectedAddress.baseAddress
                  }
                </p>
              </div>

              {/* 확정 버튼 */}
              <Button
                type="button"
                onClick={handleConfirm}
                className="w-full"
              >
                <Check className="h-4 w-4 mr-2" />
                주소 확정하기
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

