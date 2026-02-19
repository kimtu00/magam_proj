'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ManualRetrainButton() {
  const [isRetraining, setIsRetraining] = useState(false);

  const handleRetrain = async () => {
    setIsRetraining(true);

    try {
      const response = await fetch('/api/admin/ml/retrain', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '재학습 실패');
      }

      const result = await response.json();
      
      toast.success('모델 재학습 시작', {
        description: result.message || '재학습이 시작되었습니다.',
      });

      if (result.instructions && Array.isArray(result.instructions)) {
        console.log('=== 재학습 안내 ===');
        result.instructions.forEach((instruction: string) => {
          console.log(instruction);
        });
      }

    } catch (error) {
      console.error('Retrain error:', error);
      toast.error('재학습 실패', {
        description: error instanceof Error ? error.message : '재학습을 시작할 수 없습니다.',
      });
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <Button 
      onClick={handleRetrain} 
      disabled={isRetraining}
      size="lg"
      className="w-full"
    >
      {isRetraining ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          재학습 중...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          수동 재학습 시작
        </>
      )}
    </Button>
  );
}
