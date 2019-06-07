onmessage = e => {
  const result = e.data;
  postMessage({ type: 'status', currentStatus: 1 });
  const base64 = result.replace('data:text/plain;base64,', '');
  postMessage({ type: 'status', currentStatus: 2 });
  const text = atob(base64);
  postMessage({ type: 'status', currentStatus: 3 });
  const lines = text.split('\r\n');
  postMessage({ type: 'status', currentStatus: 4 });

  postMessage({ type: 'log', currentLine: 0, totalLine: lines.length });
  const chats = [];
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];
    if (line.indexOf('201') < 0) {

    } else {
      const firstComma = line.indexOf(', ');
      if (firstComma < 0) {

      } else {
        const timestamp = line.substring(0, firstComma);
        const firstColon = line.indexOf(' : ', firstComma + 2);
        if (firstColon < 0) {
          const text = line;
          chats.push({ timestamp, text });
        } else {
          const name = line.substring(firstComma + 2, firstColon);
          const text = line.substring(firstColon + 3);
          chats.push({ timestamp, name, text });
        }
      }
    }

    if (i % 1000 === 0) {
      postMessage({ type: 'log', currentLine: i, totalLine: lines.length });
    }
  }
  postMessage({ type: 'log', currentLine: lines.length, totalLine: lines.length });
  postMessage({ type: 'status', currentStatus: 5 });
  postMessage({ type: 'data', chats });
};
