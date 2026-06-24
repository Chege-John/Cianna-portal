"use server";

export interface LineChartData {
  month: string;
  revenue: number;
}

export interface UserDistributionItem {
  role: string;
  _count: {
    role: number;
  };
}

export interface WeeklyReservationsData {
  data: { name: string; amount: number }[];
  total: number;
}

// 1. Get Monthly Revenue Trend
export async function getMonthlyRevenue(
  role: string,
  userId: string,
  managedCounties: string[] = []
): Promise<LineChartData[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // High-fidelity realistic mock data
  return [
    { month: "Jan", revenue: 45000 },
    { month: "Feb", revenue: 52000 },
    { month: "Mar", revenue: 49000 },
    { month: "Apr", revenue: 63000 },
    { month: "May", revenue: 58000 },
    { month: "Jun", revenue: 71000 },
    { month: "Jul", revenue: 85000 },
    { month: "Aug", revenue: 79000 },
    { month: "Sep", revenue: 92000 },
    { month: "Oct", revenue: 88000 },
    { month: "Nov", revenue: 105000 },
    { month: "Dec", revenue: 120000 },
  ];
}

// 2. Get Dashboard Stats (User Distribution / Roles)
export async function getDashboardStats(
  role: string,
  userId: string,
  managedCounties: string[] = []
): Promise<{ userDistribution: UserDistributionItem[] }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    userDistribution: [
      { role: "super_admin", _count: { role: 3 } },
      { role: "manager", _count: { role: 12 } },
      { role: "supervisor", _count: { role: 24 } },
      { role: "agent", _count: { role: 85 } },
      { role: "photographer", _count: { role: 18 } },
    ],
  };
}

// 3. Get Weekly Reservations
export async function getWeeklyReservations(
  role: string,
  userId: string,
  managedCounties: string[] = []
): Promise<WeeklyReservationsData> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const data = [
    { name: "Mon", amount: 15 },
    { name: "Tue", amount: 21 },
    { name: "Wed", amount: 18 },
    { name: "Thu", amount: 29 },
    { name: "Fri", amount: 33 },
    { name: "Sat", amount: 42 },
    { name: "Sun", amount: 38 },
  ];

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return { data, total };
}

// 4. Get Property Types Distribution
export async function getPropertyTypes(
  role: string,
  userId: string,
  managedCounties: string[] = []
) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return [
    { label: "Apartments", value: 55 },
    { label: "Villas", value: 20 },
    { label: "Penthouses", value: 15 },
    { label: "Studios", value: 10 },
  ];
}

// 5. Get Payment Status Mix
export async function getPaymentStatus(
  role: string,
  userId: string,
  managedCounties: string[] = []
) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return [
    { label: "Paid", value: 75 },
    { label: "Pending", value: 18 },
    { label: "Failed", value: 7 },
  ];
}

// 6. Get Top Apartments Revenue
export async function getTopApartments(
  role: string,
  userId: string,
  managedCounties: string[] = []
) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return [
    { name: "Cianna Heights A1", revenue: 45000 },
    { name: "Oakwood Residency", revenue: 38000 },
    { name: "Riverside Penthouse", revenue: 35000 },
    { name: "Valley View Studio", revenue: 28000 },
    { name: "Skyline Suite", revenue: 22000 },
  ];
}
