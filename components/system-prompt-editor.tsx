'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MoreIcon } from './icons';
import { toast } from 'sonner';

interface SystemPromptEditorProps {
  className?: string;
}

export function SystemPromptEditor({ className }: SystemPromptEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load current prompt when dialog opens
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open) {
      try {
        const response = await fetch('/api/system-prompt');
        if (response.ok) {
          const data = await response.json();
          setCurrentPrompt(data.prompt);
        }
      } catch (error) {
        console.error('Failed to load system prompt:', error);
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/system-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: currentPrompt }),
      });

      if (response.ok) {
        toast.success('System prompt updated successfully!');
        setIsOpen(false);
      } else {
        toast.error('Failed to update system prompt');
      }
    } catch (error) {
      toast.error('Failed to update system prompt');
      console.error('Error saving system prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentPrompt('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className}
        >
          <MoreIcon size={16} />
          <span className="hidden sm:inline ml-2">System Prompt</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit System Prompt</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="flex flex-col gap-2">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              placeholder="Enter your custom system prompt here..."
              className="min-h-[400px] resize-none"
            />
          </div>
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              Clear
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 