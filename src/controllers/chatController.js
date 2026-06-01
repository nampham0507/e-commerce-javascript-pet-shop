const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `Bạn là trợ lý AI thân thiện tên là "Xám" của Xám Pet Shop - cửa hàng chuyên bán thức ăn và phụ kiện cao cấp cho mèo. 
Nhiệm vụ của bạn là tư vấn nhiệt tình, ngắn gọn và hữu ích cho khách hàng về các sản phẩm như:
- Hạt (Royal Canin, Me-O, Catsrang...)
- Pate (Gourmet Gold, Catsrang Tuna...)
- Snack (Salmon Jerky, Crispy Bites...)
- Sữa (Cat Milk, Goat Milk...)
- Phụ kiện (cát vệ sinh, cây cào, đồ chơi, GPS collar...)

Xưng hô là "Xám" hoặc "mình", gọi khách là "bạn". 
Trả lời ngắn gọn tối đa 3-4 câu, bằng tiếng Việt. Nếu khách hỏi về sản phẩm, gợi ý họ xem trang Sản phẩm tại /product.`;

exports.handleChat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Nội dung tin nhắn không được để trống",
      });
    }

    // Build conversation history for Gemini
    const contents = [
      ...history.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 400,
      },
    });

    const botMessage = response.text;

    res.json({
      success: true,
      message: botMessage,
    });
  } catch (error) {
    console.error("Gemini API Error:", error.message);

    const errMsg = error.message || "";
    if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
      return res.json({
        success: true,
        message:
          "Mình đang bận xíu, bạn chờ vài giây rồi thử lại nhé! Hoặc bạn có thể tham khảo trực tiếp Sản phẩm của Xám Pet Shop.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Xin lỗi, hệ thống AI đang gặp lỗi. Vui lòng thử lại sau.",
      error: error.message,
    });
  }
};
