'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircleFillIcon, CrossIcon } from './icons';
import { toast } from 'sonner';

interface ComplianceToggleProps {
  className?: string;
}

export function ComplianceToggle({ className }: ComplianceToggleProps) {
  const [isEnabled, setIsEnabled] = useState(true); // Default to enabled
  const [isLoading, setIsLoading] = useState(false);

  // Load current setting on mount
  useEffect(() => {
    const loadSetting = async () => {
      try {
        const response = await fetch('/api/compliance-setting');
        if (response.ok) {
          const data = await response.json();
          setIsEnabled(data.enabled);
        }
      } catch (error) {
        console.error('Failed to load compliance setting:', error);
      }
    };
    loadSetting();
  }, []);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const newState = !isEnabled;
      const response = await fetch('/api/compliance-setting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: newState }),
      });

      if (response.ok) {
        setIsEnabled(newState);
        toast.success(
          newState 
            ? 'Compliance checking enabled' 
            : 'Compliance checking disabled'
        );
      } else {
        toast.error('Failed to update compliance setting');
      }
    } catch (error) {
      toast.error('Failed to update compliance setting');
      console.error('Error updating compliance setting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isEnabled ? "default" : "outline"}
      size="sm"
      className={className}
      onClick={handleToggle}
      disabled={isLoading}
    >
      {isEnabled ? (
        <CheckCircleFillIcon size={16} />
      ) : (
        <CrossIcon size={16} />
      )}
      <span className="hidden sm:inline ml-2">
        {isLoading ? 'Updating...' : isEnabled ? 'Compliance On' : 'Compliance Off'}
      </span>
    </Button>
  );
} 