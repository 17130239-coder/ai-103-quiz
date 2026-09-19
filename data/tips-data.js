/**
 * AI-103 Quiz Studio - Curated Tips & Exam Tricks Data
 * Standardized for Microsoft Certified: Azure AI Engineer Associate (AI-103)
 */
window.AI103_TIPS_DATA = [
  {
    id: 1,
    category: "keywords",
    categoryLabel: "Từ khóa vàng",
    title: "Bẫy 'Minimize administrative / development effort'",
    icon: "psychology_alt",
    highlight: "90% chọn Prebuilt Models / Managed Identity / PaaS có sẵn, LOẠI BỎ code custom hoặc hạ tầng IaaS phức tạp.",
    summary: "Khi đề thi xuất hiện cụm từ 'minimize effort' hoặc 'minimize development effort', Microsoft luôn kiểm tra xem bạn có biết tận dụng tối đa các dịch vụ PaaS có sẵn thay vì tự viết mã hoặc cấu hình hạ tầng thủ công.",
    rules: [
      { type: "pick", text: "Ưu tiên chọn: Prebuilt models (Document Intelligence prebuilt, OpenAI Assistants with File Search), Managed Identity, Virtual Network Service Endpoints, Azure AI Search built-in indexers." },
      { type: "avoid", text: "Tránh chọn: Tự viết Python script xử lý file, tạo Azure VM tự host mô hình, cấu hình VPN Gateway/IPsec thủ công, tự huấn luyện Custom model khi đã có Prebuilt model đáp ứng." }
    ],
    codeSnippet: null,
    relatedQuestions: [90, 142, 156, 157],
    tags: ["PaaS", "Prebuilt", "Effort", "Từ khóa vàng"]
  },
  {
    id: 2,
    category: "keywords",
    categoryLabel: "Từ khóa vàng",
    title: "Phân biệt các loại Prompt Shields (Direct vs Indirect vs Protected Material)",
    icon: "security",
    highlight: "User gõ trực tiếp = User Prompt Shield | Mã độc giấu trong tài liệu/web = Document Shield | Bản quyền = Protected Material.",
    summary: "Azure OpenAI và Content Safety cung cấp nhiều cơ chế phòng thủ chuyên biệt. Cần phân biệt rõ nguồn gốc của cuộc tấn công và loại nội dung cần bảo vệ.",
    rules: [
      { type: "pick", text: "Direct Prompt Attack (Jailbreak): Kẻ tấn công là chính người dùng gõ câu lệnh trực tiếp vào ô chat ➔ Chọn: Prompt Shields for user prompts." },
      { type: "pick", text: "Indirect Prompt Attack: Mã độc gài trong tài liệu PDF, email, hoặc web nguồn để model đọc và bị thao túng ➔ Chọn: Prompt Shields for documents." },
      { type: "pick", text: "Sensitive / Copyrighted Data: Ngăn chặn model sao chép văn bản, thơ ca, hoặc mã nguồn có bản quyền đã xuất bản ➔ Chọn: Protected material detection for text/code." },
      { type: "pick", text: "Groundedness & Relevance: Đo lường xem câu trả lời có bám sát tài liệu nguồn và trả lời đúng trọng tâm câu hỏi người dùng hay không ➔ Chọn: Groundedness and Relevance." }
    ],
    codeSnippet: null,
    relatedQuestions: [3, 32, 35, 103],
    tags: ["Prompt Shield", "Jailbreak", "Groundedness", "Protected Material"]
  },
  {
    id: 3,
    category: "keywords",
    categoryLabel: "Từ khóa vàng",
    title: "Giám sát mã nguồn ngoài Azure AI Foundry (External Tracing)",
    icon: "monitoring",
    highlight: "Python code chạy ngoài Foundry Portal muốn gửi Trace về Foundry: Bắt buộc dùng OpenTelemetry + Application Insights.",
    summary: "Khi phát triển ứng dụng AI cục bộ (local machine) hoặc server bên ngoài portal mà muốn theo dõi dấu vết (spans/traces) trong Azure AI Foundry dashboard, bạn phải cấu hình đúng bộ SDK.",
    rules: [
      { type: "pick", text: "Bộ đôi chuẩn: OpenTelemetry SDK kết hợp với connection string của Azure Application Insights (Azure Monitor OpenTelemetry Distro)." },
      { type: "avoid", text: "Bẫy thi thường gặp: KHÔNG chọn Azure Monitor Agent (AMA), KHÔNG chọn Log Analytics Workspace agent trực tiếp, KHÔNG chọn Microsoft Sentinel." }
    ],
    codeSnippet: "from azure.monitor.opentelemetry import configure_azure_monitor\nfrom opentelemetry import trace\n\n# Cấu hình OpenTelemetry đẩy trace về Application Insights\nconfigure_azure_monitor(connection_string=\"InstrumentationKey=...\")\ntracer = trace.get_tracer(\"ai103.service\")",
    relatedQuestions: [10, 24, 70],
    tags: ["OpenTelemetry", "Application Insights", "Foundry", "Tracing"]
  },
  {
    id: 4,
    category: "interactive",
    categoryLabel: "Câu tương tác",
    title: "Bí kíp Video Generation & Polling SDK (OpenAI / Foundry)",
    icon: "videocam",
    highlight: "Khởi tạo bằng client.videos.create() ➔ Polling trạng thái bằng client.videos.retrieve(video.id) trong vòng lặp.",
    summary: "Xử lý sinh video là tác vụ tốn thời gian (asynchronous), SDK của OpenAI / Azure AI yêu cầu gửi request tạo trước, sau đó dùng vòng lặp kiểm tra trạng thái tiến trình qua video ID.",
    rules: [
      { type: "pick", text: "Phương thức khởi tạo: client.videos.create(model=deployment_name, prompt=...)" },
      { type: "pick", text: "Phương thức kiểm tra tiến trình: client.videos.retrieve(video.id)" },
      { type: "pick", text: "Điều kiện vòng lặp while: while video.status not in [\"completed\", \"failed\", \"cancelled\"]: (hoặc while video.status in [\"queued\", \"processing\"]:)" }
    ],
    codeSnippet: "# Khởi tạo tác vụ sinh video\nvideo = client.videos.create(model=deployment_name, prompt=prompt_text)\n\n# Polling trạng thái cho tới khi hoàn tất\nwhile video.status not in [\"completed\", \"failed\", \"cancelled\"]:\n    time.sleep(5)\n    video = client.videos.retrieve(video.id)",
    relatedQuestions: [105, 173],
    tags: ["Video API", "Asynchronous", "Polling", "SDK"]
  },
  {
    id: 5,
    category: "metrics",
    categoryLabel: "Công thức & Đo lường",
    title: "Bậc thầy phân biệt Precision và Recall (Bảng số liệu & Đồ thị)",
    icon: "calculate",
    highlight: "Precision = TP / (TP + FP) (Hạn chế báo động nhầm) | Recall = TP / (TP + FN) (Hạn chế bỏ sót lỗi).",
    summary: "Trong bài thi AI-103, Microsoft thường đưa ra bảng số liệu huấn luyện mô hình Object Detection hoặc Confusion Matrix và yêu cầu tính tỷ lệ hoặc phân tích đánh đổi (trade-off).",
    rules: [
      { type: "pick", text: "Precision (Độ chuẩn xác): Quan tâm khi False Positive (Báo động giả) gây hậu quả tốn kém. Ví dụ: Nếu đề bài ghi 'False Positives must be zero' ➔ Precision = 100%." },
      { type: "pick", text: "Recall (Độ bao phủ / Nhạy): Quan tâm khi False Negative (Bỏ sót lỗi) gây nguy hiểm nghiêm trọng (ung thư, vũ khí). Nếu đề ghi 'False Negatives must be zero' ➔ Recall = 100%." },
      { type: "pick", text: "Công thức TP / (TP + FN): Đây chính là định nghĩa toán học của Recall (số True Positives chia cho tổng số mẫu thực tế dương tính)." },
      { type: "pick", text: "F1-Score: Trung bình điều hòa giữa Precision và Recall: 2 * (Precision * Recall) / (Precision + Recall)." }
    ],
    codeSnippet: "# Công thức vàng cần nhớ:\nPrecision = TP / (TP + FP)   # Tỷ lệ đoán đúng trên tổng số lần đoán là Positive\nRecall    = TP / (TP + FN)   # Tỷ lệ tìm được trên tổng số mẫu thực tế là Positive",
    relatedQuestions: [143, 165, 175],
    tags: ["Precision", "Recall", "False Positive", "Confusion Matrix"]
  },
  {
    id: 6,
    category: "interactive",
    categoryLabel: "Câu tương tác",
    title: "Thứ tự 5 bước chuẩn của Azure Custom Vision",
    icon: "filter_frames",
    highlight: "Create Project ➔ Upload & Tag Images ➔ Train Iteration ➔ Publish Iteration ➔ Predict/Test.",
    summary: "Dạng câu hỏi kéo thả sắp xếp các bước xây dựng mô hình thị giác máy tính Custom Vision xuất hiện rất phổ biến trong đề thi.",
    rules: [
      { type: "pick", text: "1. Create Project: Tạo project trong Custom Vision portal hoặc TrainingClient.create_project()." },
      { type: "pick", text: "2. Upload & Tag Images: Tải ảnh lên và gắn nhãn (Tối thiểu 5 ảnh/tag cho Phân loại ảnh, 15 ảnh/tag cho Phát hiện đối tượng)." },
      { type: "pick", text: "3. Train Iteration: Huấn luyện qua TrainingClient.train_project()." },
      { type: "pick", text: "4. Publish Iteration: Xuất bản iteration kèm theo Prediction Resource ID (publish_iteration)." },
      { type: "pick", text: "5. Predict / Test: Gửi ảnh kiểm tra qua Prediction URL hoặc PredictionClient.classify_image_url()." }
    ],
    codeSnippet: null,
    relatedQuestions: [135, 148, 159],
    tags: ["Custom Vision", "Workflow", "Iteration", "Classification"]
  },
  {
    id: 7,
    category: "interactive",
    categoryLabel: "Câu tương tác",
    title: "Kiến trúc 4 tầng của Azure AI Search (Đúng thứ tự thực hiện)",
    icon: "account_tree",
    highlight: "Data Source ➔ Skillset (AI Enrichment) ➔ Index (Schema) ➔ Indexer (Engine kéo dữ liệu).",
    summary: "Để lập chỉ mục dữ liệu với AI enrichment (trích xuất thực thể, OCR, phân tích cảm xúc, vector), quy trình tạo tài nguyên bắt buộc phải theo đúng trình tự phụ thuộc.",
    rules: [
      { type: "pick", text: "1. Data Source: Cấu hình kết nối tới kho dữ liệu nguồn (Azure Blob Storage, Azure SQL, Cosmos DB)." },
      { type: "pick", text: "2. Skillset: Định nghĩa danh sách các kỹ năng AI (OCR skill, Entity Recognition skill, Azure OpenAI Embedding skill)." },
      { type: "pick", text: "3. Index: Tạo schema bảng dữ liệu chứa các trường (fields), cờ cấu hình (searchable, filterable, facetable, contentVector)." },
      { type: "pick", text: "4. Indexer: Động cơ kết nối cả 3 thành phần trên, thực hiện kéo dữ liệu theo lịch trình hoặc sự kiện." }
    ],
    codeSnippet: "# Trật tự phụ thuộc cấu hình:\n# Data Source  ==>  Skillset  ==>  Index (Schema)  ==>  Indexer",
    relatedQuestions: [94, 120, 121, 146],
    tags: ["AI Search", "Skillset", "Indexer", "Data Source"]
  },
  {
    id: 8,
    category: "cheatsheet",
    categoryLabel: "Code & SDK",
    title: "Azure AI Search: Hybrid Search & Thuật toán RRF",
    icon: "merge",
    highlight: "Hybrid Search = BM25 Text Search + Vector Search song song, kết hợp điểm qua RRF (Reciprocal Rank Fusion).",
    summary: "Tìm kiếm kết hợp (Hybrid Search) là giải pháp tối ưu cho hệ thống RAG hiện đại trên Azure, cung cấp độ chính xác vượt trội so với tìm kiếm thuần từ khóa hoặc thuần vector.",
    rules: [
      { type: "pick", text: "Text Search: Xử lý theo thuật toán BM25 dựa trên tần suất từ khóa." },
      { type: "pick", text: "Vector Search: Sử dụng VectorizedQuery tìm kiếm các điểm gần nhất (k-nearest neighbors) trong không gian vector." },
      { type: "pick", text: "RRF (Reciprocal Rank Fusion): Thuật toán tự động kết hợp thứ hạng từ cả hai kênh mà không cần chuẩn hóa điểm số (score normalization)." },
      { type: "pick", text: "Semantic Re-ranking: Bổ sung tầng chấm điểm ngữ nghĩa L2 (query_type=QueryType.SEMANTIC) để đưa kết quả chính xác nhất lên đầu." }
    ],
    codeSnippet: "from azure.search.documents.models import VectorizedQuery, QueryType\n\nresults = search_client.search(\n    search_text=\"chính sách bảo hành\",\n    vector_queries=[\n        VectorizedQuery(vector=query_vector, k_nearest_neighbors=5, fields=\"contentVector\")\n    ],\n    query_type=QueryType.SEMANTIC,\n    semantic_configuration_name=\"my-semantic-config\"\n)",
    relatedQuestions: [52, 94, 138],
    tags: ["Hybrid Search", "Vector", "RRF", "Semantic Ranker"]
  },
  {
    id: 9,
    category: "keywords",
    categoryLabel: "Từ khóa vàng",
    title: "Document Intelligence: Custom Template vs Custom Neural",
    icon: "description",
    highlight: "Custom Template = Bố cục cố định, tối thiểu 5 mẫu | Custom Neural = Định dạng linh hoạt, trích xuất ngữ cảnh sâu.",
    summary: "Việc lựa chọn đúng loại mô hình tùy chỉnh trong Azure AI Document Intelligence quyết định trực tiếp đến thời gian huấn luyện và độ chính xác trích xuất.",
    rules: [
      { type: "pick", text: "Custom Template Model: Dành cho biểu mẫu có cấu trúc cố định giống hệt nhau (form điền tay chuẩn, form khảo sát, biểu mẫu thuế W-2). Cần tối thiểu 5 tài liệu mẫu." },
      { type: "pick", text: "Custom Neural Model: Dành cho tài liệu có bố cục thay đổi linh hoạt (hóa đơn từ nhiều nhà cung cấp khác nhau, hợp đồng pháp lý, tài liệu nhiều trang). Trích xuất dựa trên ngữ cảnh ngữ nghĩa." },
      { type: "pick", text: "Composed Model: Dùng khi cần gộp nhiều mô hình con (tối đa 100 model) vào 1 Model ID duy nhất để hệ thống tự động phân loại form trước khi bóc tách." }
    ],
    codeSnippet: null,
    relatedQuestions: [51, 74, 147, 158],
    tags: ["Document Intelligence", "Custom Template", "Neural Model", "Composed Model"]
  },
  {
    id: 10,
    category: "cheatsheet",
    categoryLabel: "Code & SDK",
    title: "Speech Service: Nhận dạng, Dịch thuật & SSML",
    icon: "record_voice_over",
    highlight: "Nhận dạng 1 câu ngắn: recognize_once_async() | Hội thoại dài: start_continuous_recognition_async() | Biểu cảm giọng đọc: SSML <mstts:express-as>.",
    summary: "Azure Speech SDK cung cấp các API chuyên biệt tùy thuộc vào kịch bản là nhận dạng câu lệnh ngắn hay bóc băng âm thanh liên tục.",
    rules: [
      { type: "pick", text: "recognize_once_async(): Phù hợp cho câu lệnh thoại ngắn độc lập (Voice Command). Hệ thống tự ngắt khi người dùng dừng nói." },
      { type: "pick", text: "start_continuous_recognition_async(): Phù hợp cho ghi âm cuộc họp, bài giảng, tạo phụ đề thời gian thực. Cần đăng ký các callback: recognized, session_stopped." },
      { type: "pick", text: "SSML (Speech Synthesis Markup Language): Muốn điều chỉnh cảm xúc (vui vẻ, thì thầm, nghiêm túc) hoặc tốc độ đọc, bắt buộc dùng speak_ssml_async() kèm thẻ <mstts:express-as style=\"cheerful\">." }
    ],
    codeSnippet: "<speak version=\"1.0\" xmlns=\"http://www.w3.org/2001/10/synthesis\"\n       xmlns:mstts=\"https://www.w3.org/2001/mstts\" xml:lang=\"vi-VN\">\n  <voice name=\"vi-VN-HoaiMyNeural\">\n    <mstts:express-as style=\"cheerful\">\n      Chào mừng bạn đến với kỳ thi AI-103!\n    </mstts:express-as>\n  </voice>\n</speak>",
    relatedQuestions: [33, 81],
    tags: ["Speech", "SSML", "Recognition", "Synthesizer"]
  },
  {
    id: 11,
    category: "security",
    categoryLabel: "Bảo mật & Mạng",
    title: "Xác thực không mật khẩu (Passwordless) & Managed Identity",
    icon: "vpn_key",
    highlight: "Đề bài yêu cầu 'Zero credentials in code' hoặc 'Meet enterprise security': Luôn chọn Managed Identity + DefaultAzureCredential.",
    summary: "Microsoft luôn đánh giá cao các giải pháp bảo mật theo nguyên tắc Zero Trust, loại bỏ hoàn toàn việc lưu API Key hay Password trong file cấu hình ứng dụng.",
    rules: [
      { type: "pick", text: "DefaultAzureCredential(): Tự động thử nghiệm chuỗi xác thực an toàn (Environment ➔ Managed Identity ➔ Azure CLI Token) mà không cần viết key vào mã nguồn." },
      { type: "pick", text: "RBAC Role chuẩn: Gán quyền Cognitive Services OpenAI User cho tài khoản dịch vụ hoặc Agent chỉ cần gọi inference." },
      { type: "avoid", text: "Tuyệt đối không lưu Key trong appsettings.json, không tạo Service Principal với client secret khi đề bài yêu cầu tối thiểu hóa việc quản trị gia hạn khóa." }
    ],
    codeSnippet: "from azure.identity import DefaultAzureCredential\nfrom azure.ai.projects import AIProjectClient\n\n# Xác thực chuẩn doanh nghiệp qua Managed Identity\ncredential = DefaultAzureCredential()\nproject_client = AIProjectClient.from_connection_string(\n    credential=credential,\n    conn_str=PROJECT_CONNECTION_STRING\n)\nagent = project_client.agents.get(agent_name=\"myAgent\")",
    relatedQuestions: [4, 49, 63, 142, 175],
    tags: ["Managed Identity", "DefaultAzureCredential", "RBAC", "Passwordless"]
  },
  {
    id: 12,
    category: "security",
    categoryLabel: "Bảo mật & Mạng",
    title: "Private Endpoint vs Virtual Network Service Endpoint",
    icon: "lan",
    highlight: "Private Endpoint cấp IP nội bộ trong VNet, an toàn từ On-premises qua VPN/ExpressRoute | Service Endpoint vẫn dùng Public IP của Azure.",
    summary: "Đảm bảo cô lập hạ tầng mạng là một trong những chủ đề xuất hiện thường xuyên trong phần kiến trúc bảo mật của AI-103.",
    rules: [
      { type: "pick", text: "Private Endpoint (Azure Private Link): Cấp địa chỉ IP private (ví dụ 10.0.1.5) nằm ngay trong subnet VNet. Cho phép máy chủ On-premises kết nối tới dịch vụ AI qua VPN Gateway / ExpressRoute mà không đi qua Internet công cộng." },
      { type: "avoid", text: "Service Endpoint: Vẫn giữ Public IP của Azure resource, chỉ tối ưu tuyến đường mạng trên backbone của Microsoft (KHÔNG hỗ trợ kết nối trực tiếp từ On-premises qua VPN)." },
      { type: "pick", text: "Mẹo thi: Khi đề bài yêu cầu 'Traffic from on-premises clients must not traverse the public internet' ➔ Chọn: Private Endpoint." }
    ],
    codeSnippet: null,
    relatedQuestions: [59, 113, 119],
    tags: ["Private Endpoint", "Private Link", "VNet", "Security"]
  },
  {
    id: 13,
    category: "cheatsheet",
    categoryLabel: "Code & SDK",
    title: "Xử lý Asynchronous Long-Running Operations (HTTP 202 Accepted)",
    icon: "sync",
    highlight: "Gửi POST nhận 202 Accepted ➔ Trích xuất URL từ header 'Operation-Location' ➔ Polling GET định kỳ.",
    summary: "Các tác vụ phân tích tài liệu nhiều trang (Document Intelligence), nhận diện video (Video Indexer) hoặc sinh ảnh hàng loạt đều áp dụng cơ chế Asynchronous API.",
    rules: [
      { type: "pick", text: "Bước 1: Client gửi HTTP POST tới endpoint xử lý (ví dụ: /documentModels/prebuilt-layout:analyze)." },
      { type: "pick", text: "Bước 2: Server trả về mã HTTP Status 202 Accepted kèm header Operation-Location." },
      { type: "pick", text: "Bước 3: Client trích xuất URL từ header Operation-Location, thực hiện polling HTTP GET định kỳ (ví dụ mỗi 2 giây) cho đến khi thuộc tính 'status' chuyển sang 'succeeded'." }
    ],
    codeSnippet: "# Response Header:\n# HTTP/1.1 202 Accepted\n# Operation-Location: https://{endpoint}/documentintelligence/operations/{id}?api-version=...\n\n# Client Polling:\n# GET https://{endpoint}/documentintelligence/operations/{id}?api-version=...",
    relatedQuestions: [103, 105, 136],
    tags: ["Operation-Location", "HTTP 202", "Asynchronous", "Polling"]
  },
  {
    id: 14,
    category: "security",
    categoryLabel: "Bảo mật & Mạng",
    title: "Quyền riêng tư & Zero Data Retention (ZDR)",
    icon: "policy",
    highlight: "Azure OpenAI mặc định lưu prompt/completion 30 ngày để chống lạm dụng. Muốn xóa ngay: Phải đăng ký Zero Data Retention (ZDR).",
    summary: "Chính sách quản trị dữ liệu của Azure AI đảm bảo quyền riêng tư và tuân thủ các chuẩn y tế (HIPAA), tài chính (PCI-DSS).",
    rules: [
      { type: "pick", text: "Mặc định: Microsoft lưu trữ prompt và completion tối đa 30 ngày để phục vụ đánh giá hành vi lạm dụng (Abuse Monitoring)." },
      { type: "pick", text: "Zero Data Retention: Khách hàng thuộc ngành nghề đặc thù (ngân hàng, chăm sóc sức khỏe) có thể nộp đơn xin phê duyệt Modified Abuse Monitoring để không lưu bất kỳ log nào." },
      { type: "pick", text: "C2PA / Content Credentials: Đóng dấu siêu dữ liệu số (digital provenance) vào ảnh sinh bởi DALL-E 3 để minh bạch nguồn gốc AI." }
    ],
    codeSnippet: null,
    relatedQuestions: [87, 145],
    tags: ["Zero Data Retention", "Privacy", "C2PA", "Compliance"]
  },
  {
    id: 15,
    category: "strategy",
    categoryLabel: "Chiến thuật thi",
    title: "Chiến thuật phòng thi & Dạng câu Yes/No lặp lại",
    icon: "timer",
    highlight: "Không bao giờ bỏ trống đáp án (không trừ điểm) | Đọc câu hỏi trước khi đọc Case Study | Phân biệt câu Yes/No không thể quay lại.",
    summary: "Nắm vững format bài thi Microsoft Certification giúp bạn tối ưu hóa 100-120 phút trong phòng thi và tránh mất điểm oan uổng.",
    rules: [
      { type: "pick", text: "Không trừ điểm khi đoán sai: Bài thi Microsoft không có điểm âm. Hãy luôn chọn một đáp án tốt nhất cho mọi câu hỏi, tuyệt đối không bỏ trống." },
      { type: "pick", text: "Chiến lược đọc Case Study: Đọc câu hỏi và các tiêu chí kỹ thuật trước, sau đó dùng công cụ tìm kiếm hoặc lướt nhanh đến tab tương ứng để tìm thông tin." },
      { type: "avoid", text: "Cẩn trọng câu hỏi Yes/No (Repeated Scenario): Một chuỗi 3 câu hỏi có cùng đề bài nhưng giải pháp khác nhau. LƯU Ý: Không thể nhấn nút 'Quay lại' để sửa sau khi đã chuyển câu!" },
      { type: "pick", text: "Flag for Review: Sử dụng nút gắn cờ (Flag) cho những câu chưa chắc chắn 100% để kiểm tra lại ở màn hình tổng kết trước khi nhấn Finish Exam." }
    ],
    codeSnippet: null,
    relatedQuestions: [],
    tags: ["Exam Tactics", "Case Study", "Flag", "Yes/No"]
  },
  {
    id: 16,
    category: "interactive",
    categoryLabel: "Câu tương tác",
    title: "Phương pháp giải câu hỏi Kéo thả & Ghép nối (Drag-and-Drop)",
    icon: "swap_horiz",
    highlight: "Xác định bước Đầu tiên (Init/Auth) và bước Cuối cùng (Deploy/Predict) trước, thu hẹp phạm vi các bước ở giữa.",
    summary: "Dạng câu hỏi kéo thả sắp xếp quy trình (Drag-and-Drop) thường có nhiều lựa chọn gây nhiễu (distractors) không được sử dụng.",
    rules: [
      { type: "pick", text: "Xác định điểm neo: Luôn tìm hành động khởi đầu (Create resource, Authenticate, Configure Data Source) và hành động kết thúc (Publish, Test, Run Indexer)." },
      { type: "pick", text: "Đối chiếu chữ ký hàm SDK: Nhìn vào tham số truyền vào hàm: create() thường nhận cấu hình mới, retrieve() hoặc get() thường nhận ID, trong khi analyze() hoặc classify() thường nhận data/URL." },
      { type: "avoid", text: "Chú ý số lượng đáp án: Thông thường chỉ có 3-4 bước cần kéo vào Answer Area, các lựa chọn còn lại là phương án gây nhiễu." }
    ],
    codeSnippet: null,
    relatedQuestions: [105, 173, 175],
    tags: ["Drag and Drop", "Matching", "SDK Signature"]
  }
];
