
export const getDashboard = async (
  req,
  res
) => {
  try {
    const filters = req.query;

    // 🔥 SAB PARALLEL
    const [
      orders,
      customers,
      stores,
      users,
      staff,
    ] = await Promise.all([
      getOrderAnalyticsService(
        req.user,
        filters
      ),

      getCustomerAnalyticsService(
        req.user,
        filters
      ),

      getStoreAnalyticsService(
        req.user,
        filters
      ),

      getUserAnalyticsService(
        req.user,
        filters
      ),

      getStoreStaffAnalyticsService(
        req.user,
        filters
      ),
    ]);

    return res.json({
      success: true,

      dashboard: {
        orders,
        customers,
        stores,
        users,
        staff,
      },
    });
  } catch (error) {
    console.log(
      "Dashboard Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};