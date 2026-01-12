"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios-client";
import { useRouter } from "next/navigation";
import { Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Components
import CashFlowCard from "@/components/dashboard/CashFlowCard";
import OccupancyCard from "@/components/dashboard/OccupancyCard";
import IssueStatsCard from "@/components/dashboard/IssueStatsCard";
import ExpiringContractsCard from "@/components/dashboard/ExpiringContractsCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import UnpaidInvoicesList from "@/components/dashboard/UnpaidInvoicesList";
import CycleStatusCard from "@/components/dashboard/CycleStatusCard";
import DashboardActivityFeed from "@/components/dashboard/DashboardActivityFeed";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Data States
  const [cashFlow, setCashFlow] = useState({
    collected: 0,
    debt: 0,
    total: 0,
    growthRate: 0,
  });
  const [occupancy, setOccupancy] = useState({
    total: 0,
    rented: 0,
    available: 0,
    maintenance: 0,
  });
  const [issueStats, setIssueStats] = useState({
    total: 0,
    urgent: 0,
    normal: 0,
  });
  const [expiringContracts, setExpiringContracts] = useState<any[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [cycleStatus, setCycleStatus] = useState({
    totalRooms: 0,
    readingsCompleted: 0,
    invoicesSent: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const currentMonth = format(today, "MM-yyyy");

        // Parallel Fetching for Performance
        const results = await Promise.allSettled([
          axios.get("/buildings"),
          axios.get("/issues"), // Fetch all to be safe
          axios.get("/contracts?isActive=true"),
          axios.get(`/invoices?month=${currentMonth}`), // Current month invoices for cashflow
          axios.get("/transactions/activity?limit=5"),
          axios.get(`/readings/stats/${currentMonth}`),
        ]);

        const [
          buildingsRes,
          issuesRes,
          contractsRes,
          invoicesRes,
          activityRes,
          readingsStatsRes,
        ] = results.map((res) =>
          res.status === "fulfilled" ? res.value : { data: [] }
        );

        // Log errors for debugging
        results.forEach((res, index) => {
          if (res.status === "rejected") {
            const endpoints = [
              "buildings",
              "issues",
              "contracts",
              "invoices",
              "activity",
              "readings",
            ];
            console.error(`Failed to fetch ${endpoints[index]}:`, res.reason);
          }
        });

        // 1. Occupancy Data
        const buildings = Array.isArray(buildingsRes.data)
          ? buildingsRes.data
          : [];
        let totalRooms = 0,
          rented = 0,
          available = 0,
          maintenance = 0;
        let totalActiveRooms = 0;

        buildings.forEach((b: any) => {
          totalRooms += b.totalRooms;
          rented += b.rentedRooms;
          available += b.availableRooms;
          maintenance += b.maintenanceRooms;
          totalActiveRooms += b.rentedRooms;
        });
        setOccupancy({ total: totalRooms, rented, available, maintenance });

        // 2. Issues Data (Active Only)
        // Ensure issuesRes.data is an array. If API returns object, handle it.
        const issuesData = Array.isArray(issuesRes.data) ? issuesRes.data : [];
        // Filter active issues (OPEN or PROCESSING)
        // Filter active issues (OPEN or PROCESSING)
        // setActiveIssues removed, setIssueStats updated later

        // 3. Expiring Contracts
        const contracts = Array.isArray(contractsRes.data)
          ? contractsRes.data
          : [];
        const expiring = contracts
          .filter((c: any) => {
            if (!c.endDate) return false;
            // Calculate difference in days
            const end = new Date(c.endDate);
            const diffTime = end.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 30 && diffDays >= 0;
          })
          .map((c: any) => ({
            id: c.id,
            roomName: c.room?.name,
            tenantName: c.tenant?.name,
            endDate: c.endDate,
          }));
        setExpiringContracts(expiring);

        // 4. Cash Flow (Current Month)
        const currentInvoices = Array.isArray(invoicesRes.data)
          ? invoicesRes.data
          : [];
        let totalRevenue = 0,
          collected = 0,
          debt = 0;
        const unpaidList: any[] = [];
        let invoicesSentCount = 0;

        currentInvoices.forEach((inv: any) => {
          totalRevenue += inv.amount;
          collected += inv.paidAmount;
          invoicesSentCount++;

          if (inv.status !== "PAID") {
            unpaidList.push({
              id: inv.id,
              roomName: inv.room?.name,
              tenantName: inv.contract?.tenant?.name,
              amount: inv.amount,
              paidAmount: inv.paidAmount,
              month: inv.month,
            });
          }
        });
        debt = totalRevenue - collected;
        setCashFlow({ total: totalRevenue, collected, debt, growthRate: 0 });

        setUnpaidInvoices(
          unpaidList.sort(
            (a, b) => b.amount - b.paidAmount - (a.amount - a.paidAmount)
          )
        );

        // 5. Readings Progress
        const readingsData = readingsStatsRes.data || {};
        const readingsCount = readingsData.totalRecords || 0;

        setCycleStatus({
          totalRooms: totalActiveRooms,
          readingsCompleted: readingsCount,
          invoicesSent: invoicesSentCount,
        });

        // 6. Revenue Chart (Historical - 6 Months)
        try {
          const allInvoicesRes = await axios.get("/invoices");
          const allInvoices = Array.isArray(allInvoicesRes.data)
            ? allInvoicesRes.data
            : [];

          // 6. Recent 6 Months Revenue (Stacked: Collected vs Debt) + Growth Rate
          const monthlyRevenue = new Map<
            string,
            { collected: number; debt: number }
          >();
          for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `T${d.getMonth() + 1}`;
            monthlyRevenue.set(key, { collected: 0, debt: 0 });
          }

          allInvoices.forEach((inv: any) => {
            const [m, y] = (inv.month || "").split("-");
            if (m) {
              const key = `T${parseInt(m)}`;
              if (monthlyRevenue.has(key)) {
                const current = monthlyRevenue.get(key)!;
                const paid = inv.paidAmount || 0;
                const debt = (inv.amount || 0) - paid;
                monthlyRevenue.set(key, {
                  collected: current.collected + paid,
                  debt: current.debt + debt,
                });
              }
            }
          });

          // Growth Rate Calculation (Last Month vs Previous)
          const currentMonthKey = `T${today.getMonth() + 1}`;
          const dPrev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const prevMonthKey = `T${dPrev.getMonth() + 1}`;

          const currentData = monthlyRevenue.get(currentMonthKey) || {
            collected: 0,
            debt: 0,
          };
          const prevData = monthlyRevenue.get(prevMonthKey) || {
            collected: 0,
            debt: 0,
          };

          const currentTotal = currentData.collected + currentData.debt;
          const prevTotal = prevData.collected + prevData.debt;
          let growthRate = 0;
          if (prevTotal > 0) {
            growthRate = ((currentTotal - prevTotal) / prevTotal) * 100;
          }
          // Store growth rate in state (modify setCashFlow to include it)
          setCashFlow((prev: any) => ({ ...prev, growthRate }));

          const chartData = Array.from(monthlyRevenue.entries()).map(
            ([label, val]) => ({
              label,
              value: val.collected + val.debt, // Keep value for scaling if needed
              collected: val.collected,
              debt: val.debt,
            })
          );
          setRevenueChartData(chartData);
        } catch (e) {
          console.error("Chart Error", e);
        }

        // 7. Activity Feed & Urgent Issue Logic
        const feedItems: any[] = [];
        let urgentCount = 0;

        // Add Recent Issues
        const allIssues = Array.isArray(issuesData) ? issuesData : [];
        allIssues.forEach((i: any) => {
          // Heuristic for Urgent: Title contains key words
          const isUrgent = /khẩn|gấp|cháy|hư|vỡ|hỏng/i.test(i.title || "");
          if (i.status === "OPEN" || i.status === "PROCESSING") {
            if (isUrgent) urgentCount++;
          }
        });

        // Update Stats with Urgent Breakdown
        // Update Stats with Urgent Breakdown
        const activeCount = allIssues.filter(
          (i: any) => i.status === "OPEN" || i.status === "PROCESSING"
        ).length;
        setIssueStats({
          total: activeCount,
          urgent: urgentCount,
          normal: activeCount - urgentCount,
        });

        allIssues.slice(0, 5).forEach((i: any) => {
          feedItems.push({
            id: `issue-${i.id}`,
            type: "ISSUE",
            title: i.title,
            roomName: i.room?.name ? `Phòng ${i.room.name}` : "Phòng",
            date: new Date(i.createdAt).toISOString(),
            status: i.status,
          });
        });

        // Add Recent Paid Invoices
        if (Array.isArray(currentInvoices)) {
          currentInvoices
            .filter((inv: any) => inv.status === "PAID")
            .slice(0, 5)
            .forEach((inv: any) => {
              feedItems.push({
                id: `inv-${inv.id}`,
                type: "PAYMENT",
                title: `Thanh toán ${new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(inv.amount)}`,
                roomName: inv.room?.name ? `Phòng ${inv.room.name}` : "Khách",
                date: new Date(inv.updatedAt || inv.createdAt).toISOString(),
                amount: inv.amount,
              });
            });
        }

        // Sort and Set
        feedItems.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setActivities(feedItems.slice(0, 10));
      } catch (error) {
        console.error("Failed to load dashboard Data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F9F9F7]">
        <Loader2 className="animate-spin w-10 h-10 text-[#D97757]" />
      </div>
    );
  }

  return (
    <div className="claude-page p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-[#E5E5E0]">
          <div>
            <h1 className="text-3xl md:text-4xl claude-header mb-2">
              Dashboard Vận Hành
            </h1>
            <p className="text-gray-500 font-sans text-lg">
              Tổng quan tình hình kinh doanh tháng{" "}
              {format(new Date(), "MM/yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-[#E5E5E0] shadow-sm">
            <Calendar size={18} className="text-[#D97757]" />
            <span className="text-sm font-semibold text-[#2D2D2C]">
              {format(new Date(), "EEEE, dd MMMM, yyyy", { locale: vi })}
            </span>
          </div>
        </div>

        {/* TOP ROW: 4 MAJOR METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Cash Flow */}
          <CashFlowCard
            collected={cashFlow.collected}
            debt={cashFlow.debt}
            total={cashFlow.total}
            growthRate={cashFlow.growthRate}
          />

          {/* 2. Occupancy */}
          <div
            onClick={() => router.push("/rooms")}
            className="cursor-pointer h-full"
          >
            <OccupancyCard
              total={occupancy.total}
              rented={occupancy.rented}
              available={occupancy.available}
              maintenance={occupancy.maintenance}
            />
          </div>

          {/* 3. Issues */}
          <div
            onClick={() => router.push("/issues")}
            className="cursor-pointer h-full"
          >
            <IssueStatsCard issueStats={issueStats} />
          </div>

          {/* 4. Expiring Contracts */}
          <div
            onClick={() => router.push("/contracts")}
            className="cursor-pointer h-full"
          >
            <ExpiringContractsCard contracts={expiringContracts} />
          </div>
        </div>

        {/* MAIN LAYOUT: 2 COLUMNS (Left Large, Right Small) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Chart */}
            <div className="min-h-[400px]">
              <RevenueChart data={revenueChartData} />
            </div>

            {/* Unpaid Invoices List */}
            <div className="min-h-[400px]">
              <UnpaidInvoicesList
                invoices={unpaidInvoices}
                onViewAll={() =>
                  router.push("/invoices?status=PARTIAL,PUBLISHED,OVERDUE")
                }
              />
            </div>
          </div>

          {/* RIGHT COLUMN (1/3) */}
          <div className="space-y-8">
            {/* Monthly Cycle Status */}
            <CycleStatusCard
              totalRooms={cycleStatus.totalRooms}
              readingsCompleted={cycleStatus.readingsCompleted}
              invoicesSent={cycleStatus.invoicesSent}
              onReadingsClick={() => router.push("/readings")}
              onInvoicesClick={() => router.push("/invoices")}
            />

            {/* Activity Feed */}
            <DashboardActivityFeed
              activities={activities}
              onViewAll={() => router.push("/issues")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
