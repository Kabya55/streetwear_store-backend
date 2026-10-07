import Setting from '../models/Setting.js';

export const getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'store_settings' });
    if (!setting) {
      setting = await Setting.create({ key: 'store_settings', deliveryCharge: 120 });
    }
    res.json({
      deliveryCharge: setting.deliveryCharge,
      updatedAt: setting.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { deliveryCharge } = req.body;

    if (deliveryCharge === undefined || isNaN(Number(deliveryCharge)) || Number(deliveryCharge) < 0) {
      return res.status(400).json({ message: 'Valid non-negative delivery charge is required' });
    }

    const chargeNum = Number(deliveryCharge);
    let setting = await Setting.findOneAndUpdate(
      { key: 'store_settings' },
      { deliveryCharge: chargeNum },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      deliveryCharge: setting.deliveryCharge,
      message: 'Delivery charge updated successfully in database',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
