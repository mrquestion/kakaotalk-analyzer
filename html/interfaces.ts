import moment from './moment.js';

export namespace KakaoTalkChat {
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
    // time?: moment.Moment;
    time?: Date;
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
    // time?: moment.Moment;
    time?: Date;
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
