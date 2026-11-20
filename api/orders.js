const orders = [];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body || {};
    const { name, email, address, items, total } = body;

    if (!name || !email || !address || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const order = {
      orderId: 'SNV-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
      name,
      email,
      address,
      items,
      total,
      status: 'confirmed',
    };

    orders.push(order);

    res.status(201).json({ ok: true, orderId: order.orderId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
