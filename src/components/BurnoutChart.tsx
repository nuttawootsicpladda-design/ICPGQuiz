'use client'

interface ChartData {
  emoji: string
  label: string
  value: string
  count: number
  color: string
}

export default function BurnoutChart({
  aggregated,
  maxCount,
  compact = false,
}: {
  aggregated: ChartData[]
  maxCount: number
  compact?: boolean
}) {
  const total = aggregated.reduce((sum, a) => sum + a.count, 0)

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {aggregated.map((item) => (
        <div key={item.value} className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
          {/* Emoji + Label */}
          <div className={`flex items-center gap-1.5 flex-shrink-0 ${compact ? 'w-20' : 'w-28'}`}>
            <span className={compact ? 'text-lg' : 'text-2xl'}>{item.emoji}</span>
            <span className={`text-gray-600 hidden sm:inline ${compact ? 'text-xs' : 'text-sm'}`}>{item.label}</span>
          </div>

          {/* Bar */}
          <div className={`flex-1 bg-gray-100 rounded-full overflow-hidden relative ${compact ? 'h-7' : 'h-9'}`}>
            <div
              className={`h-full ${item.color} rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2`}
              style={{
                width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%`,
                minWidth: item.count > 0 ? '2rem' : '0',
              }}
            >
              {item.count > 0 && (
                <span className={`text-white font-bold ${compact ? 'text-xs' : 'text-sm'}`}>{item.count}</span>
              )}
            </div>
          </div>

          {/* Percentage */}
          <div className={`text-right text-gray-600 flex-shrink-0 font-medium ${compact ? 'w-10 text-xs' : 'w-14 text-sm'}`}>
            {total > 0 ? Math.round((item.count / total) * 100) : 0}%
          </div>
        </div>
      ))}

      {/* Total */}
      <div className={`text-center text-gray-400 pt-1.5 border-t ${compact ? 'text-xs' : 'text-sm'}`}>
        รวม {total} คำตอบ
      </div>
    </div>
  )
}
