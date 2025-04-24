'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import { UseChatHelpers } from '@ai-sdk/react';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'Analyze the claim',
      label: 'that all sentient beings have Buddha-nature',
      action: "I'd like to analyze the claim that 'all sentient beings have Buddha-nature' using Buddhist logical reasoning. Can you help me construct a valid argument with proper evidence and pervasion?",
    },
    {
      title: 'Explain how to prove',
      label: 'impermanence with the three modes of evidence',
      action: "In Buddhist philosophy, can you explain how we might prove impermanence using the three modes of correct evidence? I'm particularly interested in understanding how nature-evidence works in this context.",
    },
    {
      title: 'Break down the inference',
      label: 'of fire on the mountain from smoke',
      action: "I've heard the classic example 'there is fire on the mountain because there is smoke.' Could you break down this inference using the formal structure of Buddhist logic and explain why it constitutes valid knowledge?",
    },
    {
      title: 'Analyze the statement',
      label: 'that mind is non-physical using Buddhist logic',
      action: "How would Buddhist logic analyze the statement 'mind is non-physical because it lacks material characteristics'? Does this argument satisfy the three modes of correct evidence?",
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
