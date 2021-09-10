"use strict";
importScripts('https://cdn.jsdelivr.net/npm/moment/min/moment-with-locales.min.js', 'https://cdn.jsdelivr.net/npm/lodash/lodash.min.js');
var KakaoTalkChat;
(function (KakaoTalkChat) {
    let MessageEventType;
    (function (MessageEventType) {
        MessageEventType[MessageEventType["RAW_FILE"] = 0] = "RAW_FILE";
        MessageEventType[MessageEventType["PARSED"] = 1] = "PARSED";
    })(MessageEventType = KakaoTalkChat.MessageEventType || (KakaoTalkChat.MessageEventType = {}));
    let ChatType;
    (function (ChatType) {
        ChatType["MESSAGE"] = "message";
        ChatType["EVENT"] = "event";
    })(ChatType = KakaoTalkChat.ChatType || (KakaoTalkChat.ChatType = {}));
    let ChatEventType;
    (function (ChatEventType) {
        ChatEventType["JOIN"] = "join";
        ChatEventType["LEAVE"] = "leave";
        ChatEventType["BAN"] = "event";
    })(ChatEventType = KakaoTalkChat.ChatEventType || (KakaoTalkChat.ChatEventType = {}));
})(KakaoTalkChat || (KakaoTalkChat = {}));
const serviceWorkerSelf = self;
serviceWorkerSelf.addEventListener('install', (ev) => {
    console.log(ev.type, { ev });
});
serviceWorkerSelf.addEventListener('activate', (ev) => {
    console.log(ev.type, { ev });
});
serviceWorkerSelf.addEventListener('message', (ev) => {
    console.log(ev.type, { ev });
    const { data } = ev;
    const { type } = data;
    switch (type) {
        case KakaoTalkChat.MessageEventType.RAW_FILE: {
            const { rawFile } = data;
            const lines = rawFile.split('\r\n').map((line) => line.trim());
            const metadata = {};
            const chats = [];
            for (let line of lines) {
                if (line.endsWith(' 님과 카카오톡 대화')) {
                    const [_, chatTitle, memberCount] = line.match(/^(.*) (\d+) 님과 카카오톡 대화$/);
                    metadata.chatTitle = chatTitle;
                    metadata.memberCount = parseInt(memberCount);
                }
                else if (line.startsWith('저장한 날짜 : ')) {
                    const [_, savedAt, __] = line.match(/^저장한 날짜 : (\d+년 \d+월 \d+일 (오전|오후) \d+:\d+)$/);
                    metadata.savedAt = savedAt;
                }
                else {
                    const matched = line.match(/^(\d+년 \d+월 \d+일 (오전|오후) \d+:\d+)$/);
                    if (matched) {
                        const [_, joinedAt, __] = matched;
                        metadata.joinedAt = joinedAt;
                    }
                    else {
                        const matched = line.match(/^(\d+년 \d+월 \d+일 (오전|오후) \d+:\d+), ([^:]*) : (.*)$/);
                        if (matched) {
                            const [_, timestamp, __, name, text] = matched;
                            const message = {
                                type: KakaoTalkChat.ChatType.MESSAGE,
                                timestamp,
                                name,
                                text,
                            };
                            chats.push(message);
                        }
                        else {
                            const matched = line.match(/^(\d+년 \d+월 \d+일 (오전|오후) \d+:\d+), (.*)님(이|을) (들어왔습니다|나갔습니다|내보냈습니다)\.$/);
                            if (matched) {
                                const [_, timestamp, __, name, ___, eventText] = matched;
                                const eventTypeMap = {
                                    '들어왔습니다': KakaoTalkChat.ChatEventType.JOIN,
                                    '나갔습니다': KakaoTalkChat.ChatEventType.LEAVE,
                                    '내보냈습니다': KakaoTalkChat.ChatEventType.BAN,
                                };
                                const eventType = eventTypeMap[eventText];
                                const event = {
                                    type: KakaoTalkChat.ChatType.EVENT,
                                    timestamp,
                                    name,
                                    eventText,
                                    eventType,
                                };
                                chats.push(event);
                            }
                            else {
                                const chat = chats.slice(-1).shift();
                                if (chat && chat.type === KakaoTalkChat.ChatType.MESSAGE) {
                                    const chatMessage = chat;
                                    chatMessage.text += `\n${line}`;
                                }
                            }
                        }
                    }
                }
            }
            const [port2] = ev.ports;
            const chatData = {
                type: KakaoTalkChat.MessageEventType.PARSED,
                metadata, chats
            };
            port2.postMessage(chatData);
            break;
        }
    }
});
