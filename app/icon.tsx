import { ImageResponse } from 'next/og'

export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'

export default function Icon() {
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
            border: '10px solid rgba(196, 181, 253, 0.55)',
            borderRadius: 116,
            boxShadow: '0 0 92px rgba(124, 58, 237, 0.72)',
            color: '#ffffff',
            display: 'flex',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 176,
            fontWeight: 700,
            height: 232,
            justifyContent: 'center',
            lineHeight: 1,
            width: 232,
          }}
        >
          N
        </div>
      </div>
    ),
    size
  )
}
