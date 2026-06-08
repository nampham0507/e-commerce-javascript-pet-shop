const { GoogleGenAI } = require("@google/genai");
const Order = require("../models/Order");

const nodeFetch = global.fetch;
const NodeAbortController = global.AbortController;
const nodeSetTimeout = global.setTimeout;
const nodeClearTimeout = global.clearTimeout;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 30000;
const FALLBACK_MESSAGE =
  "Mình đang bận xíu, bạn chờ vài giây rồi thử lại nhé! Hoặc bạn có thể tham khảo trực tiếp Sản phẩm của Xám Pet Shop.";

const SYSTEM_PROMPT = `Bạn là trợ lý chăm sóc khách hàng AI của XamPet Shop, cửa hàng chuyên bán thức ăn, phụ kiện và đồ dùng cho chó, mèo và các thú cưng khác.

Vai trò:
- Tư vấn sản phẩm cho khách hàng.
- Hỗ trợ tìm kiếm sản phẩm phù hợp.
- Hướng dẫn mua hàng và thanh toán.
- Giải đáp thắc mắc về đơn hàng.
- Giới thiệu khuyến mãi nếu có dữ liệu rõ ràng.

Phong cách trả lời:
- Luôn lịch sự, thân thiện, chuyên nghiệp và tự nhiên như nhân viên chăm sóc khách hàng thực tế.
- Trả lời ngắn gọn nhưng đủ thông tin.
- Xưng là "Shop" hoặc "Em", gọi khách là "Anh/Chị".
- Có thể dùng emoji vừa phải.
- Không trả lời máy móc, không lặp lại nội dung không cần thiết.
- Không hiển thị suy luận nội bộ, thẻ <think>, </think>, hoặc nội dung phân tích hệ thống.

Quy tắc tư vấn sản phẩm:
- Khi khách hỏi sản phẩm chung chung, hãy hỏi thêm nhu cầu trước khi đề xuất.
- Ưu tiên hỏi: loại thú cưng, độ tuổi, cân nặng, ngân sách, mục đích sử dụng.
- Khi giới thiệu sản phẩm, nêu tên sản phẩm, công dụng chính, đối tượng phù hợp, giá bán nếu có dữ liệu, và lý do nên chọn.
- Nếu không có dữ liệu giá hoặc tồn kho, không tự bịa. Hãy nói Shop chưa có thông tin chính xác và gợi ý Anh/Chị xem trang Sản phẩm tại /product.

Quy tắc đơn hàng:
- Nếu khách hỏi về đơn hàng, yêu cầu mã đơn hàng trước.
- Bạn chưa có quyền truy vấn trực tiếp dữ liệu đơn hàng trong hệ thống ở cuộc trò chuyện này, nên không được tự tạo trạng thái, ngày đặt, thanh toán hoặc dự kiến giao hàng.
- Khi thiếu dữ liệu, trả lời: "Anh/Chị vui lòng cung cấp mã đơn hàng để Shop kiểm tra và hỗ trợ nhanh nhất nhé."

Quy tắc khiếu nại:
- Luôn thể hiện sự đồng cảm.
- Hỏi thêm thông tin cần thiết để Shop hỗ trợ kiểm tra.

Quy tắc an toàn:
- Không tự ý bịa thông tin sản phẩm, đơn hàng, khuyến mãi, giá bán hoặc tồn kho.
- Không cam kết chữa bệnh cho thú cưng.
- Không đưa ra chẩn đoán thú y chuyên môn.
- Nếu liên quan đến sức khỏe thú cưng, khuyến nghị Anh/Chị tham khảo bác sĩ thú y.

Khi không có dữ liệu chính xác, trả lời:
"Hiện tại Shop chưa có thông tin chính xác về vấn đề này. Anh/Chị vui lòng liên hệ bộ phận chăm sóc khách hàng để được hỗ trợ chi tiết hơn nhé."`;

const cleanBotMessage = (content) => {
  if (!content || typeof content !== "string") return "";

  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^[\s\S]*?<\/think>/i, "")
    .replace(/<\/?think>/gi, "")
    .replace(/Bạn/g, "Anh/Chị")
    .replace(/bạn/g, "Anh/Chị")
    .trim();
};

const buildMessages = (message, history) => [
  { role: "system", content: SYSTEM_PROMPT },
  ...history
    .filter((msg) => msg && typeof msg.content === "string")
    .map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    })),
  { role: "user", content: message.trim() },
];

const ORDER_STATUS_LABELS = {
  pending: "Đang chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipped: "Đang giao hàng",
  delivered: "Đã giao hàng",
  cancelled: "Đã hủy",
};

const PAYMENT_STATUS_LABELS = {
  pending: "Đang chờ thanh toán",
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  failed: "Thanh toán thất bại",
};

