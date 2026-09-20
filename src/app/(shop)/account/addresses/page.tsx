import type { Metadata } from "next";
import { AddressBook } from "@/features/identity/components/account/address-book";

export const metadata: Metadata = { title: "Sổ địa chỉ" };

export default function AddressesPage() {
  return <AddressBook />;
}
