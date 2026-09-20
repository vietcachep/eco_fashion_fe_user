import type { Metadata } from "next";
import { PageTitle } from "@/components/shared/page-title";
import { ContactScreen } from "@/features/system/components/contact-screen";

export const metadata: Metadata = { title: "Liên hệ" };

export default function ContactPage() {
  return (<><PageTitle title="Liên hệ" desc="Chúng tôi trả lời trong vòng 24 giờ làm việc." /><ContactScreen /></>);
}
