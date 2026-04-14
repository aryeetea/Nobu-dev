export default function OfflinePage() {
  return (
    <main className="offline-page">
      <section>
        <p>Nobu is resting offline.</p>
        <h1>Reconnect when you are ready.</h1>
        <span>Your app shell is saved on this device.</span>
      </section>
      <style>{`
        .offline-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background:
            radial-gradient(circle at 50% 20%, rgba(124, 58, 237, 0.28), transparent 34%),
            linear-gradient(145deg, #0d0014, #1a0030 70%, #0d0014);
          color: #fff;
          font-family: sans-serif;
          text-align: center;
        }

        .offline-page section {
          display: grid;
          gap: 12px;
          max-width: 460px;
        }

        .offline-page p {
          color: #ffd580;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .offline-page h1 {
          font-size: clamp(34px, 8vw, 72px);
          line-height: 0.95;
          letter-spacing: 0;
        }

        .offline-page span {
          color: rgba(255, 255, 255, 0.66);
          font-size: 15px;
          line-height: 1.5;
        }
      `}</style>
    </main>
  )
}
