'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SmsNotificationDialog } from './SmsNotificationDialog';
import { Crime } from '@/types/crime';

interface SmsNotificationButtonProps {
  filteredCrimes: Crime[];
  disabled?: boolean;
}

export function SmsNotificationButton({
  filteredCrimes,
  disabled,
}: SmsNotificationButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={disabled || filteredCrimes.length === 0}
        variant="outline"
        size="sm"
        className="absolute top-20 left-4 z-10 bg-black/80 backdrop-blur-sm text-white border-white/10 hover:bg-black/90"
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Text me the details
      </Button>

      <SmsNotificationDialog
        open={open}
        onOpenChange={setOpen}
        crimes={filteredCrimes}
      />
    </>
  );
}
