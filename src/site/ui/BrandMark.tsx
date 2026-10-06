// The camera without its lens, which only the front one shows.
const CAMERA_BODY =
  'M16.6 30.8A16.7 16.7 0 1 1 50 30.8A16.7 16.7 0 1 1 16.6 30.8ZM47.9 28.1A23.1 23.1 0 1 1 94.1 28.1A23.1 23.1 0 1 1 47.9 28.1ZM33.3 30.8L71 28.1L71 47L33.3 47ZM17 45H86A7 7 0 0 1 93 52V92A7 7 0 0 1 86 99H17A7 7 0 0 1 10 92V52A7 7 0 0 1 17 45Z'
const LENS = 'M88 63.4L113 52.7Q119 50.2 119 56.7L119 87.3Q119 93.8 113 91.3L88 80.6Z'

// Back to front, in the brand's echo colours for a dark background.
const ECHOES = [
  { fill: '#2B4485', transform: 'translate(-32.8147 10.5635) scale(0.681472)' },
  { fill: '#6E86C4', transform: 'translate(-21.744 7.7312) scale(0.7744)' },
  { fill: '#C9D3EC', transform: 'translate(-10.8 4.24) scale(0.88)' },
]

// The package's off-white-on-transparent logo, cropped to the drawing.
export function BrandMark({ className = 'h-[22px] w-auto flex-none md:h-[26px]' }) {
  return (
    <svg viewBox="-26.5 4.5 146 95" className={className} aria-hidden>
      {ECHOES.map((echo) => (
        <path key={echo.fill} d={CAMERA_BODY} fill={echo.fill} transform={echo.transform} />
      ))}
      <path d={CAMERA_BODY + LENS} fill="#F5F3EE" />
    </svg>
  )
}
