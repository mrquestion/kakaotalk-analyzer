export var KakaoTalkChat;
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