const PAYMENT_METHOD_LABELS = {
  cod: "Thanh toán khi nhận hàng",
  banking: "Thanh toán online/VNPay",
};

const extractOrderNumber = (message) => {
  const match = message.match(/#?(ORD[-A-Z0-9]+)/i);
  return match ? match[1].toUpperCase() : null;
};

const isOrderLookupMessage = (message) =>
  /(đơn hàng|don hang|mã đơn|ma don|kiểm tra đơn|kiem tra don|tra cứu đơn|tra cuu don|order|ORD-)/i.test(
    message
  );

const formatDate = (date) => {
  if (!date) return "Chưa có thông tin";
  return new Date(date).toLocaleString("vi-VN");
};

const formatMoney = (amount) =>
  `${Number(amount || 0).toLocaleString("vi-VN")}đ`;

const buildOrderLookupResponse = async (message) => {
  if (!isOrderLookupMessage(message)) return null;

  const orderNumber = extractOrderNumber(message);

  if (!orderNumber) {
    return {
      success: true,
      message:
        "Anh/Chị vui lòng cung cấp mã đơn hàng để Shop kiểm tra và hỗ trợ nhanh nhất nhé.",
    };
  }

  const order = await Order.findOne({ orderNumber })
    .select(
      "orderNumber status totalPrice paymentMethod paymentStatus createdAt updatedAt"
    )
    .lean();

  if (!order) {
    return {
      success: true,
      message:
        "Hiện tại Shop chưa có thông tin chính xác về mã đơn hàng này. Anh/Chị vui lòng kiểm tra lại mã đơn hoặc liên hệ bộ phận chăm sóc khách hàng để được hỗ trợ chi tiết hơn nhé.",
    };
  }

  return {
    success: true,
    message: [
      `Shop đã kiểm tra đơn hàng ${order.orderNumber} cho Anh/Chị:`,
      `• Trạng thái đơn: ${ORDER_STATUS_LABELS[order.status] || order.status}`,
      `• Ngày đặt: ${formatDate(order.createdAt)}`,
      `• Phương thức thanh toán: ${
        PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod
      }`,
      `• Trạng thái thanh toán: ${
        PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus
      }`,
      `• Tổng tiền: ${formatMoney(order.totalPrice)}`,
      // "• Dự kiến giao hàng: Hiện tại Shop chưa có thông tin chính xác.",
    ].join("\n"),
  };
};

const callOpenRouter = async (message, history) => {
  const controller = new NodeAbortController();
  const timeout = nodeSetTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  let response;

  try {
    response = await nodeFetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:5000",
          "X-Title": "Xam Pet Shop",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: buildMessages(message, history),
          temperature: 0.7,
          max_tokens: 300,
        }),
        signal: controller.signal,
      }
    );
  } finally {
    nodeClearTimeout(timeout);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `OpenRouter API Error ${response.status}: ${
        data?.error?.message || JSON.stringify(data)
      }`
    );
  }

  return cleanBotMessage(data.choices?.[0]?.message?.content);
};

const callGemini = async (message, history) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const contents = [
    ...history
      .filter((msg) => msg && typeof msg.content === "string")
      .map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    {
      role: "user",
      parts: [{ text: message.trim() }],
    },
  ];

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 400,
    },
  });

  return cleanBotMessage(response.text);
};

exports.handleChat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nội dung tin nhắn không được để trống",
      });
    }

    const orderLookupResponse = await buildOrderLookupResponse(message.trim());

    if (orderLookupResponse) {
      return res.json(orderLookupResponse);
    }

    if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "Chatbot chưa được cấu hình API key.",
      });
    }

    const safeHistory = Array.isArray(history) ? history : [];
    const botMessage = process.env.OPENROUTER_API_KEY
      ? await callOpenRouter(message, safeHistory)
      : await callGemini(message, safeHistory);

    if (!botMessage) {
      throw new Error("AI provider returned an empty response");
    }

    res.json({
      success: true,
      message: botMessage,
    });
  } catch (error) {
    console.error("AI Chat API Error:", error.message);

    const errMsg = error.message || "";
    if (
      errMsg.includes("402") ||
      errMsg.includes("429") ||
      errMsg.includes("RESOURCE_EXHAUSTED") ||
      errMsg.includes("AbortError") ||
      errMsg.toLowerCase().includes("aborted") ||
      errMsg.toLowerCase().includes("timeout") ||
      errMsg.toLowerCase().includes("quota") ||
      errMsg.toLowerCase().includes("credit")
    ) {
      return res.status(503).json({
        success: false,
        message: FALLBACK_MESSAGE,
      });
    }

    res.status(500).json({
      success: false,
      message: "Xin lỗi, hệ thống AI đang gặp lỗi. Vui lòng thử lại sau.",
      error: error.message,
    });
  }
};
