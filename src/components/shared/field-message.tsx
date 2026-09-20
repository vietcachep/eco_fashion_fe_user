/* Dòng lỗi dưới ô nhập — dùng cho mọi form RHF + Zod; style `.field-error` ở globals.scss. */
export function FieldMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="field-error" role="alert">{message}</span>;
}
