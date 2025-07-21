import {
  type UIMessage,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { checkCompliance, generateCompliantResponse } from '@/lib/ai/compliance-checker';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

export const maxDuration = 60;

async function isComplianceEnabled(): Promise<boolean> {
  try {
    const STORAGE_DIR = join(process.cwd(), 'data');
    const SETTING_FILE = join(STORAGE_DIR, 'compliance-setting.json');
    
    if (existsSync(SETTING_FILE)) {
      const data = await readFile(SETTING_FILE, 'utf-8');
      const setting = JSON.parse(data);
      return setting.enabled !== false; // Default to true if not explicitly false
    }
    return true; // Default to enabled
  } catch (error) {
    console.error('Failed to read compliance setting:', error);
    return true; // Default to enabled on error
  }
}

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
    } = await request.json();

    const session = await auth();

    // Skip auth check for personal use - create a dummy session
    const actualSession = session || {
      user: { id: 'personal-user', email: 'personal@localhost' }
    } as any;

    // if (!session?.user?.id) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id });

    let chatSaveSuccess = true;
    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      const saveResult = await saveChat({ id, userId: actualSession.user.id, title });
      chatSaveSuccess = saveResult.success;
    } else {
      if (chat.userId !== actualSession.user.id) {
        return new Response('Forbidden', { status: 403 });
      }
    }

    // Only save messages if chat was saved successfully or already exists
    if (chatSaveSuccess || chat) {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: userMessage.id,
            role: 'user',
            parts: userMessage.parts,
            attachments: userMessage.experimental_attachments ?? [],
            createdAt: new Date(),
          },
        ],
      });
    }

    return createDataStreamResponse({
      execute: async (dataStream) => {
        const systemPromptText = await systemPrompt({ selectedChatModel });
        
        // Helper function to generate response with compliance checking
        const generateWithCompliance = async (attempt = 1, maxAttempts = 3): Promise<void> => {
          const result = streamText({
            model: myProvider.languageModel(selectedChatModel),
            system: systemPromptText,
            messages,
            maxSteps: 5,
            experimental_activeTools:
              selectedChatModel === 'chat-model-reasoning'
                ? []
                : [
                    'getWeather',
                    'createDocument',
                    'updateDocument',
                    'requestSuggestions',
                  ],
            experimental_transform: smoothStream({ chunking: 'word' }),
            experimental_generateMessageId: generateUUID,
            tools: {
              getWeather,
              createDocument: createDocument({ session: actualSession, dataStream }),
              updateDocument: updateDocument({ session: actualSession, dataStream }),
              requestSuggestions: requestSuggestions({
                session: actualSession,
                dataStream,
              }),
            },
            experimental_telemetry: {
              isEnabled: isProductionEnvironment,
              functionId: 'stream-text',
            },
          });

          // Collect the full response for compliance checking
          let fullResponse = '';
          const { textStream } = result;
          
          for await (const chunk of textStream) {
            fullResponse += chunk;
          }

          // Check compliance for dialectical debate system (if enabled)
          const complianceEnabled = await isComplianceEnabled();
          if (selectedChatModel === 'chat-model-reasoning' && complianceEnabled) {
            // Extract text content from user message
            let userContent = '';
            if (typeof userMessage.content === 'string') {
              userContent = userMessage.content;
            } else if (userMessage.content && (userMessage.content as any).length) {
              userContent = (userMessage.content as any)
                .filter((part: any) => part.type === 'text')
                .map((part: any) => part.text)
                .join(' ');
            }
            
            const complianceResult = await checkCompliance(userContent, fullResponse);
            
            if (!complianceResult.isCompliant && attempt < maxAttempts) {
              console.log(`Attempt ${attempt}: Non-compliant response detected: ${complianceResult.reason}`);
              
              // Notify user that we're regenerating for compliance
              dataStream.writeData({
                type: 'text-delta',
                content: '\n\n*[Regenerating response to comply with debate rules...]*\n\n',
              });
              
              // Generate a compliant response
              const conversationHistory = messages.map(msg => {
                let content = '';
                if (typeof msg.content === 'string') {
                  content = msg.content;
                } else if (msg.content && (msg.content as any).length) {
                  content = (msg.content as any)
                    .filter((part: any) => part.type === 'text')
                    .map((part: any) => part.text)
                    .join(' ');
                }
                return { role: msg.role, content };
              });
              
              const compliantResponse = await generateCompliantResponse(
                userContent,
                fullResponse,
                systemPromptText,
                complianceResult.reason || 'Response not compliant with debate rules',
                conversationHistory
              );
              
              // Stream the compliant response
              for (const char of compliantResponse) {
                dataStream.writeData({
                  type: 'text-delta',
                  content: char,
                });
                // Small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 20));
              }
              
              fullResponse = compliantResponse;
            } else if (!complianceResult.isCompliant) {
              console.log(`Max attempts reached. Using response: ${fullResponse}`);
              // Stream the final response even if not compliant
              for (const char of fullResponse) {
                dataStream.writeData({
                  type: 'text-delta',
                  content: char,
                });
                await new Promise(resolve => setTimeout(resolve, 20));
              }
            } else {
              // Response is compliant, stream it
              for (const char of fullResponse) {
                dataStream.writeData({
                  type: 'text-delta',
                  content: char,
                });
                await new Promise(resolve => setTimeout(resolve, 20));
              }
            }
          } else if (selectedChatModel === 'chat-model-reasoning' && !complianceEnabled) {
            // Reasoning model with compliance disabled - show indicator
            const indicator = '*[Compliance checking disabled - free-form response]*\n\n';
            for (const char of indicator) {
              dataStream.writeData({
                type: 'text-delta',
                content: char,
              });
              await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            // Then stream the actual response
            for (const char of fullResponse) {
              dataStream.writeData({
                type: 'text-delta',
                content: char,
              });
              await new Promise(resolve => setTimeout(resolve, 20));
            }
          } else {
            // For non-reasoning models, just stream the response normally
            for (const char of fullResponse) {
              dataStream.writeData({
                type: 'text-delta',
                content: char,
              });
              await new Promise(resolve => setTimeout(resolve, 20));
            }
          }

          // Save the message if user is authenticated and chat exists
          if (actualSession.user?.id && (chatSaveSuccess || chat)) {
            try {
              const assistantId = generateUUID();
              await saveMessages({
                messages: [
                  {
                    id: assistantId,
                    chatId: id,
                    role: 'assistant',
                    parts: [{ type: 'text', text: fullResponse }],
                    attachments: [],
                    createdAt: new Date(),
                  },
                ],
              });
            } catch (error) {
              console.error('Failed to save chat:', error);
            }
          }
        };

        await generateWithCompliance();
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      return new Response('Forbidden', { status: 403 });
    }

    const deletedChat = await deleteChatById({ id });

    return Response.json(deletedChat, { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
