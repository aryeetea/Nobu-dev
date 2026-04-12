import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type ElevenLabsConvaiProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement> & {
    'agent-id'?: string
  },
  HTMLElement
>

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': ElevenLabsConvaiProps
    }
  }
}
