'use client'
import { useState, useEffect } from 'react'
import { 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Filter,
  Search,
  Eye,
  Play,
  Pause,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/useToast'

export default function AdminQueuePage() {
  const [queueItems, setQueueItems] = useState([])
  const [stats, setStats] = useState(null)
  const [performance, setPerformance] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showStats, setShowStats] = useState(true)
  const { addToast } = useToast()

  const queueTypes = {
    all: 'All Queues',
    shop_verification: 'Shop Verification',
    product_review: 'Product Review',
    support_ticket: 'Support Ticket',
    payout_processing: 'Payout Processing',
    user_report: 'User Report',
    content_moderation: 'Content Moderation'
  }

  const statusColors = {
    pending: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20',
    processing: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
    completed: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20',
    failed: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20',
    cancelled: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20'
  }

  const priorityColors = {
    low: 'text-gray-600 dark:text-gray-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    high: 'text-orange-600 dark:text-orange-400',
    urgent: 'text-red-600 dark:text-red-400'
  }

  useEffect(() => {
    fetchQueueData()
  }, [selectedType, selectedStatus, searchTerm])

  const fetchQueueData = async () => {
    try {
      setLoading(true)
      
      // Fetch queue items
      const queueResponse = await fetch(`/api/admin/queue?type=${selectedType}&status=${selectedStatus}&search=${searchTerm}`)
      const queueData = await queueResponse.json()
      
      if (queueResponse.ok) {
        setQueueItems(queueData.items || [])
      } else {
        addToast({
          type: 'error',
          message: queueData.error || 'Failed to fetch queue items'
        })
      }

      // Fetch stats
      const statsResponse = await fetch('/api/admin/queue/stats')
      const statsData = await statsResponse.json()
      
      if (statsResponse.ok) {
        setStats(statsData)
      }

      // Fetch performance
      const perfResponse = await fetch('/api/admin/queue/performance')
      const perfData = await perfResponse.json()
      
      if (perfResponse.ok) {
        setPerformance(perfData)
      }
    } catch (error) {
      console.error('Error fetching queue data:', error)
      addToast({
        type: 'error',
        message: 'Failed to fetch queue data'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProcessItem = async (itemId) => {
    try {
      const response = await fetch(`/api/admin/queue/${itemId}/process`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        addToast({
          type: 'success',
          message: 'Queue item processing started'
        })
        fetchQueueData()
      } else {
        addToast({
          type: 'error',
          message: data.error || 'Failed to process item'
        })
      }
    } catch (error) {
      console.error('Error processing queue item:', error)
      addToast({
        type: 'error',
        message: 'Failed to process item'
      })
    }
  }

  const handleCompleteItem = async (itemId) => {
    try {
      const response = await fetch(`/api/admin/queue/${itemId}/complete`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        addToast({
          type: 'success',
          message: 'Queue item completed successfully'
        })
        fetchQueueData()
      } else {
        addToast({
          type: 'error',
          message: data.error || 'Failed to complete item'
        })
      }
    } catch (error) {
      console.error('Error completing queue item:', error)
      addToast({
        type: 'error',
        message: 'Failed to complete item'
      })
    }
  }

  const handleRetryItem = async (itemId) => {
    try {
      const response = await fetch(`/api/admin/queue/${itemId}/retry`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        addToast({
          type: 'success',
          message: 'Queue item retry initiated'
        })
        fetchQueueData()
      } else {
        addToast({
          type: 'error',
          message: data.error || 'Failed to retry item'
        })
      }
    } catch (error) {
      console.error('Error retrying queue item:', error)
      addToast({
        type: 'error',
        message: 'Failed to retry item'
      })
    }
  }

  const filteredItems = queueItems.filter(item => {
    const matchesType = selectedType === 'all' || item.type === selectedType
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus
    const matchesSearch = searchTerm === '' || 
      item.referenceId?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.submittedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesType && matchesStatus && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Queue Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Monitor and manage all queue items
              </p>
            </div>
            
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <TrendingUp size={16} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {showStats ? 'Hide Stats' : 'Show Stats'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {showStats && stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.byStatus.find(s => s._id === 'pending')?.count || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                  <Users className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Processing</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.byStatus.find(s => s._id === 'processing')?.count || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.byStatus.find(s => s._id === 'completed')?.count || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">SLA Breached</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.sla?.breached || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          {performance.length > 0 && (
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Performance Metrics (24h)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {performance.map((metric) => (
                  <div key={metric._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                      {queueTypes[metric._id] || metric._id}
                    </h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Completion Rate:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {metric.completionRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Avg Processing:</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {metric.avgProcessingTime?.toFixed(1) || 0} min
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="Search queue items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            >
              {Object.entries(queueTypes).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue Items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Queue Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Wait Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.referenceId?.name || item.referenceId?.title || `Item #${item.referenceId}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {item.referenceId?._id}
                        </p>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white capitalize">
                        {queueTypes[item.type] || item.type}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium capitalize ${priorityColors[item.priority]}`}>
                        {item.priority}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {item.submittedBy?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.submittedBy?.email}
                        </p>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.position || '-'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.estimatedWaitTime ? `${item.estimatedWaitTime} min` : '-'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/queue/${item._id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <Eye size={16} />
                        </Link>
                        
                        {item.status === 'pending' && (
                          <button
                            onClick={() => handleProcessItem(item._id)}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                            title="Start Processing"
                          >
                            <Play size={16} />
                          </button>
                        )}
                        
                        {item.status === 'processing' && (
                          <button
                            onClick={() => handleCompleteItem(item._id)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            title="Complete"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        
                        {item.status === 'failed' && (
                          <button
                            onClick={() => handleRetryItem(item._id)}
                            className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
                            title="Retry"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No queue items found matching your criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
