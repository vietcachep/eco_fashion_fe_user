import { PageTitle } from "@/components/shared/page-title";

/*
 * Khung trang chính sách / điều khoản — trang `privacy-policy` của Vineta:
 * `tf-page-title` + `s-term-user` với các `term-item` (tiêu đề + đoạn / danh
 * sách). Nội dung là văn bản của cửa hàng, truyền vào dạng dữ liệu để các
 * trang chính sách chỉ khai báo nội dung, không lặp markup.
 */
export interface TermSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: { head: string[]; rows: string[][] };
}

export function PolicyPage({ title, updatedAt, sections }: { title: string; updatedAt?: string; sections: TermSection[] }) {
  return (
    <>
      <PageTitle title={title} desc={updatedAt ? `Cập nhật: ${updatedAt}` : undefined} />
      <section className="s-term-user flat-spacing-2">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="content">
                {sections.map((s, i) => (
                  <div className="term-item" key={s.title}>
                    <p className="term-title">{i + 1}. {s.title}</p>
                    <div className="text-wrap">
                      {s.paragraphs?.map((p, k) => <p className="term-text" key={k}>{p}</p>)}
                      {s.bullets && (
                        <ul className="list-text type-disc">
                          {s.bullets.map((b, k) => <li className="term-text" key={k}>{b}</li>)}
                        </ul>
                      )}
                      {s.table && (
                        <div className="tf-table-res-df">
                          <table className="tf-sizeguide-table">
                            <thead><tr>{s.table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                            <tbody>{s.table.rows.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
