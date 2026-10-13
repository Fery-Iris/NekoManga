async function checkPages() {
  for (let p = 1; p <= 12; p++) {
    const res = await fetch(`https://r.jina.ai/https://api.komiku.org/page/${p}/?post_type=manga&s=kingdom`, { headers: { 'X-Return-Format': 'html' } });
    const text = await res.text();
    const titleMatch = text.match(/<h3>(.*?)<\/h3>/);
    console.log(`Page ${p}: status ${res.status}, title: ${titleMatch ? titleMatch[1] : 'NONE'}`);
  }
}
checkPages();
