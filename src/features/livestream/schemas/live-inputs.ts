import { z } from "zod";
export const liveChatSchema = z.object({ body: z.string().trim().min(1, "Nhập nội dung bình luận.").max(300, "Bình luận tối đa300 ký tự.") });
export const liveReportSchema = z.object({ reason: z.enum(["Nội dung không phù hợp", "Thông tin sản phẩm sai lệch", "Gian lận", "Spam", "Khác"]), description: z.string().trim().max(1000, "Mô tả tối đa1000 ký tự.") });
export type LiveChatInput = z.infer<typeof liveChatSchema>;
export type LiveReportInput = z.infer<typeof liveReportSchema>;
