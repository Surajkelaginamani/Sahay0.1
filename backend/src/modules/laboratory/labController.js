import DiagnosticOrder from '../../models/DiagnosticOrder.js';
import DiagnosticReport from '../../models/DiagnosticReport.js';

// @desc    Aggregates counts of DiagnosticOrders grouped by status for user's facilityId
// @route   GET /api/lab/metrics
// @access  Private (LabHead)
export const getLabMetrics = async (req, res) => {
  try {
    const facilityId = req.user.hospitalId;
    if (!facilityId) {
      return res.status(400).json({ message: 'User is not linked to any healthcare facility.' });
    }

    const counts = await DiagnosticOrder.aggregate([
      { $match: { facilityId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const metrics = {
      Ordered: 0,
      SampleCollected: 0,
      Processing: 0,
      Completed: 0,
      total: 0,
    };

    counts.forEach((item) => {
      if (metrics.hasOwnProperty(item._id)) {
        metrics[item._id] = item.count;
      }
      metrics.total += item.count;
    });

    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error fetching lab metrics:', error);
    res.status(500).json({ message: error.message || 'Server error fetching lab metrics' });
  }
};

// @desc    Fetches all DiagnosticOrders for the user's facilityId sorted by date
// @route   GET /api/lab/queue
// @access  Private (LabHead)
export const getTestQueue = async (req, res) => {
  try {
    const facilityId = req.user.hospitalId;
    if (!facilityId) {
      return res.status(400).json({ message: 'User is not linked to any healthcare facility.' });
    }

    const { status } = req.query;
    const query = { facilityId };
    if (status) {
      query.status = status;
    }

    const queue = await DiagnosticOrder.find(query)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email')
      .sort({ orderDate: -1, createdAt: -1 });

    res.status(200).json(queue);
  } catch (error) {
    console.error('Error fetching test queue:', error);
    res.status(500).json({ message: error.message || 'Server error fetching test queue' });
  }
};

// @desc    Updates the status of a specific order
// @route   PUT /api/lab/orders/:id/status
// @access  Private (LabHead)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const facilityId = req.user.hospitalId;

    const validStatuses = ['Ordered', 'SampleCollected', 'Processing', 'Completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const order = await DiagnosticOrder.findOne({ _id: id, facilityId });
    if (!order) {
      return res.status(404).json({ message: 'Diagnostic order not found for this facility.' });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: error.message || 'Server error updating order status' });
  }
};

// @desc    Creates a new DiagnosticReport linked to an order and marks order as Completed
// @route   POST /api/lab/reports
// @access  Private (LabHead)
export const submitReport = async (req, res) => {
  try {
    const facilityId = req.user.hospitalId;
    const { orderId, resultText, fileUrl, verificationStatus } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required to submit a report.' });
    }

    const order = await DiagnosticOrder.findOne({ _id: orderId, facilityId });
    if (!order) {
      return res.status(404).json({ message: 'Associated diagnostic order not found for this facility.' });
    }

    const report = await DiagnosticReport.create({
      orderId: order._id,
      patientId: order.patientId,
      labHeadId: req.user._id,
      resultText: resultText || '',
      fileUrl: fileUrl || '',
      verificationStatus: verificationStatus || 'Pending',
      completedDate: new Date(),
    });

    order.status = 'Completed';
    await order.save();

    res.status(201).json({
      message: 'Diagnostic report submitted and order marked as Completed.',
      report,
      order,
    });
  } catch (error) {
    console.error('Error submitting diagnostic report:', error);
    res.status(500).json({ message: error.message || 'Server error submitting report' });
  }
};
