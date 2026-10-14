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

const getCrawledArticles = async (req, res) => {
  try {
    const response = await axios.get(
      `${config.get("/crawlApiUrl")}/api/v1/news-feed/articles`,
      {
        params: {
          page: req.query.page,
          limit: req.query.limit,
          source: req.query.source,
          search: req.query.search,
        },
        timeout: 10_000,
        headers: { Accept: "application/json" },
      },
    );
    return res.status(response.status).send(response.data);
  } catch (error) {
    const status = error.response?.status || 503;
    const message = error.response?.data?.message || "Crawl articles API unavailable";
    return res.status(status).send({
      success: false,
      data: "",
      message,
      code: status,
    });
  }
};

const proxyRadar = (suffix) => async (req,res) => {
  try {
    const endpoint = typeof suffix === 'function' ? suffix(req) : suffix;
    const response = await axios.get(`${config.get('/crawlApiUrl')}/api/v1/news-feed/${endpoint}`, {
      params: {
        window_hours:req.query.window_hours,page:req.query.page,limit:req.query.limit,
        search:req.query.search,category:req.query.category,trend:req.query.trend,
        engine:req.query.engine,run_id:req.query.run_id,
      }, timeout:10000,
      headers:{Accept:'application/json',...(process.env.CRAWL_API_TOKEN ? {Authorization:`Bearer ${process.env.CRAWL_API_TOKEN}`} : {})},
    });
    return res.status(response.status).send(response.data);
  } catch(error) {
    const status=error.response?.status||503;
    return res.status(status).send({success:false,data:'',message:error.response?.data?.message||'Editorial radar API unavailable',code:status});
  }
};
module.exports = { getViralIssues, getCrawledArticles,
  getRecommendations:proxyRadar('recommendations'),
  getRecommendation:proxyRadar(req=>`recommendations/${encodeURIComponent(req.params.id)}`),
  getRadarStatus:proxyRadar('status'),
};
