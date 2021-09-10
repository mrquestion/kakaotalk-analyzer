importScripts(
  'https://cdn.jsdelivr.net/npm/moment/min/moment-with-locales.min.js',
  'https://cdn.jsdelivr.net/npm/lodash/lodash.min.js',
);

namespace KakaoTalkChat {
  export enum MessageEventType {
    RAW_FILE,
    PARSED,
  }

  export interface MessageEventData {
    type: MessageEventType;
  }
  export interface RawFileData extends MessageEventData {
    rawFile: string;
  }

  export interface Metadata {
    chatTitle?: string;
    memberCount?: number;
    savedAt?: string;
    joinedAt?: string;
  }
  export enum ChatType {
    MESSAGE = 'message',
    EVENT = 'event',
  }
  export interface ChatMessage {
    type: ChatType.MESSAGE;
    timestamp: string;
    name: string;
    text: string;
  }
  export enum ChatEventType {
    JOIN = 'join',
    LEAVE = 'leave',
    BAN = 'event',
  }
  export type ChatEventTypeMap = { [key: string]: ChatEventType };
  export interface ChatEvent {
    type: ChatType.EVENT;
    timestamp: string;
    name: string;
    eventText: string;
    eventType: ChatEventType;
  }
  export type Chat = ChatEvent | ChatMessage;
  export interface ParsedChatData extends MessageEventData {
    metadata: Metadata;
    chats: Chat[];
  }
}
namespace ServiceWorker {
  export interface InstallEvent extends Event {
    waitUntil(promise: Promise<unknown>): Promise<void>;
  }
  export interface ActivateEvent extends Event {
    waitUntil(promise: Promise<unknown>): Promise<void>;
  }
  export interface EventMap {
    'install': InstallEvent;
    'activate': ActivateEvent;
  }
  export interface CustomSelf {
    addEventListener<K extends keyof EventMap>(type: K, listener: (this: typeof self, ev: EventMap[K]) => any): void;
    skipWaiting(): Promise<void>;
  }
  export type Self = typeof self & CustomSelf;
}

const serviceWorkerSelf = self as ServiceWorker.Self;
serviceWorkerSelf.addEventListener('install', (ev: ServiceWorker.InstallEvent) => {
  console.log(ev.type, {ev})
});
serviceWorkerSelf.addEventListener('activate', (ev: ServiceWorker.ActivateEvent) => {
  console.log(ev.type, {ev})
});
serviceWorkerSelf.addEventListener('message', (ev: MessageEvent<KakaoTalkChat.MessageEventData>) => {
  console.log(ev.type, {ev})
  const { data }: MessageEvent<KakaoTalkChat.MessageEventData> = ev;
  const { type }: KakaoTalkChat.MessageEventData = data;
  switch (type) {
    case KakaoTalkChat.MessageEventType.RAW_FILE: {
      const { rawFile } = data as KakaoTalkChat.RawFileData;
      const lines: string[] = rawFile.split('\r\n').map((line: string): string => line.trim());

      const metadata: KakaoTalkChat.Metadata = {};
      const chats: KakaoTalkChat.Chat[] = [];
      for (let line of lines) {
        if (line.endsWith(' 님과 카카오톡 대화')) {
          const [ _, chatTitle, memberCount ]: RegExpMatchArray = line.match(/^(.*) (\d+) 님과 카카오톡 대화$/)!;
          metadata.chatTitle = chatTitle;
          metadata.memberCount = parseInt(memberCount);
        } else if (line.startsWith('저장한 날짜 : ')) {
          const [ _, savedAt, __ ]: RegExpMatchArray = line.match(/^저장한 날짜 : (\d+년 \d+월 \d+일 (오전|오후) \d+:\d+)$/)!;
          metadata.savedAt = savedAt;
        } else {
          const matched: RegExpMatchArray | null = line.match(/^(\d+년 \d+월 \d+일 (오전|오후) \d+:\d+)$/);
          if (matched) {
            const [ _, joinedAt, __ ]: RegExpMatchArray = matched;
            metadata.joinedAt = joinedAt;
          } else {
            const matched: RegExpMatchArray | null = line.match(/^(\d+년 \d+월 \d+일 (오전|오후) \d+:\d+), ([^:]*) : (.*)$/);
            if (matched) {
              const [ _, timestamp, __, name, text ]: RegExpMatchArray = matched;
              const message: KakaoTalkChat.ChatMessage = {
                type: KakaoTalkChat.ChatType.MESSAGE,
                timestamp,
                name,
                text,
              };
              chats.push(message);
            } else {
              const matched: RegExpMatchArray | null = line.match(/^(\d+년 \d+월 \d+일 (오전|오후) \d+:\d+), (.*)님(이|을) (들어왔습니다|나갔습니다|내보냈습니다)\.$/);
              if (matched) {
                const [ _, timestamp, __, name, ___, eventText ]: RegExpMatchArray = matched;
                const eventTypeMap: KakaoTalkChat.ChatEventTypeMap = {
                  '들어왔습니다': KakaoTalkChat.ChatEventType.JOIN,
                  '나갔습니다': KakaoTalkChat.ChatEventType.LEAVE,
                  '내보냈습니다': KakaoTalkChat.ChatEventType.BAN,
                };
                const eventType = eventTypeMap[eventText];
                const event: KakaoTalkChat.ChatEvent = {
                  type: KakaoTalkChat.ChatType.EVENT,
                  timestamp,
                  name,
                  eventText,
                  eventType,
                };
                chats.push(event);
              } else {
                const chat: KakaoTalkChat.Chat | undefined = chats.slice(-1).shift();
                if (chat && chat.type === KakaoTalkChat.ChatType.MESSAGE) {
                  const chatMessage = chat as KakaoTalkChat.ChatMessage;
                  chatMessage.text += `\n${line}`;
                }
              }
            }
          }
        }
      }
      const [ port2 ]: readonly MessagePort[] = ev.ports;
      const chatData: KakaoTalkChat.ParsedChatData = {
        type: KakaoTalkChat.MessageEventType.PARSED,
        metadata, chats
      };
      port2.postMessage(chatData);
      break;
    }
  }
});
