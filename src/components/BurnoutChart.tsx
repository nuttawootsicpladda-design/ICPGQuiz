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
}: {
  aggregated: ChartData[]
  maxCount: number
}) {
  const total = aggregated.reduce((sum, a) => sum + a.count, 0)

  return (
    <div className="space-y-4">
      {aggregated.map((item) => (
        <div key={item.value} className="flex items-center gap-3">
          {/* Emoji + Label */}
          <div className="w-28 flex items-center gap-2 flex-shrink-0">
            <span className="text-3xl">{item.emoji}</span>
            <span className="text-sm text-gray-600 hidden sm:inline">{item.label}</span>
          </div>

          {/* Bar */}
          <div className="flex-1 h-10 bg-gray-100 rounded-full overflow-hidden relative">
            <div
              className={`h-full ${item.color} rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-3`}
              style={{
                width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%`,
                minWidth: item.count > 0 ? '2.5rem' : '0',
              }}
            >
              {item.count > 0 && (
                <span className="text-white font-bold text-sm">{item.count}</span>
              )}
            </div>
          </div>

          {/* Percentage */}
          <div className="w-14 text-right text-sm text-gray-600 flex-shrink-0 font-medium">
            {total > 0 ? Math.round((item.count / total) * 100) : 0}%
          </div>
        </div>
      ))}

      {/* Total */}
      <div className="text-center text-sm text-gray-400 pt-2 border-t">
        รวม {total} คำตอบ
      </div>
    </div>
  )
}
