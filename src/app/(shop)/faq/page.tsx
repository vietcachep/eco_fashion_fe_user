import type { Metadata } from "next";
import { PageTitle } from "@/components/shared/page-title";
import { FaqScreen } from "@/features/system/components/faq-screen";

export const metadata: Metadata = { title: "Câu hỏi thường gặp" };

export default function FaqPage() {
  return (<><PageTitle title="Câu hỏi thường gặp" /><FaqScreen /></>);
}
