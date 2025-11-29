import React, { useState, useEffect, useMemo } from 'react';
import { Search, DollarSign, TrendingUp, AlertCircle, Filter, RefreshCw } from 'lucide-react';
import { supabase } from './lib/supabase';

const PayoutDashboard = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    country: 'all',
    platform: 'all',
    customerType: 'all',
    status: 'all'
  });

  // Fetch payouts from Supabase on component mount
  useEffect(() => {
    fetchPayouts();
  }, []);

  async function fetchPayouts() {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      setPayouts(data || []);
      console.log('✅ Fetched payouts:', data?.length);
    } catch (err) {
      console.error('❌ Error fetching payouts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Calculate margin for each payout
  const calculateMargin = (payout) => {
    const revenue = payout.wallet_debit_usd || 0;
    const costs = (payout.usd_equivalent || 0) + (payout.extra_fees_usd || 0) + (payout.platform_charges_usd || 0);
    const profit = revenue - costs;
    const marginPercent = revenue > 0 ? (profit / revenue) * 100 : 0;
    return {
      profit,
      marginPercent: marginPercent.toFixed(2)
    };
  };

  // Process natural language search
  const parseNaturalLanguageQuery = (query) => {
    const lower = query.toLowerCase();
    const newFilters = { ...filters };
    
    // Country detection
    if (lower.includes('hong kong')) newFilters.country = 'Hong Kong';
    if (lower.includes('singapore')) newFilters.country = 'Singapore';
    if (lower.includes('china')) newFilters.country = 'China';
    if (lower.includes('uk') || lower.includes('united kingdom')) newFilters.country = 'United Kingdom';
    
    // Platform detection
    if (lower.includes('nium')) newFilters.platform = 'NIUM';
    if (lower.includes('plumter')) newFilters.platform = 'Plumter';
    if (lower.includes('bank')) newFilters.platform = 'Bank Transfer';
    
    // Customer type
    if (lower.includes('aggregator')) newFilters.customerType = 'Aggregator';
    if (lower.includes('sme') || lower.includes('direct')) newFilters.customerType = 'Direct SME';
    
    return newFilters;
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 3) {
      const parsedFilters = parseNaturalLanguageQuery(query);
      setFilters(parsedFilters);
    }
  };

  // Filter payouts
  const filteredPayouts = useMemo(() => {
    return payouts.filter(p => {
      if (filters.country !== 'all' && p.country !== filters.country) return false;
      if (filters.platform !== 'all' && p.platform !== filters.platform) return false;
      if (filters.customerType !== 'all' && p.customer_type !== filters.customerType) return false;
      if (filters.status !== 'all' && p.final_status !== filters.status) return false;
      return true;
    });
  }, [payouts, filters]);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    const totalVolume = filteredPayouts.reduce((sum, p) => sum + (p.usd_equivalent || 0), 0);
    const totalRevenue = filteredPayouts.reduce((sum, p) => sum + (p.wallet_debit_usd || 0), 0);
    const totalCosts = filteredPayouts.reduce((sum, p) => 
      sum + (p.usd_equivalent || 0) + (p.extra_fees_usd || 0) + (p.platform_charges_usd || 0), 0
    );
    const totalProfit = totalRevenue - totalCosts;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    const lowMarginCount = filteredPayouts.filter(p => {
      const margin = p.margin_percent !== null && p.margin_percent !== undefined 
        ? p.margin_percent 
        : calculateMargin(p).marginPercent;
      return parseFloat(margin) < 1;
    }).length;

    return {
      totalVolume,
      avgMargin: avgMargin.toFixed(2),
      payoutCount: filteredPayouts.length,
      lowMarginCount
    };
  }, [filteredPayouts]);

  const uniqueCountries = ['all', ...new Set(payouts.map(p => p.country))];
  const uniquePlatforms = ['all', ...new Set(payouts.map(p => p.platform))];
  const uniqueCustomerTypes = ['all', ...new Set(payouts.map(p => p.customer_type))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <p className="text-gray-600 text-lg">Loading payouts data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchPayouts}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
          <div className="mt-4 text-sm text-gray-500">
            <p>• Check your internet connection</p>
            <p>• Verify Supabase credentials in .env</p>
            <p>• Try disabling browser ad blockers</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payout Analytics</h1>
            <p className="text-gray-600">Monitor payouts, margins, and platform performance</p>
          </div>
          <button 
            onClick={fetchPayouts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Natural Language Search */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder='Try "Show me NIUM payouts to Hong Kong" or "China aggregator payouts"'
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600">
              Active filters: {filters.country !== 'all' && `Country: ${filters.country}`}
              {filters.platform !== 'all' && `, Platform: ${filters.platform}`}
              {filters.customerType !== 'all' && `, Type: ${filters.customerType}`}
            </div>
          )}
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Volume</h3>
              <DollarSign className="text-blue-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${metrics.totalVolume.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Avg Margin</h3>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.avgMargin}%</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Payouts</h3>
              <Filter className="text-purple-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.payoutCount}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Low Margin Alerts</h3>
              <AlertCircle className="text-red-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.lowMarginCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <select
                value={filters.country}
                onChange={(e) => setFilters({...filters, country: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {uniqueCountries.map(c => (
                  <option key={c} value={c}>{c === 'all' ? 'All Countries' : c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
              <select
                value={filters.platform}
                onChange={(e) => setFilters({...filters, platform: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {uniquePlatforms.map(p => (
                  <option key={p} value={p}>{p === 'all' ? 'All Platforms' : p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
              <select
                value={filters.customerType}
                onChange={(e) => setFilters({...filters, customerType: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {uniqueCustomerTypes.map(ct => (
                  <option key={ct} value={ct}>{ct === 'all' ? 'All Types' : ct}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payouts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (USD)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayouts.map((payout) => {
                  const margin = payout.margin_percent !== null && payout.margin_percent !== undefined 
                    ? payout.margin_percent 
                    : parseFloat(calculateMargin(payout).marginPercent);
                  const isLowMargin = margin < 1;
                  
                  return (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payout.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payout.customer_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payout.country}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payout.platform}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(payout.usd_equivalent || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${isLowMargin ? 'text-red-600' : 'text-green-600'}`}>
                          {typeof margin === 'number' ? margin.toFixed(2) : margin}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          payout.final_status === 'Completed' ? 'bg-green-100 text-green-800' :
                          payout.final_status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payout.final_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayoutDashboard;