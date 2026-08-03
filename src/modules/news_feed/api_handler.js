const axios = require("axios");
const config = require("../../config/global_config");

const getViralIssues = async (req, res) => {
  try {
    const response = await axios.get(
      `${config.get("/crawlApiUrl")}/api/v1/news-feed/viral`,
      {
        params: {
          window_hours: req.query.window_hours,
          limit: req.query.limit,
        },
        timeout: 10_000,
        headers: { Accept: "application/json" },
      },
    );
    return res.status(response.status).send(response.data);
  } catch (error) {
    const status = error.response?.status || 503;
    const message = error.response?.data?.message || "Crawl aggregation API unavailable";
    return res.status(status).send({
      success: false,
      data: "",
      message,
      code: status,
    });
  }
};

module.exports = { getViralIssues };
