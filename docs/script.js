import { KakaoTalkChat } from './interfaces.js';
import CryptoJS from './crypto-js.js';
const g = {
    groupByName: {},
};
window.addEventListener('load', async (ev) => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    registrations.forEach(async (registration) => await registration.unregister());
    const registration = await navigator.serviceWorker?.register('service-worker.js');
    const file = document.querySelector('#file');
    file.addEventListener('change', (ev) => {
        let t = performance.now();
        const label = document.querySelector('#input-file-label');
        const fileList = document.querySelector('#file')?.files;
        if (fileList.length > 0) {
            const file = Array.from(fileList).shift();
            label.innerText = file.name;
            const fileReader = new FileReader();
            fileReader.addEventListener('load', (ev) => {
                const { result } = fileReader;
                const rawFile = result;
                const data = {
                    type: KakaoTalkChat.MessageEventType.RAW_FILE,
                    rawFile,
                };
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (ev) => {
                    const { data } = ev;
                    if (data.type === KakaoTalkChat.MessageEventType.PARSED) {
                        const { metadata, chats } = data;
                        g.metadata = metadata;
                        g.chats = chats;
                        g.groupByName = {};
                        const progress = document.querySelector('progress');
                        progress.value = 100;
                        for (let chat of chats) {
                            // chat.time = moment(chat.timestamp, 'YYYY년 MM월 DD일 AA HH:mm', 'ko');
                            const matched = chat.timestamp.match(/^(\d+)년 (\d+)월 (\d+)일 (오전|오후) (\d+):(\d+)/);
                            if (matched) {
                                const [_, _year, _month, _day, _ampm, _hour, _minute] = matched;
                                const year = parseInt(_year);
                                const month = parseInt(_month);
                                const day = parseInt(_day);
                                let hour = parseInt(_hour);
                                if (_ampm === '오후') {
                                    hour += 12;
                                    hour %= 24;
                                }
                                else if (_ampm === '오전' && hour === 12) {
                                    hour -= 12;
                                }
                                const minute = parseInt(_minute);
                                const daysByMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31].slice(0, month - 1);
                                const days = daysByMonth.length > 0 ? daysByMonth.reduce((a, b) => a + b) : 0;
                                const time = (year - 1970) * 365.25 * 24 * 60 * 60 * 1000
                                    + days * 24 * 60 * 60 * 1000
                                    + (day - 1) * 24 * 60 * 60 * 1000
                                    + (hour - 3) * 60 * 60 * 1000
                                    + minute * 60 * 1000;
                                chat.time = new Date(time);
                            }
                            if (chat.type === KakaoTalkChat.ChatType.MESSAGE) {
                                if (!g.groupByName[chat.name]) {
                                    g.groupByName[chat.name] = [];
                                }
                                g.groupByName[chat.name].push(chat);
                            }
                        }
                        const fileResult = document.querySelector('#file-result');
                        fileResult.innerText = `'${metadata.chatTitle}' 채팅을 불러왔습니다.`;
                        const times = chats.map((chat) => chat.time?.getTime());
                        const timeGroups = [];
                        for (let i = 0; i < times.length; i += 100000) {
                            timeGroups.push(times.slice(i, i + 100000));
                        }
                        const minimumTime = new Date(Math.min(...timeGroups.map((times) => Math.min(...times))));
                        const maximumTime = new Date(Math.max(...timeGroups.map((times) => Math.max(...times))));
                        fileResult.innerText += `\n처음 날짜는   '${minimumTime.toLocaleString()}' 입니다.`;
                        fileResult.innerText += `\n마지막 날짜는 '${maximumTime.toLocaleString()}' 입니다.`;
                        fileResult.innerText += `\n${chats.length} 개의 메시지가 있습니다.`;
                        fileResult.innerText += `\n${Object.keys(g.groupByName).length} 명의 사용자가 있습니다.`;
                        const sortedGroup = [];
                        function getByteLength(text) {
                            let b = 0;
                            for (let i = 0, c = null; c = text.charCodeAt(i++); b += c >> 11 ? 3 : c >> 7 ? 2 : 1)
                                ;
                            return b;
                        }
                        for (let name in g.groupByName) {
                            const chats = g.groupByName[name];
                            let size = 0;
                            for (let chat of chats) {
                                if (chat.type === KakaoTalkChat.ChatType.MESSAGE) {
                                    size += getByteLength(chat.text);
                                }
                            }
                            sortedGroup.push({ name, count: chats.length, size });
                        }
                        sortedGroup.sort((a, b) => -(a.size - b.size));
                        function getByteFormat(size) {
                            let unit = 'B';
                            if (size > 1024) {
                                size /= 1024;
                                unit = 'KB';
                            }
                            if (size > 1024) {
                                size /= 1024;
                                unit = 'MB';
                            }
                            if (size > 1024) {
                                size /= 1024;
                                unit = 'GB';
                            }
                            if (size > 1024) {
                                size /= 1024;
                                unit = 'TB';
                            }
                            size = parseFloat(size.toFixed(2));
                            return `${size} ${unit}`;
                        }
                        const users = document.querySelector('#users');
                        while (users.firstChild) {
                            users.removeChild(users.firstChild);
                        }
                        for (let { name, count, size } of sortedGroup) {
                            const badge = document.createElement('span');
                            badge.className = 'badge';
                            const sha512 = CryptoJS.SHA512(name).toString();
                            badge.style.backgroundColor = `#${sha512.substr(0, 6)}33`;
                            badge.innerText = `${name}: ${count.toLocaleString()} (${getByteFormat(size)})`;
                            users.appendChild(badge);
                        }
                        // TODO: timeline
                        const timeline = document.querySelector('#timeline');
                        let nameMap = {};
                        for (let chat of chats) {
                            if (chat.type === KakaoTalkChat.ChatType.EVENT) {
                                const sorted = [];
                                for (let name in nameMap) {
                                    sorted.push({ name, count: nameMap[name] });
                                }
                                sorted.sort((a, b) => -(a.count - b.count));
                                for (let { name, count } of sorted) {
                                    const div = document.createElement('div');
                                    div.style.fontSize = '8px';
                                    div.innerText = `${name}: ${count}\n`;
                                    timeline.appendChild(div);
                                }
                                nameMap = {};
                                const event = document.createElement('div');
                                event.style.fontSize = '12px';
                                if (chat.eventType === KakaoTalkChat.ChatEventType.JOIN) {
                                    event.innerText = `${chat.name} 님이 들어왔습니다.`;
                                    event.style.backgroundColor = '#00f1';
                                }
                                else if (chat.eventType === KakaoTalkChat.ChatEventType.LEAVE) {
                                    event.innerText = `${chat.name} 님이 나갔습니다.`;
                                    event.style.backgroundColor = '#f001';
                                }
                                timeline.appendChild(event);
                            }
                            else if (chat.type === KakaoTalkChat.ChatType.MESSAGE) {
                                if (!nameMap[chat.name]) {
                                    nameMap[chat.name] = 0;
                                }
                                nameMap[chat.name]++;
                            }
                        }
                    }
                };
                const ports = [messageChannel.port2];
                navigator.serviceWorker.controller?.postMessage(data, ports);
            });
            fileReader.readAsText(file);
        }
        else {
            label.innerText = document.querySelector('#input-file-default')?.value;
        }
    });
    const search = document.querySelector('#search');
    search.addEventListener('click', (ev) => {
        const searchName = document.querySelector('#search-name')?.value.trim();
        const searchKeyword = document.querySelector('#search-keyword')?.value.trim();
        const searchKeywordExactMatch = document.querySelector('#search-keyword-exact-match')?.checked;
        let totalCount = 0;
        let searchCount = 0;
        const chats = g.groupByName[searchName];
        for (let chat of chats) {
            if (chat.type === KakaoTalkChat.ChatType.MESSAGE) {
                totalCount++;
                if (searchKeywordExactMatch && chat.text === searchKeyword) {
                    searchCount++;
                }
                else if (!searchKeywordExactMatch && chat.text.includes(searchKeyword)) {
                    searchCount++;
                }
            }
        }
        const searchResult = document.querySelector('#search-result');
        searchResult.innerText = `${searchName} 님께서`
            + ` 보낸 전체 메시지 수는 ${totalCount} 번 입니다.`;
        if (searchKeywordExactMatch) {
            searchResult.innerText += `\n${searchName} 님께서 '${searchKeyword}' 단어만 사용하신 횟수는 ${searchCount} 번 입니다.`;
        }
        else {
            searchResult.innerText += `\n${searchName} 님께서 '${searchKeyword}' 단어를 사용하신 횟수는 ${searchCount} 번 입니다.`;
        }
    });
    registration.addEventListener('updatefound', (ev) => {
        console.log(ev.type);
    });
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.addEventListener('statechange', (ev) => {
            console.log(ev.type);
        });
        navigator.serviceWorker.controller.addEventListener('error', (ev) => {
            console.log(ev.type);
        });
    }
});
