import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowDownCircle, ArrowUpCircle, PiggyBank } from "lucide-react";

const data = [
  { name: "Jan", income: 200, expenses: 120 },
  { name: "Feb", income: 250, expenses: 140 },
  { name: "Mar", income: 350, expenses: 180 },
  { name: "Apr", income: 400, expenses: 220 },
  { name: "May", income: 150, expenses: 80 },
  { name: "Jun", income: 280, expenses: 150 },
  { name: "Jul", income: 360, expenses: 200 },
];

export default function TransactionChart() {
  return (
    <div className="bg-purple-50 flex flex-col justify-center h-full p-10">
      <div className="w-[90%] mx-auto flex flex-col justify-center space-y-8">
        {/* Balance Summary */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800">
            Balance Overview
          </h3>
          <p className="text-3xl font-bold text-purple-700 mt-2">$430,000</p>
          <p className="text-sm text-gray-500">
            Track your income and expenses
          </p>
        </div>

        {/* Transactions Chart */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            All Transactions
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="income" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-5">
          <div className="bg-white rounded-xl shadow p-4 flex items-center space-x-3">
            <ArrowUpCircle className="text-green-500 h-7 w-7" />
            <div>
              <p className="text-sm text-gray-500">Income</p>
              <p className="text-lg font-bold text-green-600">$250,000</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 flex items-center space-x-3">
            <ArrowDownCircle className="text-red-500 h-7 w-7" />
            <div>
              <p className="text-sm text-gray-500">Expenses</p>
              <p className="text-lg font-bold text-red-600">$180,000</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 flex items-center space-x-3">
            <PiggyBank className="text-blue-500 h-7 w-7" />
            <div>
              <p className="text-sm text-gray-500">Savings</p>
              <p className="text-lg font-bold text-blue-600">$50,000</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
