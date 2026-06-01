const excelReportService = require("../services/excelReportService");
const moment = require("moment");

exports.exportExcelReport = async (req, res) => {
  try {
    const workbook = await excelReportService.generateReport();

    const fileName = `Bao_Cao_Xam_Pet_Shop_${moment().format("YYYYMMDD_HHmmss")}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting excel report:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xuất báo cáo",
      error: error.message,
    });
  }
};
