# AI-103 Quiz - Ôn luyện trắc nghiệm Developer Associate

Ứng dụng web ôn luyện trắc nghiệm tối giản, tập trung vào nội dung cho kỳ thi chứng chỉ **Microsoft Certified: Azure AI Apps and Agents Developer Associate (AI-103)**.

## 🚀 Tính năng chính

- **Đầy đủ 175 câu hỏi**: Trích xuất 100% từ tài liệu AI-103 mới nhất, phân loại rõ ràng từng dạng câu hỏi (Trắc nghiệm đơn, Nhiều đáp án, Nhận định Đúng/Sai, Kéo thả / Hot Area).
- **123 sơ đồ & ảnh minh họa**: Toàn bộ kiến trúc Azure, đoạn mã nguồn, bảng cấu hình đi kèm được hiển thị sắc nét với chế độ xem phóng to (Lightbox).
- **2 chế độ học tập linh hoạt**:
  - **Ôn luyện (Study Mode)**: Chọn đáp án nhận phản hồi ngay, xem đáp án chuẩn và phân tích giải thích chuyên sâu.
  - **Thi thử (Exam Mode)**: Bấm giờ làm bài, ẩn đáp án đến khi nộp bài để tính điểm và tỷ lệ % đạt chuẩn.
- **Bộ lọc & Tìm kiếm nhanh**:
  - Lọc theo: *Tất cả*, *Chưa làm*, *Câu làm đúng*, *Câu làm sai*, *Đã lưu (★)*.
  - Tìm kiếm thời gian thực theo từ khóa (Foundry, Content Safety, Vector Search, Tracing...).
  - Danh sách lưới 175 câu hỏi trực quan.
- **Hệ thống phím tắt**:
  - `[` hoặc `←`: Câu trước
  - `]` hoặc `→`: Câu tiếp theo
  - `1`, `2`, `3`, `4` (hoặc `A`, `B`, `C`, `D`): Chọn đáp án
  - `Space`: Ẩn/Hiện giải thích chi tiết
  - `B`: Đánh dấu câu hỏi
  - `G`: Mở danh sách câu hỏi
- **Tự động lưu tiến độ**: Lưu lịch sử làm bài và bookmark vào `localStorage`.

## 🛠️ Công nghệ

- Pure Vanilla HTML5, CSS3, JavaScript (Không phụ thuộc framework, siêu nhẹ và tải tức thì).
- Dữ liệu chuẩn định dạng JSON (`data/ai-103-questions.json`).
