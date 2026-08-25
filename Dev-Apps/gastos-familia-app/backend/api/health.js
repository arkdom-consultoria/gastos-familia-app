module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    supabase: process.env.SUPABASE_URL ? 'configurado' : 'não configurado'
  });
};
