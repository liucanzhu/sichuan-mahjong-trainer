interface ResultBannerProps {
  correct: boolean
  message: string
  detail?: string
}

export default function ResultBanner({ correct, message, detail }: ResultBannerProps) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        correct
          ? 'bg-[#0d2818] border-[#2ecc71]/40 text-[#2ecc71]'
          : 'bg-[#1a0a0a] border-[#e74c3c]/40 text-[#e74c3c]'
      }`}
    >
      <div className="font-bold text-lg">{correct ? '✓ ' : '✗ '}{message}</div>
      {detail && <div className="text-sm mt-1 opacity-80">{detail}</div>}
    </div>
  )
}
