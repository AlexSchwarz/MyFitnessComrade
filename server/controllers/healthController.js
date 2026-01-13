const getHealth = (req, res) => {
  res.json({
    ok: true,
    app: "MyFitnessComrade",
    message: "Server is running"
  });
};

const logValue = (req, res) => {
  const { value } = req.body;

  // Log to server console
  console.log('Received value from client:', value);

  // Return success response
  res.json({
    ok: true,
    message: 'Value logged successfully',
    received: value
  });
};

module.exports = {
  getHealth,
  logValue
};
