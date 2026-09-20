import { Fragment } from "react";

/*
 * Văn bản trả lời của trợ lý: agent viết markdown tối giản (**đậm**, dòng "- " gạch đầu dòng). Không dùng thư viện
 * markdown, không dựng HTML từ chuỗi — chỉ tách chuỗi thành node React nên không có đường cho XSS.
 */
function dam(dong: string, key: string) {
  const phan = dong.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return phan.map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={`${key}-${i}`}>{p.slice(2, -2)}</strong> : <Fragment key={`${key}-${i}`}>{p}</Fragment>));
}

export function ChatText({ text }: { text: string }) {
  const dongs = text.replace(/\r/g, "").split("\n").map((d) => d.replace(/\s+$/, ""));
  return (
    <>
      {dongs.map((d, i) => {
        const li = /^[-•]\s+/.test(d);
        return (
          <Fragment key={i}>
            {i > 0 && !li && "\n"}
            {li ? <span className="chat-li">{dam(d.replace(/^[-•]\s+/, ""), String(i))}</span> : dam(d, String(i))}
          </Fragment>
        );
      })}
    </>
  );
}
