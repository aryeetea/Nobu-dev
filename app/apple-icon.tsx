import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#000000',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            background: 'radial-gradient(circle at 32% 28%, #c4b5fd 0%, #7c3aed 44%, #2e1065 100%)',
            border: '4px solid rgba(196, 181, 253, 0.55)',
            borderRadius: 40,
            boxShadow: '0 0 34px rgba(124, 58, 237, 0.72)',
            color: '#ffffff',
            display: 'flex',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 62,
            fontWeight: 700,
            height: 80,
            justifyContent: 'center',
            lineHeight: 1,
            width: 80,
          }}
        >
          N
        </div>
      </div>
    ),
    size
  )
}
