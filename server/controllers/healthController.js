const getHealth = (req, res) => {
  res.json({
    ok: true,
    app: "MyFitnessComrade",
    message: "Server is running"
  });
};

module.exports = {
  getHealth
};
